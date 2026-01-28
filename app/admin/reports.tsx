import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { adminService, Report } from '../../src/services/supabase/admin';

type FilterType = 'pending' | 'reviewed' | 'all';

const REPORT_REASONS: Record<string, string> = {
  inappropriate_content: 'Contenu inapproprié',
  harassment: 'Harcèlement',
  fake_profile: 'Faux profil',
  spam: 'Spam',
  underage: 'Mineur',
  other: 'Autre',
};

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending');

  const loadReports = async () => {
    setIsLoading(true);
    const data = await adminService.getReports(filter);
    setReports(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [filter]);

  const handleDismiss = (report: Report) => {
    Alert.alert(
      'Ignorer le signalement',
      'Ce signalement sera marqué comme traité sans action.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ignorer',
          onPress: async () => {
            await adminService.resolveReport(report.id, 'dismissed');
            loadReports();
          },
        },
      ]
    );
  };

  const handleWarn = async (report: Report) => {
    await adminService.resolveReport(report.id, 'warned');
    await adminService.warnUser(report.reportedUserId);
    Alert.alert('Avertissement envoyé', "L'utilisateur a été averti.");
    loadReports();
  };

  const handleBan = (report: Report) => {
    Alert.alert(
      'Bannir utilisateur',
      "L'utilisateur signalé sera banni définitivement.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bannir',
          style: 'destructive',
          onPress: async () => {
            await adminService.resolveReport(report.id, 'banned');
            await adminService.banUser(report.reportedUserId);
            loadReports();
          },
        },
      ]
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'pending', label: 'En attente' },
    { key: 'reviewed', label: 'Traités' },
    { key: 'all', label: 'Tous' },
  ];

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={[styles.reasonBadge, { backgroundColor: getReasonColor(item.reason) + '20' }]}>
          <Text style={[styles.reasonText, { color: getReasonColor(item.reason) }]}>
            {REPORT_REASONS[item.reason] || item.reason}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.usersRow}>
        {/* Reporter */}
        <TouchableOpacity
          style={styles.userBox}
          onPress={() => router.push(`/admin/user-detail?userId=${item.reporterId}` as any)}
        >
          <Text style={styles.userLabel}>Signalé par</Text>
          <View style={styles.userInfo}>
            {item.reporterPhoto ? (
              <Image source={{ uri: item.reporterPhoto }} style={styles.userPhoto} />
            ) : (
              <View style={styles.userPhotoPlaceholder}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.userName}>{item.reporterName}</Text>
          </View>
        </TouchableOpacity>

        <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />

        {/* Reported */}
        <TouchableOpacity
          style={styles.userBox}
          onPress={() => router.push(`/admin/user-detail?userId=${item.reportedUserId}` as any)}
        >
          <Text style={styles.userLabel}>Utilisateur signalé</Text>
          <View style={styles.userInfo}>
            {item.reportedUserPhoto ? (
              <Image source={{ uri: item.reportedUserPhoto }} style={styles.userPhoto} />
            ) : (
              <View style={styles.userPhotoPlaceholder}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.userName}>{item.reportedUserName}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {item.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.dismissBtn]}
            onPress={() => handleDismiss(item)}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
            <Text style={styles.dismissText}>Ignorer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.warnBtn]}
            onPress={() => handleWarn(item)}
          >
            <Ionicons name="warning" size={18} color="#FF9800" />
            <Text style={styles.warnText}>Avertir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.banBtn]}
            onPress={() => handleBan(item)}
          >
            <Ionicons name="ban" size={18} color={colors.error} />
            <Text style={styles.banText}>Bannir</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status !== 'pending' && (
        <View style={styles.resolvedBadge}>
          <Ionicons
            name={item.status === 'dismissed' ? 'checkmark' : item.status === 'warned' ? 'warning' : 'ban'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.resolvedText}>
            {item.status === 'dismissed' ? 'Ignoré' : item.status === 'warned' ? 'Averti' : 'Banni'}
          </Text>
        </View>
      )}
    </View>
  );

  const getReasonColor = (reason: string): string => {
    switch (reason) {
      case 'harassment':
      case 'underage':
        return colors.error;
      case 'inappropriate_content':
        return '#FF9800';
      case 'fake_profile':
      case 'spam':
        return colors.superLike;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark" size={48} color={colors.success} />
              <Text style={styles.emptyText}>Aucun signalement</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  usersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  userBox: {
    flex: 1,
  },
  userLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  descriptionBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  descriptionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dismissBtn: {
    backgroundColor: colors.surface,
  },
  warnBtn: {
    backgroundColor: '#FF980020',
  },
  banBtn: {
    backgroundColor: colors.error + '20',
  },
  dismissText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  warnText: {
    color: '#FF9800',
    fontWeight: '600',
    fontSize: 13,
  },
  banText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  resolvedText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
