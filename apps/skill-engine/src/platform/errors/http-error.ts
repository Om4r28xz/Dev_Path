export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_SERVICE_CREDENTIAL'
  | 'CATALOG_VERSION_MISMATCH'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR';

export interface HttpErrorOptions {
  readonly code: ErrorCode;
  readonly message: string;
  readonly status: number;
  readonly fields?: Readonly<Record<string, readonly string[]>>;
  readonly headers?: Readonly<Record<string, string>>;
}

export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields: Readonly<Record<string, readonly string[]>> | undefined;
  readonly headers: Readonly<Record<string, string>> | undefined;

  constructor(options: HttpErrorOptions) {
    super(options.message);
    this.name = 'HttpError';
    this.code = options.code;
    this.status = options.status;
    this.fields = options.fields;
    this.headers = options.headers;
  }
}
