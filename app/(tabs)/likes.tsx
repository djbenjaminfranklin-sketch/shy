import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { invitationsService } from '../../src/services/supabase/invitations';
import { useFocusEffect } from 'expo-router';
import { InvitationsList } from '../../src/components/likes';
import type { InvitationWithProfile } from '../../src/types/match';

type TabType = 'received' | 'sent';

export default function InvitationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedInvitations, setReceivedInvitations] = useState<InvitationWithProfile[]>([]);
  const [sentInvitations, setSentInvitations] = useState<InvitationWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const loadInvitations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [received, sent] = await Promise.all([
        invitationsService.getReceivedInvitations(user.id),
        invitationsService.getSentInvitations(user.id),
      ]);

      if (!received.error) {
        setReceivedInvitations(received.invitations);
      }

      if (!sent.error) {
        setSentInvitations(sent.invitations);
      }
    } catch (error) {
      Alert.alert(t('alerts.errorTitle'), t('errors.unableToLoadInvitations'));
    }
  }, [user?.id, t]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadInvitations();
      setIsLoading(false);
    };
    load();
  }, [loadInvitations]);

  // Marquer les invitations comme vues quand l'ecran devient visible
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Recharger les invitations
        loadInvitations();
        // Marquer comme vues apres un petit delai
        const timer = setTimeout(() => {
          invitationsService.markInvitationsAsSeen(user.id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [user?.id, loadInvitations])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRemovedIds(new Set());
    await loadInvitations();
    setIsRefreshing(false);
  }, [loadInvitations]);

  const handleAccept = useCallback(
    async (invitationId: string) => {
      if (!user?.id) return;

      try {
        const { conversationId, error } = await invitationsService.acceptInvitation(invitationId, user.id);

        if (error) {
          Alert.alert(t('alerts.errorTitle'), error);
          return;
        }

        if (conversationId) {
          // Retirer de la liste locale
          setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
          // Naviguer vers le chat
          router.push(`/chat/${conversationId}` as never);
        }
      } catch (error) {
        Alert.alert(t('alerts.errorTitle'), t('errors.unableToAccept'));
      }
    },
    [user?.id, t]
  );

  const handleRefuse = useCallback(async (invitationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await invitationsService.refuseInvitation(invitationId, user.id);

      if (error) {
        Alert.alert(t('alerts.errorTitle'), error);
        return;
      }

      // Retirer l'invitation de la liste locale
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      Alert.alert(t('alerts.errorTitle'), t('errors.unableToRefuse'));
    }
  }, [user?.id, t]);

  const handleRemove = useCallback((invitationId: string) => {
    setRemovedIds((prev) => new Set([...prev, invitationId]));
  }, []);

  // Filtrer les invitations supprimees
  const visibleReceivedInvitations = receivedInvitations.filter((inv) => !removedIds.has(inv.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('invitations.title')}</Text>
        {visibleReceivedInvitations.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{visibleReceivedInvitations.length}</Text>
          </View>
        )}
      </View>

      {/* Invitations List with Tabs */}
      <InvitationsList
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        receivedInvitations={visibleReceivedInvitations}
        sentInvitations={sentInvitations}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onAccept={handleAccept}
        onRefuse={handleRefuse}
        onRemove={handleRemove}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
});
