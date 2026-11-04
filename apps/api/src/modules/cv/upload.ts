import Busboy from 'busboy';
import type { Request } from 'express';
import { HttpError } from '../../platform/errors/http-error.js';
import { MAX_CV_BYTES, type CvStorage, type StoredTemp } from './storage.js';

export interface CvUpload {
  readonly originalName: string;
  readonly temp: StoredTemp;
}
function invalid(): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Adjunta exactamente un archivo PDF válido.',
  });
}
function unsupported(): HttpError {
  return new HttpError({
    status: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'El archivo debe ser un PDF.',
  });
}
export async function receiveCv(request: Request, storage: CvStorage): Promise<CvUpload> {
  const contentType = request.get('Content-Type') ?? '';
  if (!/^multipart\/form-data\s*;/iu.test(contentType)) throw unsupported();
  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({
      headers: request.headers,
      preservePath: true,
      limits: { files: 2, fields: 1, parts: 2, fileSize: MAX_CV_BYTES + 1 },
    });
  } catch {
    throw invalid();
  }
  let count = 0;
  let originalName = '';
  let issue: HttpError | undefined;
  let temp: StoredTemp | undefined;
  const tasks: Promise<void>[] = [];
  const markInvalid = () => {
    issue ??= invalid();
  };
  parser.on('file', (name, file, info) => {
    count++;
    if (count !== 1 || name !== 'file') {
      markInvalid();
      file.resume();
      return;
    }
    originalName = info.filename ?? '';
    if (!originalName || originalName.length > 255 || /[\r\n/\\]/u.test(originalName))
      issue ??= invalid();
    else if (!/\.pdf$/iu.test(originalName) || info.mimeType !== 'application/pdf')
      issue ??= unsupported();
    if (issue) {
      file.resume();
      return;
    }
    tasks.push(
      storage
        .writeTemp(file)
        .then((written) => {
          temp = written;
        })
        .catch((error: unknown) => {
          issue ??= error instanceof HttpError ? error : invalid();
        }),
    );
  });
  parser.on('field', markInvalid);
  parser.on('filesLimit', markInvalid);
  parser.on('fieldsLimit', markInvalid);
  parser.on('partsLimit', markInvalid);
  const finished = new Promise<void>((resolve, reject) => {
    parser.on('close', resolve);
    parser.on('error', () => reject(invalid()));
    request.on('aborted', () => reject(invalid()));
    request.on('error', () => reject(invalid()));
  });
  request.pipe(parser);
  try {
    await finished;
    await Promise.all(tasks);
    if (!issue && (count !== 1 || !temp || temp.sizeBytes === 0)) issue = invalid();
    if (!issue && !temp!.signatureValid) issue = unsupported();
    if (issue) throw issue;
    return { originalName, temp: temp! };
  } catch (error) {
    if (temp) await storage.discardTemp(temp.key).catch(() => undefined);
    if (error instanceof HttpError) throw error;
    throw invalid();
  }
}
