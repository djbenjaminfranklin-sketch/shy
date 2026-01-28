import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { messagesService } from '../../src/services/supabase/messages';
import { subscriptionsService } from '../../src/services/supabase/subscriptions';
import { SUBSCRIPTION_PLANS } from '../../src/constants/subscriptions';
import { Message } from '../../src/types/message';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { Avatar } from '../../src/components/ui/Avatar';
import { PaywallModal } from '../../src/components/subscription/PaywallModal';
import { LimitIndicator } from '../../src/components/subscription/LimitIndicator';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUserName] = useState('');
  const [otherUserPhoto] = useState<string | null>(null);

  // Message limits
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesTotal, setMessagesTotal] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);

  // Charger les limites de messages
  useEffect(() => {
    if (!user) return;

    const loadLimits = async () => {
      try {
        const { subscription } = await subscriptionsService.getUserSubscription(user.id);
        const planId = subscription?.planId || 'free';
        const plan = SUBSCRIPTION_PLANS[planId];
        setMessagesTotal(plan.features.dailyMessages);

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

  // Menu de modération
  const handleMorePress = useCallback(() => {
    // TODO: Afficher le menu de blocage/signalement
  }, []);

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Conversation non trouvée</Text>
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Commencez la conversation</Text>
            <Text style={styles.emptyText}>
              Envoyez un premier message pour faire connaissance
            </Text>
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
});
