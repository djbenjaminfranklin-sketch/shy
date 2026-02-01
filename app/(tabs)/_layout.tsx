import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { supabase } from '../../src/services/supabase/client';
import { invitationsService } from '../../src/services/supabase/invitations';

// Badge component pour notifications
const TabBadge = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// Custom TabBar Background avec blur effect
const TabBarBackground = () => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="dark"
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarDark }]} />;
};

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isLoading, router]);

  // Charger les compteurs de likes et messages non lus
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) return;

      // Compter les invitations reçues NON VUES (pas juste pending)
      const { count: likes } = await invitationsService.getUnseenInvitationsCount(user.id);

      // Compter les messages non lus
      // 1. Récupérer toutes les conversations de l'utilisateur
      const { data: connections } = await supabase
        .from('connections')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      let unreadCount = 0;
      if (connections && connections.length > 0) {
        const connectionIds = connections.map(c => c.id);

        // 2. Récupérer les conversations
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .in('connection_id', connectionIds);

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);

          // 3. Compter les messages non lus (où je ne suis pas l'expéditeur)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          unreadCount = count || 0;
        }
      }

      setLikesCount(likes || 0);
      setMessagesCount(unreadCount);
    };

    loadCounts();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si pas authentifié, ne rien afficher (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="likes"
        options={{
          title: t('tabs.likes'),
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={26}
                color={color}
              />
              <TabBadge count={likesCount} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="matches"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={26}
                color={color}
              />
              <TabBadge count={messagesCount} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Cacher l'ancien messages tab s'il existe */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: colors.tabBarActive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
