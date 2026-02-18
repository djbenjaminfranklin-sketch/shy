import { getConversations, getMessages, markAsRead, getConversationByMatchId, getOtherUserInConversation } from './queries';
import { sendMessage } from './send';
import { checkAndSendAutoReply } from './autoReply';
import { subscribeToMessages, unsubscribeFromMessages } from './realtime';

export const messagesService = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
  unsubscribeFromMessages,
  checkAndSendAutoReply,
  getConversationByMatchId,
  getOtherUserInConversation,
};

export default messagesService;
