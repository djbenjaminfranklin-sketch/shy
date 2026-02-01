import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { profilesService } from '../../src/services/supabase/profiles';
import { storageService } from '../../src/services/supabase/storage';
import { INTENTION_LIST, IntentionId } from '../../src/constants/intentions';
import { AVAILABILITY_LIST, AvailabilityId } from '../../src/constants/availability';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';

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
  const [isSaving, setIsSaving] = useState(false);

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

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        // Store local URI for now, will be uploaded to Supabase Storage on save
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo. Veuillez réessayer.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // Upload new photos to Supabase Storage
      const oldPhotos = profile?.photos || [];
      const { urls: uploadedUrls, error: uploadError } = await storageService.replaceUserPhotos(
        user.id,
        oldPhotos,
        photos
      );

      if (uploadError) {
        Alert.alert('Erreur', uploadError);
        setIsSaving(false);
        return;
      }

      // Save profile with uploaded photo URLs
      const { error } = await profilesService.updateProfile(user.id, {
        displayName,
        bio: bio || null,
        intention,
        availability,
        photos: uploadedUrls,
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                  onLoad={() => console.log('Photo loaded:', photo.substring(0, 50))}
                  onError={(e) => console.log('Photo error:', e.nativeEvent.error, photo.substring(0, 50))}
                />
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 6 && (
              <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Text style={styles.addPhotoIcon}>+</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Nom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prénom ou pseudo</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Comment voulez-vous être appelé(e) ?"
            placeholderTextColor={colors.textTertiary}
            maxLength={30}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos de vous</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Parlez de vous..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        {/* Intention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre intention</Text>
          <View style={styles.chipContainer}>
            {INTENTION_LIST.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={intention === item.id}
                onPress={() => setIntention(item.id)}
              />
            ))}
          </View>
        </View>

        {/* Disponibilité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilité</Text>
          <View style={styles.chipContainer}>
            <Chip
              label="Non précisée"
              selected={availability === null}
              onPress={() => setAvailability(null)}
            />
            {AVAILABILITY_LIST.map((item) => (
              <Chip
                key={item.id}
                label={item.labelShort}
                selected={availability === item.id}
                onPress={() => setAvailability(item.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Enregistrer"
          onPress={handleSave}
          loading={isSaving}
          disabled={!displayName.trim()}
        />
      </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    fontSize: 32,
    color: colors.textTertiary,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
