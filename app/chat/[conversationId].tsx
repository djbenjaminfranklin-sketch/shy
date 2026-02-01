import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { messagesService } from '../../src/services/supabase/messages';
import { subscriptionsService } from '../../src/services/supabase/subscriptions';
import { profilesService } from '../../src/services/supabase/profiles';
import { moderationService } from '../../src/services/supabase/moderation';
import { supabase } from '../../src/services/supabase/client';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../../src/constants/subscriptions';
import { REPORT_REASONS, ReportReasonId } from '../../src/constants/moderation';
import { Message } from '../../src/types/message';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { Avatar } from '../../src/components/ui/Avatar';
import { PaywallModal } from '../../src/components/subscription/PaywallModal';
import { LimitIndicator } from '../../src/components/subscription/LimitIndicator';
import { RhythmScoreCard } from '../../src/components/rhythm/RhythmScoreCard';
import { ComfortLevelIndicator, ComfortLevelModal } from '../../src/components/comfort';
import { QuickMeetButton, QuickMeetModal } from '../../src/components/quickmeet';
import { useQuickMeet } from '../../src/hooks/useQuickMeet';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  // Message limits
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesTotal, setMessagesTotal] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRhythmExpanded, setShowRhythmExpanded] = useState(false);
  const [showComfortModal, setShowComfortModal] = useState(false);
  const [showQuickMeetModal, setShowQuickMeetModal] = useState(false);

  // Quick Meet hook
  const {
    activeProposal,
    isRecipient: isQuickMeetRecipient,
  } = useQuickMeet(conversationId, otherUserId);

  // Charger les infos de l'autre utilisateur
  useEffect(() => {
    const loadOtherUser = async () => {
      if (!conversationId || !user) return;

      // Recuperer la conversation pour avoir le connection_id
      const { data: conversation } = await supabase
        .from('conversations')
        .select('connection_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      // Recuperer la connexion pour avoir les user IDs
      const { data: connection } = await supabase
        .from('connections')
        .select('user1_id, user2_id')
        .eq('id', conversation.connection_id)
        .single();

      if (!connection) return;

      // Determiner l'autre utilisateur
      const theOtherUserId = connection.user1_id === user.id
        ? connection.user2_id
        : connection.user1_id;

      setOtherUserId(theOtherUserId);

      // Charger le profil de l'autre utilisateur
      const { profile: otherProfile } = await profilesService.getProfile(theOtherUserId);

      if (otherProfile) {
        setOtherUserName(otherProfile.displayName);
        setOtherUserPhoto(otherProfile.photos?.[0] || null);
      }
    };

    loadOtherUser();
  }, [conversationId, user]);

  // Charger les limites de messages
  useEffect(() => {
    if (!user) return;

    const loadLimits = async () => {
      try {
        const { subscription } = await subscriptionsService.getUserSubscription(user.id);
        const planId = (subscription?.planId || 'free') as PlanType;
        const plan = SUBSCRIPTION_PLANS_BY_ID[planId];
        setMessagesTotal(plan?.features.dailyMessages ?? -1);

        const { limits } = await subscriptionsService.getUserLimits(user.id);
        setMessagesUsed(limits?.messagesUsed || 0);
      } catch (error) {
        console.error('Error loading message limits:', error);
      }
    };

    loadLimits();
  }, [user]);

  // Charger les messages
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      const { messages: loadedMessages } = await messagesService.getMessages(conversationId);
      setMessages(loadedMessages);
      setIsLoading(false);

      // Marquer comme lus
      if (user) {
        messagesService.markAsRead(conversationId, user.id);
      }
    };

    loadMessages();

    // S'abonner aux nouveaux messages
    messagesService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // Marquer comme lu si ce n'est pas notre message
      if (user && newMessage.senderId !== user.id) {
        messagesService.markAsRead(conversationId, user.id);
      }
    });

    return () => {
      messagesService.unsubscribeFromMessages(conversationId);
    };
  }, [conversationId, user]);

  // Envoyer un message
  const handleSend = useCallback(
    async (content: string) => {
      if (!user || !conversationId) return;

      // Vérifier les limites (sauf si illimité = -1)
      if (messagesTotal !== -1 && messagesUsed >= messagesTotal) {
        setShowPaywall(true);
        return;
      }

      const { message } = await messagesService.sendMessage(conversationId, user.id, content);

      if (message) {
        setMessages((prev) => [...prev, message]);
        flatListRef.current?.scrollToEnd({ animated: true });

        // Incrémenter le compteur local
        setMessagesUsed((prev) => prev + 1);

        // Incrémenter sur le serveur
        await subscriptionsService.incrementMessages(user.id);
      }
    },
    [user, conversationId, messagesUsed, messagesTotal]
  );

  // Fermer le paywall
  const handleClosePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  // Upgrade
  const handleUpgrade = useCallback(() => {
    setShowPaywall(false);
    router.push('/profile/subscription' as any);
  }, [router]);

  // Bloquer l'utilisateur
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

  // Signaler l'utilisateur
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
      // Android: Use Alert with buttons
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

  // Menu de modération
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
      // Android: Use Alert
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

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('messages.conversationNotFound')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Avatar uri={otherUserPhoto} name={otherUserName} size={32} />
              <Text style={styles.headerName}>{otherUserName || 'Chat'}</Text>
            </View>
          ),
          headerRight: () => (
            <Pressable onPress={handleMorePress} style={styles.headerButton}>
              <Text style={styles.headerIcon}>⋯</Text>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Rhythm Score Card */}
        <View style={styles.rhythmContainer}>
          <RhythmScoreCard
            conversationId={conversationId}
            compact={!showRhythmExpanded}
            onPress={() => setShowRhythmExpanded(!showRhythmExpanded)}
          />
        </View>

        {/* Comfort Level Indicator */}
        <ComfortLevelIndicator
          conversationId={conversationId}
          onPress={() => setShowComfortModal(true)}
          compact
        />

        {/* Quick Meet Button */}
        {otherUserId && (
          <View style={styles.quickMeetContainer}>
            <QuickMeetButton
              onPress={() => setShowQuickMeetModal(true)}
              hasActiveProposal={!!activeProposal}
              isRecipient={isQuickMeetRecipient}
            />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>{t('messages.startConversationHint')}</Text>
            <Text style={styles.emptyText}>{t('messages.sendFirstMessage')}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={item.senderId === user?.id} />
            )}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Message limit indicator */}
        {messagesTotal !== -1 && (
          <View style={styles.limitContainer}>
            <LimitIndicator
              type="messages"
              used={messagesUsed}
              total={messagesTotal}
              onPress={() => router.push('/profile/subscription' as any)}
            />
          </View>
        )}

        <ChatInput onSend={handleSend} />

        {/* Paywall Modal */}
        <PaywallModal
          visible={showPaywall}
          onClose={handleClosePaywall}
          onUpgrade={handleUpgrade}
          feature="messages"
          currentUsage={messagesUsed}
          limit={messagesTotal}
        />

        {/* Comfort Level Modal */}
        <ComfortLevelModal
          visible={showComfortModal}
          onClose={() => setShowComfortModal(false)}
          conversationId={conversationId}
          otherUserName={otherUserName}
        />

        {/* Quick Meet Modal */}
        {otherUserId && (
          <QuickMeetModal
            visible={showQuickMeetModal}
            onClose={() => setShowQuickMeetModal(false)}
            conversationId={conversationId}
            otherUserId={otherUserId}
            otherUserName={otherUserName}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.lg,
  },
  messagesList: {
    paddingVertical: spacing.md,
  },
  limitContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rhythmContainer: {
    paddingHorizontal: spacing.md,
  },
  quickMeetContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
