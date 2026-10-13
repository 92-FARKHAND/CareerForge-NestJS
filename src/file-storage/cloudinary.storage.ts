// file-storage/cloudinary.storage.ts

import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

import { Readable } from 'stream';
import { FileStorage } from './file-storage.interface';

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

@Injectable()
export class CloudinaryStorage implements FileStorage {
  constructor(
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name:
        this.configService.getOrThrow<string>(
          'CLOUDINARY_NAME',
        ),

      api_key:
        this.configService.getOrThrow<string>(
          'CLOUDINARY_API_KEY',
        ),

      api_secret:
        this.configService.getOrThrow<string>(
          'CLOUDINARY_API_SECRET',
        ),
    });
  }

  /**
   * Upload a file buffer to Cloudinary.
   */
  async upload(
    buffer: Buffer,
    options: StorageUploadOptions = {},
  ): Promise<StorageUploadResult> {
    console.log("Uploading to Cloudinary...");
    const folder =
      options.folder ?? 'uploads';

    const publicId =
      this.generatePublicId(
        options.originalFileName,
      );

    return new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: publicId,
              // PDF/DOCX are treated as raw files.
              resource_type: 'raw',
            },
            
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error || !result) {
                
                return reject(
                  new InternalServerErrorException(
                    'Failed to upload file to Cloudinary',
                  ),
                );
              }

              resolve({
                provider: 'cloudinary',

                // This is what we store in Resume.storageKey.
                key: result.public_id,

                url: result.url,

                secureUrl:
                  result.secure_url,

                resourceType:
                  result.resource_type,

                bytes: result.bytes,
              });
              
            },
          );

        Readable.from(buffer).pipe(
          uploadStream,
        );
      },
    );
  }

  /**
   * Delete a file from Cloudinary.
   */
  async delete(
    storageKey: string,
  ): Promise<void> {
    await new Promise<void>(
      (resolve, reject) => {
        cloudinary.uploader.destroy(
          storageKey,
          {
            resource_type: 'raw',
          },

          (
            error,
            result,
          ) => {
            if (error) {
              return reject(error);
            }

            // Cloudinary can return:
            // "ok"
            // "not found"
            //
            // "not found" is considered successful
            // cleanup from our application's perspective.
            if (
              result?.result !== 'ok' &&
              result?.result !== 'not found'
            ) {
              return reject(
                new Error(
                  `Cloudinary deletion failed: ${result?.result}`,
                ),
              );
            }

            resolve();
          },
        );
      },
    );
  }

  /**
   * Generate a safe Cloudinary public ID.
   */
  private generatePublicId(
    originalFileName?: string,
  ): string {
    const baseName =
      originalFileName
        ?.replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase() ||
      'resume';

    return `${baseName}-${Date.now()}`;
  }
}