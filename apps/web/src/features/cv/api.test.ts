import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiResponse } from '../../lib/http/client.js';
import { deleteCv, downloadCv, uploadCv } from './api.js';

vi.mock('../../lib/http/client.js', () => ({
  ApiError: class ApiError extends Error {},
  apiResponse: vi.fn(),
}));

const response = (body: unknown, cleanup = false) =>
  new Response(body instanceof Blob ? body : JSON.stringify(body), {
    status: 200,
    headers: { 'X-File-Cleanup-Pending': String(cleanup) },
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CV API client', () => {
  it('uploads FormData without setting a multipart boundary and reports deferred cleanup', async () => {
    vi.mocked(apiResponse).mockResolvedValueOnce(
      response(
        {
          id: '1',
          originalName: 'cv.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 9,
          createdAt: '2026-01-01T00:00:00Z',
        },
        true,
      ),
    );
    const result = await uploadCv(new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' }));
    const [path, init] = vi.mocked(apiResponse).mock.calls[0]!;
    expect(path).toBe('/api/v1/me/cv');
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.headers).toBeUndefined();
    expect(result.cleanupPending).toBe(true);
  });

  it('downloads through the authenticated API path and always revokes the Blob URL', async () => {
    vi.mocked(apiResponse).mockResolvedValueOnce(response(new Blob(['%PDF-1.7'])));
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:private-cv');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const link = { href: '', download: '', hidden: false, click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => link),
      body: { append: vi.fn() },
    });
    await downloadCv();
    expect(apiResponse).toHaveBeenCalledWith('/api/v1/me/cv/download');
    expect(create).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:private-cv');
    expect(link.download).toBe('cv.pdf');
  });

  it('uses an idempotent authenticated delete and exposes cleanup state', async () => {
    vi.mocked(apiResponse).mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await deleteCv()).toEqual({ cleanupPending: false });
    expect(apiResponse).toHaveBeenCalledWith('/api/v1/me/cv', { method: 'DELETE' });
  });
});
