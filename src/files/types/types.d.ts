import { Express } from 'express';

export interface MultiUploadParams {
  files: Express.Multer.File[];
  keys: string[];
  path: string;
}

export interface UploadResult {
  url: string;
  key: string;
}
