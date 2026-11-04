import type { Pool } from 'pg';
import { CvRepository, cvDto, cvMissing } from './repository.js';
import type { CvStorage } from './storage.js';
import type { CvUpload } from './upload.js';

export class CvService {
  readonly repository: CvRepository;
  constructor(
    pool: Pool,
    readonly storage: CvStorage,
  ) {
    this.repository = new CvRepository(pool);
  }
  async metadata(owner: string) {
    const row = await this.repository.get(owner);
    if (!row) throw cvMissing();
    return cvDto(row);
  }
  async download(owner: string) {
    const row = await this.repository.get(owner);
    if (!row) throw cvMissing();
    return this.storage.open(row.storage_key);
  }
  async replace(owner: string, upload: CvUpload) {
    let key: string;
    try {
      key = await this.storage.promote(upload.temp.key);
    } catch (error) {
      await this.storage.discardTemp(upload.temp.key).catch(() => undefined);
      throw error;
    }
    let result: Awaited<ReturnType<CvRepository['replace']>>;
    try {
      result = await this.repository.replace(
        owner,
        key,
        upload.originalName,
        upload.temp.sizeBytes,
      );
    } catch (error) {
      // A failed DB commit cannot remove the previous active CV.
      // If deletion fails, the orphan scanner will retry after its grace period.
      await this.storage.remove(key).catch(() => undefined);
      throw error;
    }
    const cleanupPending = result.oldKey ? !(await this.cleanKey(result.oldKey)) : false;
    return { metadata: cvDto(result.current), cleanupPending };
  }
  async delete(owner: string) {
    const oldKey = await this.repository.detach(owner);
    return oldKey ? !(await this.cleanKey(oldKey)) : false;
  }
  private async cleanKey(key: string): Promise<boolean> {
    try {
      if (await this.repository.isReferenced(key)) return false;
      await this.storage.remove(key);
      await this.repository.clearPending(key);
      return true;
    } catch {
      return false;
    }
  }
  async reconcile() {
    for (const key of await this.repository.pendingKeys()) await this.cleanKey(key);
    const threshold = Date.now() - 10 * 60_000;
    for (const entry of await this.storage.listOrphans()) {
      if (entry.createdAt.getTime() < threshold && !(await this.repository.isReferenced(entry.key)))
        await this.storage.remove(entry.key).catch(() => undefined);
    }
    for (const entry of await this.storage.listTemp()) {
      if (entry.createdAt.getTime() < threshold)
        await this.storage.discardTemp(entry.key).catch(() => undefined);
    }
  }
}
