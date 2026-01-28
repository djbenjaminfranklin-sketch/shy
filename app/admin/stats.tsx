import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { adminService, DetailedStats } from '../../src/services/supabase/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    const data = await adminService.getDetailedStats();
    setStats(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const BarChart = ({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.bars}>
          {data.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Main Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Utilisateurs totaux"
            value={stats?.totalUsers || 0}
            icon="people"
            color={colors.primary}
          />
          <StatCard
            title="Actifs (7j)"
            value={stats?.activeWeek || 0}
            icon="pulse"
            color={colors.success}
          />
          <StatCard
            title="Premium"
            value={stats?.premiumUsers || 0}
            icon="diamond"
            color={colors.premium}
            subtitle={`${stats?.premiumRate || 0}% taux conversion`}
          />
          <StatCard
            title="Nouveaux (30j)"
            value={stats?.newMonth || 0}
            icon="sparkles"
            color={colors.superLike}
          />
        </View>
      </View>

      {/* Gender Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Répartition par genre</Text>
        <BarChart
          title=""
          data={[
            { label: 'Hommes', value: stats?.genderStats?.homme || 0, color: colors.superLike },
            { label: 'Femmes', value: stats?.genderStats?.femme || 0, color: colors.primary },
            { label: 'Non-binaire', value: stats?.genderStats?.['non-binaire'] || 0, color: colors.premium },
            { label: 'Autre', value: stats?.genderStats?.autre || 0, color: colors.textSecondary },
          ]}
        />
      </View>

      {/* Age Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Répartition par âge</Text>
        <BarChart
          title=""
          data={[
            { label: '18-24', value: stats?.ageStats?.['18-24'] || 0, color: colors.primary },
            { label: '25-34', value: stats?.ageStats?.['25-34'] || 0, color: colors.superLike },
            { label: '35-44', value: stats?.ageStats?.['35-44'] || 0, color: colors.premium },
            { label: '45-54', value: stats?.ageStats?.['45-54'] || 0, color: colors.success },
            { label: '55+', value: stats?.ageStats?.['55+'] || 0, color: colors.textSecondary },
          ]}
        />
      </View>

      {/* Engagement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement</Text>
        <View style={styles.engagementGrid}>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementValue}>{stats?.totalMatches || 0}</Text>
            <Text style={styles.engagementLabel}>Matchs totaux</Text>
          </View>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementValue}>{stats?.totalMessages || 0}</Text>
            <Text style={styles.engagementLabel}>Messages envoyés</Text>
          </View>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementValue}>{stats?.avgMatchesPerUser || 0}</Text>
            <Text style={styles.engagementLabel}>Matchs / utilisateur</Text>
          </View>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementValue}>{stats?.verifiedUsers || 0}</Text>
            <Text style={styles.engagementLabel}>Profils vérifiés</Text>
          </View>
        </View>
      </View>

      {/* Revenue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenus</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Revenus du mois</Text>
            <Text style={styles.revenueValue}>{stats?.monthlyRevenue || 0} EUR</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Abonnés Plus</Text>
            <Text style={styles.revenueSubvalue}>{stats?.plusSubscribers || 0}</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Abonnés Premium</Text>
            <Text style={styles.revenueSubvalue}>{stats?.premiumSubscribers || 0}</Text>
          </View>
        </View>
      </View>

      {/* Moderation */}
      <View style={[styles.section, { marginBottom: spacing.xxl }]}>
        <Text style={styles.sectionTitle}>Modération</Text>
        <View style={styles.moderationGrid}>
          <View style={styles.moderationCard}>
            <Ionicons name="flag" size={24} color="#FF9800" />
            <Text style={styles.moderationValue}>{stats?.pendingReports || 0}</Text>
            <Text style={styles.moderationLabel}>Signalements en attente</Text>
          </View>
          <View style={styles.moderationCard}>
            <Ionicons name="ban" size={24} color={colors.error} />
            <Text style={styles.moderationValue}>{stats?.bannedUsers || 0}</Text>
            <Text style={styles.moderationLabel}>Utilisateurs bannis</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  chartTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 32,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  engagementCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  engagementLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  revenueLabel: {
    ...typography.body,
    color: colors.text,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  revenueSubvalue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  moderationGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moderationCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  moderationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  moderationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
