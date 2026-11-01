const SENSITIVE_KEY = /authorization|cookie|password|secret|token|api[-_]?key/iu;
const BEARER_VALUE = /\bBearer\s+[^\s,;]+/giu;

export type LogContext = Readonly<Record<string, unknown>>;

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export interface LogOutput {
  info(line: string): void;
  warn(line: string): void;
  error(line: string): void;
}

export interface LoggerOptions {
  readonly environment: string;
  readonly includeErrorStack?: boolean;
  readonly output?: LogOutput;
  readonly service: string;
}

const consoleOutput: LogOutput = {
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

export function createLogger(options: LoggerOptions): Logger {
  const output = options.output ?? consoleOutput;

  function write(level: 'info' | 'warn' | 'error', message: string, context?: LogContext): void {
    const record = redactValue(
      {
        timestamp: new Date().toISOString(),
        level,
        service: options.service,
        environment: options.environment,
        message,
        ...(context ?? {}),
      },
      options.includeErrorStack === true,
    );

    output[level](JSON.stringify(record));
  }

  return {
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
  };
}

function redactValue(
  value: unknown,
  includeErrorStack: boolean,
  key?: string,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (key !== undefined && SENSITIVE_KEY.test(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return value.replace(BEARER_VALUE, 'Bearer [REDACTED]');
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.replace(BEARER_VALUE, 'Bearer [REDACTED]'),
      ...(includeErrorStack && value.stack !== undefined
        ? { stack: value.stack.replace(BEARER_VALUE, 'Bearer [REDACTED]') }
        : {}),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, includeErrorStack, undefined, seen));
  }

  const redacted: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    redacted[entryKey] = redactValue(entryValue, includeErrorStack, entryKey, seen);
  }
  return redacted;
}
