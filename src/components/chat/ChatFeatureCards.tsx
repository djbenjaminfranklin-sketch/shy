import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { spacing } from '../../theme/spacing';
import { RhythmScoreCard } from '../rhythm/RhythmScoreCard';
import { EngagementScoreCard } from '../engagement/EngagementScoreCard';
import { ComfortLevelIndicator } from '../comfort';
import { QuickMeetButton } from '../quickmeet';
import { IceBreakerBanner } from '../icebreaker/IceBreakerBadge';
import { PlanFeatures } from '../../constants/subscriptions';

// =============================================================================
// Types
// =============================================================================

interface ChatFeatureCardsProps {
  conversationId: string;
  otherUserId: string | null;
  otherUserName: string;
  showRhythmExpanded: boolean;
  onToggleRhythm: () => void;
  planFeatures: PlanFeatures;
  onUpgrade: () => void;
  onComfortPress: () => void;
  onQuickMeetPress: () => void;
  hasActiveProposal: boolean;
  isQuickMeetRecipient: boolean;
  hasIceBreakerMessages: boolean;
  showIceBreakerBanner: boolean;
  onDismissIceBreakerBanner: () => void;
  onDiscoverIceBreaker: () => void;
}

// =============================================================================
// ChatFeatureCards
// =============================================================================

/**
 * The rhythm score, engagement score, comfort level, quick meet button,
 * and ice breaker banner section
 */
export function ChatFeatureCards({
  conversationId,
  otherUserId,
  otherUserName,
  showRhythmExpanded,
  onToggleRhythm,
  planFeatures,
  onUpgrade,
  onComfortPress,
  onQuickMeetPress,
  hasActiveProposal,
  isQuickMeetRecipient,
  hasIceBreakerMessages,
  showIceBreakerBanner,
  onDismissIceBreakerBanner,
  onDiscoverIceBreaker,
}: ChatFeatureCardsProps) {
  return (
    <>
      {/* Rhythm Score Card */}
      <View style={styles.rhythmContainer}>
        <RhythmScoreCard
          conversationId={conversationId}
          compact={!showRhythmExpanded}
          onPress={onToggleRhythm}
          canSeeDetailedInsights={planFeatures.connectionRhythmDetailedInsights}
          onUpgrade={onUpgrade}
        />
      </View>

      {/* Engagement Score Card */}
      {otherUserId && (
        <View style={styles.engagementContainer}>
          <EngagementScoreCard
            userId={otherUserId}
            showDetails={planFeatures.engagementScoreDetailedBreakdown}
            onUpgrade={onUpgrade}
          />
        </View>
      )}

      {/* Comfort Level Indicator */}
      <ComfortLevelIndicator
        conversationId={conversationId}
        onPress={onComfortPress}
        compact
      />

      {/* Quick Meet Button */}
      {otherUserId && (
        <View style={styles.quickMeetContainer}>
          <QuickMeetButton
            onPress={onQuickMeetPress}
            hasActiveProposal={hasActiveProposal}
            isRecipient={isQuickMeetRecipient}
          />
        </View>
      )}

      {/* Ice Breaker Banner */}
      {hasIceBreakerMessages && showIceBreakerBanner && (
        <IceBreakerBanner
          senderName={otherUserName}
          onDismiss={onDismissIceBreakerBanner}
          onDiscover={onDiscoverIceBreaker}
        />
      )}
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  rhythmContainer: {
    paddingHorizontal: spacing.md,
  },
  engagementContainer: {
    paddingHorizontal: spacing.md,
  },
  quickMeetContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
