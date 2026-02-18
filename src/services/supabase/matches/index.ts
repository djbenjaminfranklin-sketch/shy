import { createInstantConnection, likeProfile, passProfile, unmatch, checkMatch } from './connections';
import { getMatches } from './conversations';
import { getReceivedLikes } from './likes';

export const matchesService = {
  createInstantConnection,
  likeProfile,
  passProfile,
  getMatches,
  unmatch,
  getReceivedLikes,
  checkMatch,
};

export default matchesService;
