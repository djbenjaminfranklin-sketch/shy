import type {
  Invitation,
  InvitationWithProfile,
  Connection,
  ConnectionWithProfile,
} from '../../../types/match';
import { sendInvitation } from './send';
import { acceptInvitation, refuseInvitation } from './receive';
import {
  getSentInvitations,
  getReceivedInvitations,
  getDailyInvitationCount,
  checkExistingInvitation,
} from './queries';
import {
  getConnections,
  removeConnection,
  markInvitationsAsSeen,
  getUnseenInvitationsCount,
} from './connections';

export const invitationsService = {
  sendInvitation(
    senderId: string,
    receiverId: string
  ): Promise<{ invitation: Invitation | null; error: string | null }> {
    return sendInvitation(senderId, receiverId);
  },

  getSentInvitations(userId: string): Promise<{ invitations: InvitationWithProfile[]; error: string | null }> {
    return getSentInvitations(userId);
  },

  getReceivedInvitations(userId: string): Promise<{ invitations: InvitationWithProfile[]; error: string | null }> {
    return getReceivedInvitations(userId);
  },

  acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ connection: Connection | null; conversationId: string | null; error: string | null }> {
    return acceptInvitation(invitationId, userId);
  },

  refuseInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ error: string | null }> {
    return refuseInvitation(invitationId, userId);
  },

  getDailyInvitationCount(userId: string): Promise<{ count: number; limit: number; error: string | null }> {
    return getDailyInvitationCount(userId);
  },

  getConnections(userId: string): Promise<{ connections: ConnectionWithProfile[]; error: string | null }> {
    return getConnections(userId);
  },

  removeConnection(connectionId: string): Promise<{ error: string | null }> {
    return removeConnection(connectionId);
  },

  markInvitationsAsSeen(userId: string): Promise<{ error: string | null }> {
    return markInvitationsAsSeen(userId);
  },

  getUnseenInvitationsCount(userId: string): Promise<{ count: number; error: string | null }> {
    return getUnseenInvitationsCount(userId);
  },

  checkExistingInvitation(
    senderId: string,
    receiverId: string
  ): Promise<{ exists: boolean; invitation: Invitation | null; error: string | null }> {
    return checkExistingInvitation(senderId, receiverId);
  },
};

export default invitationsService;
