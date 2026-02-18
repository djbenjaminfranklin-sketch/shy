import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
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
import { supabase } from '../../src/services/supabase/client';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType, PlanFeatures, PLAN_FEATURES } from '../../src/constants/subscriptions';
import { Message } from '../../src/types/message';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { ChatHeaderLeft, ChatHeaderTitle, ChatHeaderRight } from '../../src/components/chat/ChatHeader';
import { EmptyChat } from '../../src/components/chat/EmptyChat';
import { ChatFeatureCards } from '../../src/components/chat/ChatFeatureCards';
import { PaywallModal } from '../../src/components/subscription/PaywallModal';
import { LimitIndicator } from '../../src/components/subscription/LimitIndicator';
import { ComfortLevelModal } from '../../src/components/comfort';
import { QuickMeetModal } from '../../src/components/quickmeet';
import { useQuickMeet } from '../../src/hooks/useQuickMeet';
import { useChatModeration } from '../../src/hooks/useChatModeration';
import { IceBreakerInfoModal } from '../../src/components/icebreaker/IceBreakerInfoModal';
import { iceBreakerService } from '../../src/services/supabase/icebreaker';

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

  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesTotal, setMessagesTotal] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRhythmExpanded, setShowRhythmExpanded] = useState(false);
  const [showComfortModal, setShowComfortModal] = useState(false);
  const [showQuickMeetModal, setShowQuickMeetModal] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures>(PLAN_FEATURES.free);
  const [hasIceBreakerMessages, setHasIceBreakerMessages] = useState(false);
  const [showIceBreakerBanner, setShowIceBreakerBanner] = useState(false);
  const [showIceBreakerInfo, setShowIceBreakerInfo] = useState(false);
  const [isFirstIceBreakerView, setIsFirstIceBreakerView] = useState(true);

  const { activeProposal, isRecipient: isQuickMeetRecipient } = useQuickMeet(conversationId, otherUserId);
  const { handleMorePress } = useChatModeration({ otherUserId, otherUserName });

  // Charger les infos de l'autre utilisateur et les limites
  useEffect(() => {
    const loadOtherUser = async () => {
      if (!conversationId || !user) return;

      const { data: conversation } = await supabase
        .from('conversations')
        .select('connection_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      const { data: connection } = await supabase
        .from('connections')
        .select('user1_id, user2_id')
        .eq('id', conversation.connection_id)
        .single();

      if (!connection) return;

      const theOtherUserId = connection.user1_id === user.id
        ? connection.user2_id
        : connection.user1_id;

      setOtherUserId(theOtherUserId);

      const { profile: otherProfile } = await profilesService.getProfile(theOtherUserId);
      if (otherProfile) {
        setOtherUserName(otherProfile.displayName);
        setOtherUserPhoto(otherProfile.photos?.[0] || null);
      }
    };

    loadOtherUser();
  }, [conversationId, user]);

  useEffect(() => {
    if (!user) return;

    const loadLimits = async () => {
      try {
        const { subscription } = await subscriptionsService.getUserSubscription(user.id);
        const planId = (subscription?.planId || 'free') as PlanType;
        const plan = SUBSCRIPTION_PLANS_BY_ID[planId];
        setMessagesTotal(plan?.features.dailyMessages ?? -1);
        setPlanFeatures(plan?.features ?? PLAN_FEATURES.free);

        const { limits } = await subscriptionsService.getUserLimits(user.id);
        setMessagesUsed(limits?.messagesUsed || 0);
      } catch (error) {
        // Error loading message limits
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

      // Check for Ice Breaker messages (received, not sent by current user)
      const iceBreakerMsgs = loadedMessages.filter(
        (m) => m.isIceBreaker && m.senderId !== user?.id
      );
      if (iceBreakerMsgs.length > 0) {
        setHasIceBreakerMessages(true);
        setShowIceBreakerBanner(true);

        if (user) {
          const { seen } = await iceBreakerService.hasSeenInfoPopup(user.id);
          if (!seen) {
            setIsFirstIceBreakerView(true);
            setShowIceBreakerInfo(true);
          } else {
            setIsFirstIceBreakerView(false);
          }
        }
      }

      // Marquer comme lus
      if (user) {
        messagesService.markAsRead(conversationId, user.id);
      }
    };

    loadMessages();

    // S'abonner aux nouveaux messages
    messagesService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
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

      if (messagesTotal !== -1 && messagesUsed >= messagesTotal) {
        setShowPaywall(true);
        return;
      }

      const { message } = await messagesService.sendMessage(conversationId, user.id, content);
      if (message) {
        setMessages((prev) => [...prev, message]);
        flatListRef.current?.scrollToEnd({ animated: true });
        setMessagesUsed((prev) => prev + 1);
        await subscriptionsService.incrementMessages(user.id);
      }
    },
    [user, conversationId, messagesUsed, messagesTotal]
  );

  const handleClosePaywall = useCallback(() => setShowPaywall(false), []);

  const handleUpgrade = useCallback(() => {
    setShowPaywall(false);
    router.push('/profile/subscription' as never);
  }, [router]);

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
          headerLeft: () => (
            <ChatHeaderLeft onPress={() => router.replace('/(tabs)/matches')} />
          ),
          headerTitle: () => (
            <ChatHeaderTitle photo={otherUserPhoto} name={otherUserName} />
          ),
          headerRight: () => (
            <ChatHeaderRight onPress={handleMorePress} />
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ChatFeatureCards
          conversationId={conversationId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          showRhythmExpanded={showRhythmExpanded}
          onToggleRhythm={() => setShowRhythmExpanded(!showRhythmExpanded)}
          planFeatures={planFeatures}
          onUpgrade={handleUpgrade}
          onComfortPress={() => setShowComfortModal(true)}
          onQuickMeetPress={() => setShowQuickMeetModal(true)}
          hasActiveProposal={!!activeProposal}
          isQuickMeetRecipient={isQuickMeetRecipient}
          hasIceBreakerMessages={hasIceBreakerMessages}
          showIceBreakerBanner={showIceBreakerBanner}
          onDismissIceBreakerBanner={() => setShowIceBreakerBanner(false)}
          onDiscoverIceBreaker={() => router.push('/profile/subscription' as never)}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyChat t={t} />
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        )}

        {/* Message limit indicator */}
        {messagesTotal !== -1 && (
          <View style={styles.limitContainer}>
            <LimitIndicator
              type="messages"
              used={messagesUsed}
              total={messagesTotal}
              onPress={() => router.push('/profile/subscription' as never)}
            />
          </View>
        )}

        <ChatInput onSend={handleSend} />

        <PaywallModal
          visible={showPaywall}
          onClose={handleClosePaywall}
          onUpgrade={handleUpgrade}
          feature="messages"
          currentUsage={messagesUsed}
          limit={messagesTotal}
        />

        <ComfortLevelModal
          visible={showComfortModal}
          onClose={() => setShowComfortModal(false)}
          conversationId={conversationId}
          otherUserName={otherUserName}
        />

        {otherUserId && (
          <QuickMeetModal
            visible={showQuickMeetModal}
            onClose={() => setShowQuickMeetModal(false)}
            conversationId={conversationId}
            otherUserId={otherUserId}
            otherUserName={otherUserName}
          />
        )}

        <IceBreakerInfoModal
          visible={showIceBreakerInfo}
          onClose={async () => {
            setShowIceBreakerInfo(false);
            if (user) {
              await iceBreakerService.markInfoPopupSeen(user.id);
            }
          }}
          onDiscover={() => {
            setShowIceBreakerInfo(false);
            router.push('/profile/subscription' as never);
          }}
          senderName={otherUserName}
          isFirstTime={isFirstIceBreakerView}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
