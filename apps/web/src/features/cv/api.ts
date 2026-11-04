import { ApiError, apiResponse } from '../../lib/http/client.js';

export interface CvMetadata {
  id: string;
  originalName: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  createdAt: string;
}

export interface CvMutationResult {
  metadata?: CvMetadata;
  cleanupPending: boolean;
}

function cleanupPending(response: Response): boolean {
  return response.headers.get('X-File-Cleanup-Pending') === 'true';
}

export async function loadCv(signal?: AbortSignal): Promise<CvMetadata | null> {
  try {
    return (await (
      await apiResponse('/api/v1/me/cv', signal ? { signal } : {})
    ).json()) as CvMetadata;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function uploadCv(file: File): Promise<CvMutationResult> {
  const body = new FormData();
  body.append('file', file);
  const response = await apiResponse('/api/v1/me/cv', { method: 'PUT', body });
  return {
    metadata: (await response.json()) as CvMetadata,
    cleanupPending: cleanupPending(response),
  };
}

export async function downloadCv(): Promise<void> {
  const response = await apiResponse('/api/v1/me/cv/download');
  const url = URL.createObjectURL(await response.blob());
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cv.pdf';
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function deleteCv(): Promise<CvMutationResult> {
  const response = await apiResponse('/api/v1/me/cv', { method: 'DELETE' });
  return { cleanupPending: cleanupPending(response) };
}
