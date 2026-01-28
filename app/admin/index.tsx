import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { adminService, AdminStats } from '../../src/services/supabase/admin';
import { supabase } from '../../src/services/supabase/client';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionEmail, setSubscriptionEmail] = useState('');

  const loadStats = async () => {
    const data = await adminService.getStats();
    setStats(data);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleGiveSubscription = async (tier: 'plus' | 'premium') => {
    if (!subscriptionEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }

    // Rechercher l'utilisateur par email
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('email', subscriptionEmail.trim().toLowerCase())
      .single();

    if (error || !user) {
      Alert.alert('Erreur', 'Utilisateur non trouvé avec cet email');
      return;
    }

    await adminService.giveSubscription(user.id, tier);
    Alert.alert('Succès', `Abonnement ${tier === 'plus' ? 'Plus' : 'Premium'} attribué à ${user.display_name} !`);
    setShowSubscriptionModal(false);
    setSubscriptionEmail('');
    loadStats();
  };

  const menuItems = [
    {
      title: 'Utilisateurs',
      subtitle: `${stats?.totalUsers || 0} inscrits`,
      icon: 'people',
      color: colors.primary,
      route: '/admin/users',
    },
    {
      title: 'Signalements',
      subtitle: `${stats?.pendingReports || 0} en attente`,
      icon: 'warning',
      color: '#FF9800',
      route: '/admin/reports',
      badge: stats?.pendingReports || 0,
    },
    {
      title: 'Statistiques',
      subtitle: 'Analyses détaillées',
      icon: 'stats-chart',
      color: colors.superLike,
      route: '/admin/stats',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>SHY Dashboard</Text>
          </View>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.activeToday || 0}</Text>
            <Text style={styles.statLabel}>Actifs aujourd'hui</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.newToday || 0}</Text>
            <Text style={styles.statLabel}>Nouveaux</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.premiumUsers || 0}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users?filter=reported' as any)}
            >
              <Ionicons name="flag" size={20} color={colors.error} />
              <Text style={styles.actionText}>Signalés</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users?filter=unverified' as any)}
            >
              <Ionicons name="shield" size={20} color="#FF9800" />
              <Text style={styles.actionText}>Non vérifiés</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users?filter=new' as any)}
            >
              <Ionicons name="sparkles" size={20} color={colors.superLike} />
              <Text style={styles.actionText}>Nouveaux</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offrir un abonnement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnements</Text>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => setShowSubscriptionModal(true)}
          >
            <LinearGradient
              colors={[colors.premium, '#FFB800']}
              style={styles.subscriptionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="gift" size={24} color={colors.white} />
              <Text style={styles.subscriptionButtonText}>Offrir un abonnement</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Offrir Abonnement */}
      <Modal
        visible={showSubscriptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offrir un abonnement</Text>
              <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Email de l'utilisateur</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="email@exemple.com"
              placeholderTextColor={colors.textTertiary}
              value={subscriptionEmail}
              onChangeText={setSubscriptionEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.plusButton]}
                onPress={() => handleGiveSubscription('plus')}
              >
                <Ionicons name="star" size={20} color={colors.white} />
                <Text style={styles.modalButtonText}>Plus</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.premiumButton]}
                onPress={() => handleGiveSubscription('premium')}
              >
                <Ionicons name="diamond" size={20} color={colors.white} />
                <Text style={styles.modalButtonText}>Premium</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSubscriptionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  menu: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    ...typography.h4,
    color: colors.text,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Subscription section
  subscriptionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  subscriptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  subscriptionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  plusButton: {
    backgroundColor: colors.primary,
  },
  premiumButton: {
    backgroundColor: colors.premium,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
