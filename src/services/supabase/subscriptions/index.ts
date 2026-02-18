import { getUserSubscription, getUserLimits } from './queries';
import { checkFeature, getAutoReplySettings, saveAutoReplySettings } from './features';
import {
  incrementLikes,
  incrementMessages,
  incrementSuperLikes,
  incrementRewinds,
  incrementQuickMeetProposals,
} from './actions';

export const subscriptionsService = {
  getUserSubscription,
  getUserLimits,
  incrementLikes,
  incrementMessages,
  checkFeature,
  getAutoReplySettings,
  saveAutoReplySettings,
  incrementSuperLikes,
  incrementRewinds,
  incrementQuickMeetProposals,
};

export default subscriptionsService;
