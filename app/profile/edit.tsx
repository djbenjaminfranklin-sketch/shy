import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { profilesService } from '../../src/services/supabase/profiles';
import { storageService } from '../../src/services/supabase/storage';
import { IntentionId } from '../../src/constants/intentions';
import { AvailabilityId } from '../../src/constants/availability';
import {
  DrinkingId,
  SmokingId,
  ChildrenId,
  ProfilePromptAnswer,
} from '../../src/constants/lifestyle';
import { Button } from '../../src/components/ui/Button';
import {
  PhotoGrid,
  ProfileFormFields,
  IntentionSelector,
  AvailabilitySelector,
  LifestyleFields,
  InterestsSelector,
  PromptsSection,
} from '../../src/components/profile/edit';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [intention, setIntention] = useState<IntentionId>(profile?.intention || 'social');
  const [availability, setAvailability] = useState<AvailabilityId | null>(
    profile?.availability || null
  );
  const [photos, setPhotos] = useState<string[]>(profile?.photos || []);
  const [videoUri, setVideoUri] = useState<string | null>(profile?.videoUrl || null);
  const [height, setHeight] = useState<number | null>(profile?.height || null);
  const [drinking, setDrinking] = useState<DrinkingId | null>(profile?.drinking || null);
  const [smoking, setSmoking] = useState<SmokingId | null>(profile?.smoking || null);
  const [children, setChildren] = useState<ChildrenId | null>(profile?.children || null);
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [prompts, setPrompts] = useState<ProfilePromptAnswer[]>(profile?.prompts || []);
  const [isSaving, setIsSaving] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleAddPhoto = async () => {
    try {
      // Demander la permission pour la galerie
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission requise',
          'Veuillez autoriser l\'accès à vos photos dans les paramètres.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Store local URI for now, will be uploaded to Supabase Storage on save
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner la photo. Veuillez réessayer.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission requise',
          'Veuillez autoriser l\'accès à vos vidéos dans les paramètres.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoLoading(true);
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo. Veuillez réessayer.');
    }
  };

  const handleRemoveVideo = () => {
    setVideoUri(null);
  };

  // Gestion des intérêts
  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10
        ? [...prev, interest]
        : prev
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setUploadStatus('Préparation...');

    try {
      // Upload new photos to Supabase Storage
      setUploadStatus('Upload des photos...');
      const oldPhotos = profile?.photos || [];
      const { urls: uploadedUrls, error: uploadError } = await storageService.replaceUserPhotos(
        user.id,
        oldPhotos,
        photos
      );

      if (uploadError) {
        Alert.alert('Erreur', uploadError);
        setIsSaving(false);
        setUploadStatus(null);
        return;
      }

      // Upload video if changed
      let uploadedVideoUrl: string | null = profile?.videoUrl || null;

      if (videoUri && videoUri !== profile?.videoUrl) {
        // New video selected, upload it - show blocking overlay
        setIsUploadingVideo(true);
        setUploadStatus('Upload de la vidéo en cours...\nCela peut prendre jusqu\'à 1 minute.\nMerci de patienter.');

        // Attendre que React rende le Modal ET que les animations soient terminées
        await new Promise<void>(resolve => {
          InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 300);
            });
          });
        });

        const { url, error: videoError } = await storageService.uploadProfileVideo(
          user.id,
          videoUri
        );
        setIsUploadingVideo(false);

        if (videoError) {
          Alert.alert(
            'Erreur vidéo',
            `La vidéo n'a pas pu être uploadée.\n\nDétail: ${videoError}\n\nLe reste de votre profil sera sauvegardé.`,
            [{ text: 'OK' }]
          );
        } else if (url) {
          uploadedVideoUrl = url;
        }
      } else if (!videoUri && profile?.videoUrl) {
        // Video removed
        uploadedVideoUrl = null;
      }

      // Save profile with uploaded photo URLs and video
      setUploadStatus('Enregistrement du profil...');
      const { error } = await profilesService.updateProfile(user.id, {
        displayName,
        bio: bio || null,
        intention,
        availability,
        photos: uploadedUrls,
        videoUrl: uploadedVideoUrl,
        height,
        drinking,
        smoking,
        children,
        interests,
        prompts,
      });

      if (error) {
        Alert.alert('Erreur', error);
      } else {
        await refreshProfile();
        router.replace('/(tabs)/profile');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
      setUploadStatus(null);
    }
  };

  const handleCancel = () => {
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header avec bouton Annuler */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.cancelButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Photos & Vidéo */}
        <PhotoGrid
          photos={photos}
          videoUri={videoUri}
          videoLoading={videoLoading}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          onPickVideo={handlePickVideo}
          onRemoveVideo={handleRemoveVideo}
          onVideoLoadStart={() => setVideoLoading(true)}
          onVideoLoad={() => setVideoLoading(false)}
          onVideoError={() => setVideoLoading(false)}
        />

        {/* Nom & Bio */}
        <ProfileFormFields
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          bio={bio}
          onBioChange={setBio}
        />

        {/* Intention */}
        <IntentionSelector
          intention={intention}
          onIntentionChange={setIntention}
        />

        {/* Disponibilité */}
        <AvailabilitySelector
          availability={availability}
          onAvailabilityChange={setAvailability}
        />

        {/* Taille & Lifestyle */}
        <LifestyleFields
          height={height}
          onHeightChange={setHeight}
          drinking={drinking}
          onDrinkingChange={setDrinking}
          smoking={smoking}
          onSmokingChange={setSmoking}
          children={children}
          onChildrenChange={setChildren}
        />

        {/* Centres d'intérêt */}
        <InterestsSelector
          interests={interests}
          onToggleInterest={toggleInterest}
        />

        {/* Prompts */}
        <PromptsSection
          prompts={prompts}
          onPromptsChange={setPrompts}
        />
      </ScrollView>

      <View style={styles.footer}>
        {uploadStatus && (
          <View style={styles.uploadStatus}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
          </View>
        )}
        <Button
          title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
          onPress={handleSave}
          loading={isSaving}
          disabled={!displayName.trim() || isSaving}
        />
      </View>

      {/* Modal overlay pour l'upload vidéo */}
      <Modal
        visible={isUploadingVideo}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadOverlayContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadOverlayTitle}>Upload en cours</Text>
            <Text style={styles.uploadOverlayText}>
              {uploadStatus || 'Veuillez patienter...'}
            </Text>
            <Text style={styles.uploadOverlayWarning}>
              Ne quittez pas cette page
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  uploadStatusText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.primary,
  },
  // Upload overlay styles
  uploadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  uploadOverlayContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  uploadOverlayTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  uploadOverlayText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  uploadOverlayWarning: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.error,
    textAlign: 'center',
  },
});
