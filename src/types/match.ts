import { Profile } from './profile';

// =====================================================
// LEGACY - SYSTÈME DE LIKES/MATCHES (conservé pour compatibilité)
// =====================================================

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  isLike: boolean;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface MatchWithProfile extends Match {
  profile: Profile;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// =====================================================
// SYSTÈME D'INVITATIONS
// =====================================================

export type InvitationStatus = 'pending' | 'accepted' | 'refused' | 'expired';

export interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  status: InvitationStatus;
  sentAt: string;
  expiresAt: string;
  respondedAt?: string;
}

export interface InvitationWithProfile extends Invitation {
  senderProfile?: Profile;
  receiverProfile?: Profile;
}

// =====================================================
// CONNEXIONS (anciennement Matches)
// =====================================================

export interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  invitationId: string;
  createdAt: string;
}

export interface ConnectionWithProfile extends Connection {
  profile: Profile;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// =====================================================
// LIMITES D'INVITATIONS
// =====================================================

export interface InvitationLimits {
  maxDaily: number; // 40 pour hommes, illimité (-1) pour femmes
  used: number;
  remaining: number;
  resetsAt: string;
}
