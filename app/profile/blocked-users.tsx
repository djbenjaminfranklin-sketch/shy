import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { moderationService } from '../../src/services/supabase/moderation';
import { profilesService } from '../../src/services/supabase/profiles';
import { Block } from '../../src/types/moderation';
import { Profile } from '../../src/types/profile';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';

interface BlockedUser extends Block {
  profile?: Profile;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { blocks } = await moderationService.getBlockedUsers(user.id);

      // Charger les profils des utilisateurs bloqués
      const blockedWithProfiles = await Promise.all(
        blocks.map(async (block) => {
          const { profile } = await profilesService.getProfile(block.blockedId);
          return { ...block, profile: profile || undefined };
        })
      );

      setBlockedUsers(blockedWithProfiles);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = useCallback(
    async (blockedId: string) => {
      if (!user) return;

      Alert.alert(
        'Débloquer',
        'Êtes-vous sûr de vouloir débloquer cet utilisateur ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Débloquer',
            onPress: async () => {
              await moderationService.unblockUser(user.id, blockedId);
              setBlockedUsers((prev) => prev.filter((b) => b.blockedId !== blockedId));
            },
          },
        ]
      );
    },
    [user]
  );

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.item}>
      <Avatar
        uri={item.profile?.photos[0]}
        name={item.profile?.displayName}
        size={48}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>
          {item.profile?.displayName || 'Utilisateur supprimé'}
        </Text>
        <Text style={styles.itemDate}>
          Bloqué le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <Button
        title="Débloquer"
        onPress={() => handleUnblock(item.blockedId)}
        variant="outline"
        size="small"
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/profile')}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Utilisateurs bloqués</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderHeader()}
      {blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚫</Text>
          <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
          <Text style={styles.emptyText}>
            Les utilisateurs que vous bloquez apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
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
  list: {
    padding: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  itemDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
