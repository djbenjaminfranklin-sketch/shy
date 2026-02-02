import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { supabase } from '../../src/services/supabase/client';

interface DataCategory {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  { icon: 'person', titleKey: 'profileInfo', descKey: 'profileInfoDesc' },
  { icon: 'images', titleKey: 'photos', descKey: 'photosDesc' },
  { icon: 'chatbubbles', titleKey: 'messages', descKey: 'messagesDesc' },
  { icon: 'people', titleKey: 'connections', descKey: 'connectionsDesc' },
  { icon: 'analytics', titleKey: 'activityData', descKey: 'activityDataDesc' },
];

export default function ExportDataScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const exportUserData = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      // Collecter toutes les données de l'utilisateur
      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
      };

      // 1. Données du profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        exportData.profile = {
          displayName: profileData.display_name,
          birthDate: profileData.birth_date,
          gender: profileData.gender,
          bio: profileData.bio,
          intention: profileData.intention,
          availability: profileData.availability,
          languages: profileData.languages,
          interests: profileData.interests,
          photos: profileData.photos,
          videoUrl: profileData.video_url,
          height: profileData.height,
          drinking: profileData.drinking,
          smoking: profileData.smoking,
          children: profileData.children,
          locationEnabled: profileData.location_enabled,
          searchRadius: profileData.search_radius,
          minAgeFilter: profileData.min_age_filter,
          maxAgeFilter: profileData.max_age_filter,
          genderFilter: profileData.gender_filter,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        };
      }

      // 2. Connexions (matchs)
      const { data: connections } = await supabase
        .from('connections')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      exportData.connections = connections || [];

      // 3. Invitations envoyées
      const { data: sentInvitations } = await supabase
        .from('invitations')
        .select('id, receiver_id, status, created_at')
        .eq('sender_id', user.id);

      exportData.sentInvitations = sentInvitations || [];

      // 4. Invitations reçues
      const { data: receivedInvitations } = await supabase
        .from('invitations')
        .select('id, sender_id, status, created_at')
        .eq('receiver_id', user.id);

      exportData.receivedInvitations = receivedInvitations || [];

      // 5. Messages (seulement les métadonnées et contenu, pas les données des autres utilisateurs)
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, created_at, last_message_at, connection_id')
        .or(`connection_id.in.(${(connections || []).map(c => c.id).join(',')})`);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, created_at, is_read')
          .eq('sender_id', user.id)
          .in('conversation_id', conversationIds);

        exportData.conversations = conversations;
        exportData.sentMessages = messages || [];
      }

      // 6. Blocs
      const { data: blocks } = await supabase
        .from('blocks')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id);

      exportData.blockedUsers = blocks || [];

      // 7. Signalements effectués
      const { data: reports } = await supabase
        .from('reports')
        .select('id, reported_id, reason, description, created_at')
        .eq('reporter_id', user.id);

      exportData.reportsMade = reports || [];

      // Convertir en JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Partager le fichier via le Share natif
      try {
        await Share.share({
          message: jsonData,
          title: `SHY Data Export - ${new Date().toISOString().split('T')[0]}`,
        });

        Alert.alert(
          t('dataExport.exportSuccess'),
          t('dataExport.exportSuccessMessage')
        );
      } catch (shareError) {
        // Si le partage échoue, afficher les données dans une alerte
        console.log('Share failed, data size:', jsonData.length);
        Alert.alert(
          t('dataExport.exportSuccess'),
          t('dataExport.exportSuccessMessage') + '\n\n' + 'Vos données sont prêtes à être copiées.'
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert(
        t('dataExport.exportError'),
        t('dataExport.exportErrorMessage')
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('dataExport.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="download-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.description}>{t('dataExport.description')}</Text>

        <Text style={styles.sectionTitle}>{t('dataExport.whatIncluded')}</Text>

        <View style={styles.categoriesList}>
          {DATA_CATEGORIES.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.categoryText}>
                <Text style={styles.categoryTitle}>
                  {t(`dataExport.${category.titleKey}`)}
                </Text>
                <Text style={styles.categoryDesc}>
                  {t(`dataExport.${category.descKey}`)}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          ))}
        </View>

        <View style={styles.formatNote}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.formatNoteText}>{t('dataExport.formatNote')}</Text>
        </View>

        <Pressable
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={exportUserData}
          disabled={isExporting}
        >
          {isExporting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.textLight} size="small" />
              <Text style={styles.exportButtonText}>{t('dataExport.exporting')}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="download" size={20} color={colors.textLight} />
              <Text style={styles.exportButtonText}>{t('dataExport.exportButton')}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
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
    ...typography.h4,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoriesList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  categoryDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formatNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  formatNoteText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exportButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
});
