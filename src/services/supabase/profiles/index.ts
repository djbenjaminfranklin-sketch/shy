import { createProfile, getProfile, updateProfile } from './crud';
import { getDiscoverProfiles } from './discover';
import { updateLocation, hideLocation, updateLastActive, deleteProfile } from './location';

export type { CreateProfileData, UpdateProfileData } from './crud';

export const profilesService = {
  createProfile,
  getProfile,
  updateProfile,
  updateLocation,
  hideLocation,
  getDiscoverProfiles,
  updateLastActive,
  deleteProfile,
};

export default profilesService;
