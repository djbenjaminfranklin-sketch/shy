import {
  uploadProfilePhoto,
  uploadVerificationPhoto,
  deleteProfilePhoto,
  uploadMultiplePhotos,
  replaceUserPhotos,
} from './photos';
import { uploadProfileVideo } from './videos';

export type { ModerationStatus, ModerationResult } from './helpers';

export const storageService = {
  uploadProfilePhoto,
  uploadProfileVideo,
  uploadVerificationPhoto,
  deleteProfilePhoto,
  uploadMultiplePhotos,
  replaceUserPhotos,
};

export default storageService;
