import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { profilesService } from '../../src/services/supabase/profiles';
import { moderationService } from '../../src/services/supabase/moderation';
import { matchesService } from '../../src/services/supabase/matches';
import { invitationsService } from '../../src/services/supabase/invitations';
import { Profile } from '../../src/types/profile';
import { IntentionBadge } from '../../src/components/profile/IntentionBadge';
import { AvailabilityBadge } from '../../src/components/profile/AvailabilityBadge';
import { EngagementBadge } from '../../src/components/engagement';
import { InterestChips } from '../../src/components/profile/InterestChips';
import { Button } from '../../src/components/ui/Button';
import { canSendDirectMessage } from '../../src/utils/messagingPermissions';
import { useLanguage } from '../../src/contexts/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileViewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  useEffect(() => {
    if (!userId || !user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfiles = async () => {
      // Si on a déjà le profil, pas besoin de recharger
      if (profile && profile.id === userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Timeout de sécurité - arrêter le chargement après 8 secondes
      const timeout = setTimeout(() => {
        if (isMounted) {
          console.log('[ProfileView] Timeout reached, stopping loading');
          setIsLoading(false);
        }
      }, 8000);

      try {
        console.log('[ProfileView] Loading profiles for:', userId);
        // Charger le profil consulté et mon propre profil en parallèle
        const [targetProfile, ownProfile] = await Promise.all([
          profilesService.getProfile(userId),
          profilesService.getProfile(user.id),
        ]);

        clearTimeout(timeout);

        if (isMounted) {
          console.log('[ProfileView] Profiles loaded successfully');
          setProfile(targetProfile.profile);
          setMyProfile(ownProfile.profile);
          setIsLoading(false);
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error('[ProfileView] Error loading profile:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [userId, user?.id, profile?.id]);

  // Vérifier si je peux envoyer un message direct
  const canDirectMessage = myProfile && profile
    ? canSendDirectMessage(myProfile.gender, profile.gender)
    : false;

  const handleReport = () => {
    router.push(`/moderation/report?userId=${userId}` as any);
  };

  const handleBlock = async () => {
    if (!user || !userId) return;
    await moderationService.blockUser(user.id, userId);
    router.back();
  };

  // Envoyer un message direct (crée une connexion instantanée)
  const handleDirectMessage = async () => {
    if (!user || !userId || !myProfile || !profile) return;

    setIsSendingMessage(true);
    try {
      const result = await matchesService.createInstantConnection(
        user.id,
        userId,
        myProfile.gender,
        profile.gender
      );

      if (result.error) {
        Alert.alert(
          language === 'fr' ? 'Erreur' : 'Error',
          result.error
        );
        return;
      }

      if (result.conversationId) {
        // Aller directement à la conversation
        router.replace(`/chat/${result.conversationId}` as any);
      }
    } catch (error) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Une erreur est survenue' : 'An error occurred'
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Envoyer une invitation (système classique)
  const handleSendInvitation = async () => {
    if (!user || !profile) return;

    setIsSendingInvitation(true);
    try {
      const { error } = await invitationsService.sendInvitation(user.id, profile.id);

      if (error) {
        Alert.alert(
          language === 'fr' ? 'Erreur' : 'Error',
          error
        );
      } else {
        Alert.alert(
          language === 'fr' ? 'Invitation envoyée' : 'Invitation sent',
          language === 'fr'
            ? `Votre invitation a été envoyée à ${profile.displayName}. Vous serez notifié(e) si elle est acceptée.`
            : `Your invitation has been sent to ${profile.displayName}. You will be notified if it is accepted.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Une erreur est survenue' : 'An error occurred'
      );
    } finally {
      setIsSendingInvitation(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil non trouvé</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const photos = profile.photos.length > 0 ? profile.photos : [null];

  return (
    <View style={styles.container}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {photos[currentPhotoIndex] ? (
          <Image
            source={{ uri: photos[currentPhotoIndex]! }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>👤</Text>
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        {/* Photo navigation */}
        <View style={styles.photoNav}>
          <Pressable
            style={styles.photoNavArea}
            onPress={() => setCurrentPhotoIndex((i) => Math.max(0, i - 1))}
          />
          <Pressable
            style={styles.photoNavArea}
            onPress={() => setCurrentPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
          />
        </View>

        {/* Photo indicators */}
        {photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhotoIndex && styles.photoIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* More button */}
        <Pressable style={styles.moreButton} onPress={handleReport}>
          <Text style={styles.moreIcon}>⚠️</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {profile.displayName}, {profile.age}
          </Text>
          <View style={styles.badges}>
            <IntentionBadge intention={profile.intention} />
            <AvailabilityBadge availability={profile.availability} />
            <EngagementBadge
              userId={profile.id}
              size="medium"
            />
          </View>
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Centres d'intérêt</Text>
            <InterestChips interests={profile.interests} maxDisplay={20} />
          </View>
        )}

        {/* Action principale : Message direct ou Invitation */}
        <View style={styles.mainAction}>
          {canDirectMessage ? (
            <Button
              title={language === 'fr' ? '💬 Envoyer un message' : '💬 Send a message'}
              onPress={handleDirectMessage}
              variant="primary"
              loading={isSendingMessage}
            />
          ) : (
            <Button
              title={language === 'fr' ? '💌 Envoyer une invitation' : '💌 Send an invitation'}
              onPress={handleSendInvitation}
              variant="primary"
              loading={isSendingInvitation}
              disabled={isSendingInvitation}
            />
          )}

          {/* Info sur le privilège */}
          {canDirectMessage && (
            <Text style={styles.privilegeInfo}>
              {myProfile?.gender === 'femme'
                ? (language === 'fr'
                    ? '✨ Vous pouvez contacter directement les hommes'
                    : '✨ You can contact men directly')
                : (language === 'fr'
                    ? '✨ Vous pouvez contacter directement les personnes non-binaires'
                    : '✨ You can contact non-binary people directly')}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={language === 'fr' ? 'Bloquer cet utilisateur' : 'Block this user'}
            onPress={handleBlock}
            variant="outline"
            size="small"
          />
        </View>
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  photoContainer: {
    height: SCREEN_HEIGHT * 0.5,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 80,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  photoNavArea: {
    flex: 1,
  },
  photoIndicators: {
    position: 'absolute',
    top: spacing.xl + 20,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: colors.textLight,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl + 20,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.textLight,
  },
  moreButton: {
    position: 'absolute',
    top: spacing.xl + 20,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  mainAction: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  privilegeInfo: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
