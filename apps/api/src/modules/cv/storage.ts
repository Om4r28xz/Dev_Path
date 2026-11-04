import { createWriteStream } from 'node:fs';
import { mkdir, open, readdir, rename, stat, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { HttpError } from '../../platform/errors/http-error.js';

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export interface StoredTemp {
  readonly key: string;
  readonly sizeBytes: number;
  readonly signatureValid: boolean;
}
export interface CvStorage {
  writeTemp(source: Readable): Promise<StoredTemp>;
  promote(tempKey: string): Promise<string>;
  discardTemp(tempKey: string): Promise<void>;
  open(key: string): Promise<Readable>;
  remove(key: string): Promise<void>;
  listOrphans(): Promise<Array<{ key: string; createdAt: Date }>>;
  listTemp(): Promise<Array<{ key: string; createdAt: Date }>>;
}
function unavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder al almacenamiento del CV.',
  });
}
function pathFor(root: string, key: string, suffix: string): string {
  if (!/^[0-9a-f-]{36}$/u.test(key)) throw unavailable();
  return join(root, key + suffix);
}
export class LocalCvStorage implements CvStorage {
  private readonly tempDir: string;
  private readonly filesDir: string;
  constructor(root: string) {
    const absolute = resolve(root);
    this.tempDir = join(absolute, 'temp');
    this.filesDir = join(absolute, 'files');
  }
  async prepare() {
    try {
      await mkdir(this.tempDir, { recursive: true, mode: 0o700 });
      await mkdir(this.filesDir, { recursive: true, mode: 0o700 });
    } catch {
      throw unavailable();
    }
  }
  async writeTemp(source: Readable): Promise<StoredTemp> {
    const key = randomUUID();
    const path = pathFor(this.tempDir, key, '.part');
    let sizeBytes = 0;
    const header = Buffer.alloc(5);
    let headerBytes = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        sizeBytes += chunk.length;
        if (sizeBytes > MAX_CV_BYTES) {
          callback(
            new HttpError({
              status: 413,
              code: 'PAYLOAD_TOO_LARGE',
              message: 'El PDF supera 5 MiB.',
            }),
          );
          return;
        }
        const copied = Math.min(5 - headerBytes, chunk.length);
        if (copied > 0) {
          chunk.copy(header, headerBytes, 0, copied);
          headerBytes += copied;
        }
        callback(null, chunk);
      },
    });
    try {
      await this.prepare();
      await pipeline(source, counter, createWriteStream(path, { flags: 'wx', mode: 0o600 }));
      return {
        key,
        sizeBytes,
        signatureValid: headerBytes === 5 && header.equals(Buffer.from('%PDF-')),
      };
    } catch (error) {
      await unlink(path).catch(() => undefined);
      if (error instanceof HttpError) throw error;
      throw unavailable();
    }
  }
  async promote(tempKey: string): Promise<string> {
    const key = randomUUID();
    try {
      await rename(pathFor(this.tempDir, tempKey, '.part'), pathFor(this.filesDir, key, '.pdf'));
      return key;
    } catch {
      throw unavailable();
    }
  }
  async discardTemp(tempKey: string): Promise<void> {
    try {
      await unlink(pathFor(this.tempDir, tempKey, '.part'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw unavailable();
    }
  }
  async open(key: string): Promise<Readable> {
    try {
      const path = pathFor(this.filesDir, key, '.pdf');
      const handle = await open(path, 'r');
      return handle.createReadStream({ autoClose: true });
    } catch {
      throw unavailable();
    }
  }
  async remove(key: string): Promise<void> {
    try {
      await unlink(pathFor(this.filesDir, key, '.pdf'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw unavailable();
    }
  }
  async listOrphans(): Promise<Array<{ key: string; createdAt: Date }>> {
    return this.list(this.filesDir, '.pdf');
  }
  async listTemp(): Promise<Array<{ key: string; createdAt: Date }>> {
    return this.list(this.tempDir, '.part');
  }
  private async list(
    dir: string,
    suffix: string,
  ): Promise<Array<{ key: string; createdAt: Date }>> {
    try {
      const entries = await readdir(dir);
      const files = entries.filter(
        (entry) =>
          /^[0-9a-f-]{36}$/u.test(entry.slice(0, -suffix.length)) && entry.endsWith(suffix),
      );
      return Promise.all(
        files.map(async (entry) => {
          const info = await stat(join(dir, entry));
          return { key: entry.slice(0, -suffix.length), createdAt: info.mtime };
        }),
      );
    } catch {
      throw unavailable();
    }
  }
}
