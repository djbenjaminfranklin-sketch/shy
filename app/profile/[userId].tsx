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
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
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

// Cache pour éviter de recharger le profil quand on revient du signalement
const profileCache: Record<string, { profile: Profile | null; myProfile: Profile | null }> = {};

export default function ProfileViewScreen() {
  const { userId, from } = useLocalSearchParams<{ userId: string; from?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  // Navigation back to the correct screen
  const handleGoBack = () => {
    if (from === 'explore') {
      router.replace('/(tabs)/explore' as never);
    } else if (from === 'likes') {
      router.replace('/(tabs)/likes' as never);
    } else if (from === 'matches') {
      router.replace('/(tabs)/matches' as never);
    } else {
      router.back();
    }
  };

  // Initialiser avec le cache si disponible
  const cached = userId ? profileCache[userId] : null;
  const [profile, setProfile] = useState<Profile | null>(cached?.profile || null);
  const [myProfile, setMyProfile] = useState<Profile | null>(cached?.myProfile || null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [hasExistingInvitation, setHasExistingInvitation] = useState(false);
  const [showFriendlyMessage, setShowFriendlyMessage] = useState(false);

  // Charger les profils si pas en cache
  useEffect(() => {
    const loadProfiles = async () => {
      if (!userId || !user) {
        setIsLoading(false);
        return;
      }

      // Si déjà en cache, ne pas recharger
      if (profileCache[userId]) {
        setProfile(profileCache[userId].profile);
        setMyProfile(profileCache[userId].myProfile);
        setIsLoading(false);
        return;
      }

      try {
        const [targetProfile, ownProfile] = await Promise.all([
          profilesService.getProfile(userId),
          profilesService.getProfile(user.id),
        ]);

        // Mettre en cache
        profileCache[userId] = {
          profile: targetProfile.profile,
          myProfile: ownProfile.profile,
        };

        setProfile(targetProfile.profile);
        setMyProfile(ownProfile.profile);

        // Vérifier si une invitation existe déjà
        const { exists } = await invitationsService.checkExistingInvitation(user.id, userId);
        setHasExistingInvitation(exists);
      } catch (error) {
        // Error loading profile
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, [userId, user?.id]);

  // Vérifier si je peux envoyer un message direct
  const canDirectMessage = myProfile && profile
    ? canSendDirectMessage(myProfile.gender, profile.gender)
    : false;

  const handleReport = () => {
    Alert.alert(
      'Signaler ce profil',
      'Pourquoi souhaitez-vous signaler ce profil ?',
      [
        {
          text: 'Faux profil',
          onPress: () => submitReport('fake_profile'),
        },
        {
          text: 'Harcèlement',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Contenu inapproprié',
          onPress: () => submitReport('inappropriate_content'),
        },
        {
          text: 'Mineur suspecté',
          onPress: () => submitReport('underage'),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    if (!user || !userId) return;

    try {
      const { error } = await moderationService.reportUser(user.id, userId, reason as any);
      if (error) {
        Alert.alert('Erreur', error);
      } else {
        Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner ce profil.');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleBlock = () => {
    if (!user || !userId || !profile) return;

    Alert.alert(
      language === 'fr' ? 'Bloquer cet utilisateur ?' : 'Block this user?',
      language === 'fr'
        ? `${profile.displayName} ne pourra plus vous voir ni vous contacter.`
        : `${profile.displayName} will no longer be able to see or contact you.`,
      [
        {
          text: language === 'fr' ? 'Annuler' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'fr' ? 'Bloquer' : 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await moderationService.blockUser(user.id, userId);
              Alert.alert(
                language === 'fr' ? 'Utilisateur bloqué' : 'User blocked',
                language === 'fr'
                  ? `${profile.displayName} a été bloqué. Vous ne verrez plus ce profil.`
                  : `${profile.displayName} has been blocked. You won't see this profile anymore.`,
                [{ text: 'OK', onPress: () => handleGoBack() }]
              );
            } catch (err) {
              Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr' ? 'Une erreur est survenue' : 'An error occurred'
              );
            }
          },
        },
      ]
    );
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

    // Si une invitation existe déjà, afficher un message sympa
    if (hasExistingInvitation) {
      setShowFriendlyMessage(true);
      return;
    }

    setIsSendingInvitation(true);
    try {
      const { error } = await invitationsService.sendInvitation(user.id, profile.id);

      if (error) {
        // Vérifier si c'est une erreur d'invitation existante
        if (error.includes('existe deja') || error.includes('already exists')) {
          setHasExistingInvitation(true);
          setShowFriendlyMessage(true);
        } else {
          Alert.alert(
            language === 'fr' ? 'Erreur' : 'Error',
            error
          );
        }
      } else {
        setHasExistingInvitation(true);
        Alert.alert(
          language === 'fr' ? 'Invitation envoyée 💌' : 'Invitation sent 💌',
          language === 'fr'
            ? `Votre invitation a été envoyée à ${profile.displayName}. Vous serez notifié(e) si elle est acceptée !`
            : `Your invitation has been sent to ${profile.displayName}. You will be notified if it is accepted!`,
          [{ text: 'OK', onPress: () => handleGoBack() }]
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
    // Si on est en train de charger, afficher le spinner
    if (isLoading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      );
    }

    // Sinon, le profil n'existe vraiment pas - retour vers explore
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil non trouvé</Text>
          <Button title="Retour" onPress={() => router.replace('/(tabs)/explore')} variant="outline" />
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
        <Pressable style={styles.closeButton} onPress={handleGoBack}>
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
            <IntentionBadge intention={profile.intention} size="large" />
            <AvailabilityBadge availability={profile.availability} size="large" />
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

        {profile.videoUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vidéo de présentation</Text>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: profile.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
                useNativeControls
              />
            </View>
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
          ) : hasExistingInvitation ? (
            <Button
              title={language === 'fr' ? '💫 Invitation en attente' : '💫 Invitation pending'}
              onPress={handleSendInvitation}
              variant="secondary"
              disabled={false}
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

      {/* Modal message sympa de SHY */}
      <Modal
        visible={showFriendlyMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendlyMessage(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFriendlyMessage(false)}
        >
          <View style={styles.friendlyMessageContainer}>
            <Text style={styles.friendlyEmoji}>💫</Text>
            <Text style={styles.friendlyTitle}>
              {language === 'fr' ? 'Patience !' : 'Patience!'}
            </Text>
            <Text style={styles.friendlyText}>
              {language === 'fr'
                ? `Tu as déjà envoyé une invitation à ${profile?.displayName}. On croise les doigts pour toi ! 🤞`
                : `You've already sent an invitation to ${profile?.displayName}. Fingers crossed for you! 🤞`}
            </Text>
            <TouchableOpacity
              style={styles.friendlyButton}
              onPress={() => setShowFriendlyMessage(false)}
            >
              <Text style={styles.friendlyButtonText}>
                {language === 'fr' ? "D'accord !" : 'Got it!'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  videoContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
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
  // Modal message sympa
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  friendlyMessageContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  friendlyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  friendlyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  friendlyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  friendlyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  friendlyButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
});
