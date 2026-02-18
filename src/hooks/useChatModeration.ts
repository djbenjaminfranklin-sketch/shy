import { useCallback } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { moderationService } from '../services/supabase/moderation';
import { REPORT_REASONS, ReportReasonId } from '../constants/moderation';

interface UseChatModerationParams {
  otherUserId: string | null;
  otherUserName: string;
}

export function useChatModeration({ otherUserId, otherUserName }: UseChatModerationParams) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleBlock = useCallback(async () => {
    if (!user || !otherUserId) return;

    const confirmMessage = t('moderation.blockConfirmation').replace(
      '{name}',
      otherUserName || t('moderation.thisUser')
    );

    Alert.alert(
      t('moderation.blockUser'),
      confirmMessage,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('moderation.block'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await moderationService.blockUser(user.id, otherUserId);
            if (error) {
              Alert.alert(t('common.error'), error);
            } else {
              Alert.alert(
                t('moderation.userBlocked'),
                t('moderation.userBlockedMessage'),
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/matches') }]
              );
            }
          },
        },
      ]
    );
  }, [user, otherUserId, otherUserName, t, router]);

  const handleReport = useCallback(() => {
    if (!user || !otherUserId) return;

    const reasons = Object.values(REPORT_REASONS);
    const options = [...reasons.map((r) => r.label), t('common.cancel')];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: t('moderation.reportReason'),
        },
        async (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const reason = reasons[buttonIndex].id as ReportReasonId;
            const { error } = await moderationService.reportUser(user.id, otherUserId, reason);
            if (error) {
              Alert.alert(t('common.error'), error);
            } else {
              Alert.alert(t('moderation.reportSent'), t('moderation.reportSentMessage'));
            }
          }
        }
      );
    } else {
      Alert.alert(
        t('moderation.reportReason'),
        undefined,
        [
          ...reasons.map((reason) => ({
            text: reason.label,
            onPress: async () => {
              const { error } = await moderationService.reportUser(user.id, otherUserId, reason.id as ReportReasonId);
              if (error) {
                Alert.alert(t('common.error'), error);
              } else {
                Alert.alert(t('moderation.reportSent'), t('moderation.reportSentMessage'));
              }
            },
          })),
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  }, [user, otherUserId, t]);

  const handleMorePress = useCallback(() => {
    const options = [
      t('moderation.blockUser'),
      t('moderation.reportUser'),
      t('common.cancel'),
    ];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleBlock();
          } else if (buttonIndex === 1) {
            handleReport();
          }
        }
      );
    } else {
      Alert.alert(
        otherUserName || 'Options',
        undefined,
        [
          { text: t('moderation.blockUser'), style: 'destructive', onPress: handleBlock },
          { text: t('moderation.reportUser'), onPress: handleReport },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  }, [t, otherUserName, handleBlock, handleReport]);

  return { handleMorePress };
}
