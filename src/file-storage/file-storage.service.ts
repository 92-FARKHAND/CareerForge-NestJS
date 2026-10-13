// file-storage/file-storage.service.ts

import { Injectable } from '@nestjs/common';

import {
  CloudinaryStorage,
  StorageUploadOptions,
  StorageUploadResult,
} from './cloudinary.storage';
import { FileStorage } from './file-storage.interface';

@Injectable()
export class FileStorageService implements FileStorage {
  constructor(
    private readonly cloudinaryStorage: CloudinaryStorage,
  ) {}

  /**
   * Upload a file.
   *
   * The rest of the application does not need
   * to know that Cloudinary is being used.
   */
  async upload(
    buffer: Buffer,
    options: StorageUploadOptions = {},
  ): Promise<StorageUploadResult> {
    return this.cloudinaryStorage.upload(
      buffer,
      options,
    );
  }

  /**
   * Delete a file.
   */
  async delete(
    storageKey: string,
  ): Promise<void> {
    return this.cloudinaryStorage.delete(
      storageKey,
    );
  }
}