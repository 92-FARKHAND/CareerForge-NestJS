// file-storage/file-storage.interface.ts

export interface StorageUploadOptions {
  folder?: string;
  originalFileName?: string;
  mimeType?: string;
}

export interface StorageUploadResult {
  provider: string;
  key: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  bytes: number;
}

export interface FileStorage {
  upload(
    buffer: Buffer,
    options?: StorageUploadOptions,
  ): Promise<StorageUploadResult>;

  delete(
    storageKey: string,
  ): Promise<void>;
}