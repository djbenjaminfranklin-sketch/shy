import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';

export interface IceBreakerCandidate {
  id: string;
  name: string;
  age: number;
  photoUrl: string | null;
  commonInterests: string[];
  message: string;
  distance?: number;
}

interface IceBreakerProfileCardProps {
  candidate: IceBreakerCandidate;
  onSend: () => void;
  onReplace: () => void;
  onMessageChange: (message: string) => void;
  isSending?: boolean;
  isSent?: boolean;
}

export function IceBreakerProfileCard({
  candidate,
  onSend,
  onReplace,
  onMessageChange,
  isSending = false,
  isSent = false,
}: IceBreakerProfileCardProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <View style={styles.card}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {candidate.photoUrl ? (
          <Image
            source={{ uri: candidate.photoUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={28} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {candidate.name}, {candidate.age}
          </Text>
          {candidate.distance !== undefined && (
            <Text style={styles.distance}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              {' '}{candidate.distance} km
            </Text>
          )}
        </View>
      </View>

      {/* Common Interests */}
      <View style={styles.interestsSection}>
        <Text style={styles.interestsLabel}>{t('icebreaker.commonInterests')}</Text>
        <View style={styles.interestsTags}>
          {candidate.commonInterests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestTagText}>{interest}</Text>
            </View>
          ))}
          {candidate.commonInterests.length > 3 && (
            <View style={[styles.interestTag, styles.interestTagMore]}>
              <Text style={styles.interestTagText}>
                +{candidate.commonInterests.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Message Preview / Edit */}
      <View style={styles.messageSection}>
        <View style={styles.messageLabelRow}>
          <Text style={styles.messageLabel}>{t('icebreaker.messagePreview')}</Text>
          {!isSent && !isEditing && (
            <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Ionicons name="pencil" size={14} color={colors.icebreaker} />
              <Text style={styles.editButtonText}>{t('common.edit')}</Text>
            </Pressable>
          )}
        </View>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.messageInput}
              value={candidate.message}
              onChangeText={onMessageChange}
              multiline
              maxLength={300}
              autoFocus
              blurOnSubmit
              onSubmitEditing={() => setIsEditing(false)}
              returnKeyType="done"
            />
            <Pressable
              onPress={() => setIsEditing(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>"{candidate.message}"</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isSent ? (
          <View style={[styles.actionButton, styles.sentButton]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.sentButtonText}>{t('icebreaker.messageSent')}</Text>
          </View>
        ) : (
          <>
            <Pressable
              style={[styles.actionButton, styles.replaceButton]}
              onPress={onReplace}
              disabled={isSending}
            >
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              <Text style={styles.replaceButtonText}>{t('icebreaker.replace')}</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.approveButton]}
              onPress={onSend}
              disabled={isSending}
            >
              {isSending ? (
                <Text style={styles.approveButtonText}>{t('icebreaker.sending')}</Text>
              ) : (
                <>
                  <Ionicons name="send" size={18} color={colors.white} />
                  <Text style={styles.approveButtonText}>{t('icebreaker.approve')}</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  distance: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  interestsSection: {
    marginBottom: spacing.md,
  },
  interestsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  interestTag: {
    backgroundColor: colors.icebreaker + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  interestTagMore: {
    backgroundColor: colors.surface,
  },
  interestTagText: {
    ...typography.caption,
    color: colors.icebreaker,
    fontWeight: '600',
  },
  messageSection: {
    marginBottom: spacing.md,
  },
  messageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    ...typography.caption,
    color: colors.icebreaker,
    fontWeight: '600',
  },
  messageBubble: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  messageText: {
    ...typography.bodySmall,
    color: colors.text,
    fontStyle: 'italic',
  },
  editContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.icebreaker,
  },
  messageInput: {
    ...typography.bodySmall,
    color: colors.text,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  doneButtonText: {
    ...typography.caption,
    color: colors.icebreaker,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  replaceButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replaceButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: colors.icebreaker,
  },
  approveButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  sentButton: {
    backgroundColor: colors.success,
    flex: 1,
  },
  sentButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
});

export default IceBreakerProfileCard;
