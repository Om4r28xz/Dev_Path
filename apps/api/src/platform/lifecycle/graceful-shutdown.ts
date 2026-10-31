import type { Server } from 'node:http';

import type { Logger } from '../logging/logger.js';

export interface RuntimeResource {
  readonly name: string;
  close(): Promise<void>;
}

export interface GracefulShutdownOptions {
  readonly logger: Logger;
  readonly resources?: readonly RuntimeResource[];
  readonly timeoutMs: number;
}

export function installGracefulShutdown(
  server: Server,
  options: GracefulShutdownOptions,
): () => Promise<void> {
  let shutdownPromise: Promise<void> | undefined;

  const shutdown = (signal = 'manual'): Promise<void> => {
    shutdownPromise ??= runShutdown(server, signal, options);
    return shutdownPromise;
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  return shutdown;
}

async function runShutdown(
  server: Server,
  signal: string,
  options: GracefulShutdownOptions,
): Promise<void> {
  options.logger.info('API shutdown started.', { signal });

  const forcedClose = setTimeout(() => {
    options.logger.error('API shutdown exceeded its deadline.', { signal });
    server.closeAllConnections();
  }, options.timeoutMs);
  forcedClose.unref();

  try {
    server.closeIdleConnections();
    await closeServer(server);

    const resourceResults = await Promise.allSettled(
      (options.resources ?? []).map(async (resource) => {
        await resource.close();
        options.logger.info('Runtime resource closed.', { resource: resource.name });
      }),
    );

    const failedResources = resourceResults.filter((result) => result.status === 'rejected');
    if (failedResources.length > 0) {
      throw new AggregateError(failedResources, 'One or more runtime resources failed to close.');
    }

    options.logger.info('API shutdown completed.', { signal });
    process.exitCode = 0;
  } catch (error) {
    options.logger.error('API shutdown failed.', { signal, error });
    process.exitCode = 1;
  } finally {
    clearTimeout(forcedClose);
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }

      reject(error);
    });
  });
}
