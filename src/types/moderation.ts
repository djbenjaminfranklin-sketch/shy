import { ReportReasonId } from '../constants/moderation';

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReasonId;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AccountDeletion {
  id: string;
  userId: string;
  emailHash: string;
  reason: string | null;
  deletedAt: string;
}
