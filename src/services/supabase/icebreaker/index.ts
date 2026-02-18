import type { UserIceBreakerState, IceBreakerResult, CompatibleProfile, IceBreakerCandidate } from '../../../types/icebreaker';
import { getUserIceBreakerState, purchaseIceBreakers } from './purchases';
import { generatePersonalizedMessage, sendIceBreakerMessage } from './messages';
import { useIceBreaker, sendToApprovedCandidates, sendToSingleCandidate } from './sending';
import { getCandidates, findCandidatesWithDetails } from './candidates';
import { findCompatibleProfiles } from './compatibility';
import { hasSeenInfoPopup, markInfoPopupSeen } from './popups';
import { calculateDistance, toRad, getDefaultState } from './utils';

/**
 * Service for managing Ice Breakers
 */
export const iceBreakerService = {
  getUserIceBreakerState(userId: string): Promise<{ state: UserIceBreakerState; error: string | null }> {
    return getUserIceBreakerState(userId);
  },

  purchaseIceBreakers(
    userId: string,
    quantity: number,
    productId: string,
    price?: number
  ): Promise<{ success: boolean; error: string | null }> {
    return purchaseIceBreakers(userId, quantity, productId, price);
  },

  async useIceBreaker(userId: string): Promise<{
    success: boolean;
    results: IceBreakerResult[];
    error: string | null;
  }> {
    return useIceBreaker(
      userId,
      (id: string) => this.getUserIceBreakerState(id),
      (id: string, profile) => this.findCompatibleProfiles(id, profile)
    );
  },

  findCompatibleProfiles(
    userId: string,
    userProfile: { interests: string[] | null; intention: string; gender: string; gender_filter: string[] | null; latitude: number | null; longitude: number | null }
  ): Promise<CompatibleProfile[]> {
    return findCompatibleProfiles(userId, userProfile);
  },

  generatePersonalizedMessage(profile: CompatibleProfile, userInterests: string[]): string {
    return generatePersonalizedMessage(profile, userInterests);
  },

  sendIceBreakerMessage(senderId: string, receiverId: string, message: string): Promise<{ error: string | null; conversationId: string | null }> {
    return sendIceBreakerMessage(senderId, receiverId, message);
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return calculateDistance(lat1, lon1, lat2, lon2);
  },

  toRad(deg: number): number {
    return toRad(deg);
  },

  getDefaultState(): UserIceBreakerState {
    return getDefaultState();
  },

  async getCandidates(userId: string): Promise<{
    candidates: IceBreakerCandidate[];
    replacementPool: IceBreakerCandidate[];
    error: string | null;
  }> {
    return getCandidates(userId, (id: string) => this.getUserIceBreakerState(id));
  },

  findCandidatesWithDetails(
    userId: string,
    userProfile: { interests: string[] | null; intention: string; gender: string; gender_filter: string[] | null; latitude: number | null; longitude: number | null }
  ): Promise<IceBreakerCandidate[]> {
    return findCandidatesWithDetails(userId, userProfile);
  },

  async sendToApprovedCandidates(
    userId: string,
    candidates: IceBreakerCandidate[]
  ): Promise<{
    success: boolean;
    results: IceBreakerResult[];
    error: string | null;
  }> {
    return sendToApprovedCandidates(userId, candidates, (id: string) => this.getUserIceBreakerState(id));
  },

  sendToSingleCandidate(
    userId: string,
    candidate: IceBreakerCandidate
  ): Promise<{
    success: boolean;
    conversationId: string | null;
    error: string | null;
  }> {
    return sendToSingleCandidate(userId, candidate);
  },

  hasSeenInfoPopup(userId: string): Promise<{ seen: boolean; error: string | null }> {
    return hasSeenInfoPopup(userId);
  },

  markInfoPopupSeen(userId: string): Promise<{ error: string | null }> {
    return markInfoPopupSeen(userId);
  },
};

export default iceBreakerService;
