import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { adminService, AdminUserDetail } from '../../src/services/supabase/admin';

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    if (!userId) return;
    setIsLoading(true);
    const data = await adminService.getUserDetail(userId);
    setUser(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleBan = () => {
    Alert.alert(
      'Bannir utilisateur',
      `Voulez-vous vraiment bannir ${user?.displayName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bannir',
          style: 'destructive',
          onPress: async () => {
            await adminService.banUser(userId!);
            loadUser();
          },
        },
      ]
    );
  };

  const handleUnban = async () => {
    await adminService.unbanUser(userId!);
    loadUser();
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer utilisateur',
      'Cette action est irréversible. Toutes les données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await adminService.deleteUser(userId!);
            router.back();
          },
        },
      ]
    );
  };

  const handleVerify = async () => {
    await adminService.verifyUser(userId!);
    Alert.alert('Succès', 'Utilisateur vérifié manuellement.');
    loadUser();
  };

  const handleGiveSubscription = () => {
    Alert.alert(
      'Attribuer un abonnement',
      'Choisissez le niveau d\'abonnement à attribuer gratuitement:',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Free (retirer)',
          onPress: async () => {
            await adminService.giveSubscription(userId!, 'free');
            Alert.alert('Succès', 'Abonnement retiré.');
            loadUser();
          },
        },
        {
          text: 'Plus',
          onPress: async () => {
            await adminService.giveSubscription(userId!, 'plus');
            Alert.alert('Succès', 'Abonnement Plus attribué !');
            loadUser();
          },
        },
        {
          text: 'Premium',
          onPress: async () => {
            await adminService.giveSubscription(userId!, 'premium');
            Alert.alert('Succès', 'Abonnement Premium attribué !');
            loadUser();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Utilisateur non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header / Photos */}
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {user.photos.length > 0 ? (
            user.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.photo} />
            ))
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Status Badges */}
      <View style={styles.badges}>
        {user.isBanned && (
          <View style={[styles.badge, styles.bannedBadge]}>
            <Ionicons name="ban" size={14} color={colors.error} />
            <Text style={styles.bannedText}>Banni</Text>
          </View>
        )}
        {user.isPremium && (
          <View style={[styles.badge, styles.premiumBadge]}>
            <Ionicons name="diamond" size={14} color={colors.premium} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        {user.isVerified && (
          <View style={[styles.badge, styles.verifiedBadge]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>Vérifié</Text>
          </View>
        )}
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.name}>{user.displayName}, {user.age}</Text>
        <Text style={styles.userId}>ID: {user.id}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Genre</Text>
            <Text style={styles.infoValue}>{user.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intention</Text>
            <Text style={styles.infoValue}>{user.intention}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inscription</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dernière activité</Text>
            <Text style={styles.infoValue}>
              {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.matchCount}</Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.messageCount}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.reportCount}</Text>
            <Text style={styles.statLabel}>Signalements</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.reportedByCount}</Text>
            <Text style={styles.statLabel}>Signalé par</Text>
          </View>
        </View>
      </View>

      {/* Reports received */}
      {user.reportsReceived && user.reportsReceived.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signalements reçus</Text>
          {user.reportsReceived.map((report, index) => (
            <View key={index} style={styles.reportCard}>
              <Text style={styles.reportReason}>{report.reason}</Text>
              <Text style={styles.reportDescription}>{report.description}</Text>
              <Text style={styles.reportDate}>
                {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Give Subscription */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleGiveSubscription}>
          <Ionicons name="gift" size={20} color={colors.premium} />
          <Text style={[styles.actionText, { color: colors.premium }]}>
            Attribuer un abonnement gratuit
          </Text>
        </TouchableOpacity>

        {!user.isVerified && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleVerify}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>
              Vérifier manuellement
            </Text>
          </TouchableOpacity>
        )}

        {user.isBanned ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleUnban}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Débannir</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={handleBan}>
            <Ionicons name="ban" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Bannir</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={colors.white} />
          <Text style={[styles.actionText, { color: colors.white }]}>
            Supprimer définitivement
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.card,
  },
  photo: {
    width: 200,
    height: 250,
    marginRight: 2,
  },
  photoPlaceholder: {
    width: 200,
    height: 250,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  bannedBadge: {
    backgroundColor: colors.error + '20',
  },
  bannedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  premiumBadge: {
    backgroundColor: colors.premium + '20',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.premium,
  },
  verifiedBadge: {
    backgroundColor: colors.success + '20',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  userId: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  bio: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportReason: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
  },
  reportDescription: {
    ...typography.body,
    color: colors.text,
    marginTop: 4,
  },
  reportDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
});
