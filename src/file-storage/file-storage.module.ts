// file-storage/file-storage.module.ts

import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { CloudinaryStorage } from './cloudinary.storage';

import { FileStorageService } from './file-storage.service';

@Module({
  imports: [
    ConfigModule,
  ],

  providers: [
    CloudinaryStorage,
    FileStorageService,
  ],

  exports: [
    FileStorageService,
  ],
})
export class FileStorageModule {}