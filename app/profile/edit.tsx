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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { profilesService } from '../../src/services/supabase/profiles';
import { storageService } from '../../src/services/supabase/storage';
import { INTENTION_LIST, IntentionId } from '../../src/constants/intentions';
import { AVAILABILITY_LIST, AvailabilityId } from '../../src/constants/availability';
import {
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  CHILDREN_OPTIONS,
  PROFILE_PROMPTS,
  HEIGHT_RANGE,
  DrinkingId,
  SmokingId,
  ChildrenId,
  PromptId,
  ProfilePromptAnswer,
} from '../../src/constants/lifestyle';
import { INTEREST_CATEGORIES } from '../../src/constants/interests';
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

  // Pour le modal des prompts
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId | null>(null);
  const [promptAnswer, setPromptAnswer] = useState('');

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

      console.log('Video picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoLoading(true);
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
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

  // Gestion des prompts
  const handleAddPrompt = () => {
    setEditingPromptIndex(null);
    setSelectedPromptId(null);
    setPromptAnswer('');
    setShowPromptModal(true);
  };

  const handleEditPrompt = (index: number) => {
    const prompt = prompts[index];
    setEditingPromptIndex(index);
    setSelectedPromptId(prompt.promptId);
    setPromptAnswer(prompt.answer);
    setShowPromptModal(true);
  };

  const handleSavePrompt = () => {
    if (!selectedPromptId || !promptAnswer.trim()) return;

    const newPrompt: ProfilePromptAnswer = {
      promptId: selectedPromptId,
      answer: promptAnswer.trim(),
    };

    if (editingPromptIndex !== null) {
      const updated = [...prompts];
      updated[editingPromptIndex] = newPrompt;
      setPrompts(updated);
    } else {
      setPrompts([...prompts, newPrompt]);
    }

    setShowPromptModal(false);
    setSelectedPromptId(null);
    setPromptAnswer('');
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const getPromptLabel = (promptId: PromptId): string => {
    return PROFILE_PROMPTS.find(p => p.id === promptId)?.label || '';
  };

  const usedPromptIds = prompts.map(p => p.promptId);
  const availablePrompts = PROFILE_PROMPTS.filter(p => !usedPromptIds.includes(p.id));

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
        // New video selected, upload it
        setUploadStatus('Upload de la vidéo... (peut prendre du temps)');
        const { url, error: videoError } = await storageService.uploadProfileVideo(
          user.id,
          videoUri
        );
        if (videoError) {
          console.error('Error uploading video:', videoError);
          Alert.alert(
            'Attention',
            'La vidéo n\'a pas pu être uploadée. Le reste de votre profil sera sauvegardé.',
            [{ text: 'OK' }]
          );
        } else {
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

        {/* Video */}
        <View style={styles.section}>
          <View style={styles.videoHeader}>
            <Ionicons name="videocam" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Vidéo de présentation</Text>
            <Text style={styles.optionalLabel}>Optionnel</Text>
          </View>

          {videoUri ? (
            <View style={styles.videoPreviewContainer}>
              {videoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.videoLoadingText}>Chargement de la vidéo...</Text>
                </View>
              )}
              <Video
                source={{ uri: videoUri }}
                style={[styles.videoPreview, videoLoading && { opacity: 0.3 }]}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
                useNativeControls
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)}
                onError={() => setVideoLoading(false)}
              />
              <Pressable style={styles.removeVideoButton} onPress={handleRemoveVideo}>
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addVideoButton} onPress={handlePickVideo}>
              <Ionicons name="videocam-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.addVideoText}>Ajouter une vidéo (max 30s)</Text>
            </Pressable>
          )}

          <View style={styles.videoBonus}>
            <Ionicons name="star" size={16} color={colors.secondary} />
            <Text style={styles.videoBonusText}>
              Les profils avec vidéo sont 3x plus vus !
            </Text>
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

        {/* Taille */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taille (optionnel)</Text>
          <View style={styles.heightContainer}>
            <Pressable
              style={styles.heightButton}
              onPress={() => setHeight(h => Math.max(HEIGHT_RANGE.min, (h || HEIGHT_RANGE.default) - 1))}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </Pressable>
            <View style={styles.heightDisplay}>
              <Text style={styles.heightValue}>
                {height ? `${height} cm` : '-- cm'}
              </Text>
            </View>
            <Pressable
              style={styles.heightButton}
              onPress={() => setHeight(h => Math.min(HEIGHT_RANGE.max, (h || HEIGHT_RANGE.default) + 1))}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          </View>
          {!height && (
            <Pressable onPress={() => setHeight(HEIGHT_RANGE.default)}>
              <Text style={styles.setHeightLink}>Définir ma taille</Text>
            </Pressable>
          )}
        </View>

        {/* Alcool */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcool</Text>
          <View style={styles.chipContainer}>
            {DRINKING_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  drinking === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setDrinking(drinking === option.id ? null : option.id)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={drinking === option.id ? colors.textLight : colors.text}
                />
                <Text
                  style={[
                    styles.optionText,
                    drinking === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tabac */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabac</Text>
          <View style={styles.chipContainer}>
            {SMOKING_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  smoking === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setSmoking(smoking === option.id ? null : option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    smoking === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Enfants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enfants</Text>
          <View style={styles.chipContainer}>
            {CHILDREN_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  children === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setChildren(children === option.id ? null : option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    children === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Centres d'intérêt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d'intérêt ({interests.length}/10)</Text>
          {Object.values(INTEREST_CATEGORIES).map((category) => (
            <View key={category.id} style={styles.interestCategory}>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <View style={styles.chipContainer}>
                {category.interests.map((interest) => (
                  <Pressable
                    key={interest}
                    style={[
                      styles.interestChip,
                      interests.includes(interest) && styles.interestChipSelected,
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        interests.includes(interest) && styles.interestTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Prompts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parlez de vous</Text>
          <Text style={styles.sectionSubtitle}>
            Répondez à des questions pour montrer votre personnalité
          </Text>

          {prompts.map((prompt, index) => (
            <Pressable
              key={index}
              style={styles.promptCard}
              onPress={() => handleEditPrompt(index)}
            >
              <View style={styles.promptHeader}>
                <Text style={styles.promptQuestion}>{getPromptLabel(prompt.promptId)}</Text>
                <Pressable onPress={() => handleRemovePrompt(index)}>
                  <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>
              <Text style={styles.promptAnswer}>{prompt.answer}</Text>
            </Pressable>
          ))}

          {prompts.length < 3 && (
            <Pressable style={styles.addPromptButton} onPress={handleAddPrompt}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.addPromptText}>
                Ajouter une réponse ({prompts.length}/3)
              </Text>
            </Pressable>
          )}
        </View>
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

      {/* Modal pour les prompts */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPromptModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Votre réponse</Text>
            <Pressable onPress={handleSavePrompt} disabled={!selectedPromptId || !promptAnswer.trim()}>
              <Text style={[
                styles.modalSave,
                (!selectedPromptId || !promptAnswer.trim()) && styles.modalSaveDisabled
              ]}>
                OK
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Choisissez une question</Text>
            <View style={styles.promptsList}>
              {availablePrompts.map((prompt) => (
                <Pressable
                  key={prompt.id}
                  style={[
                    styles.promptOption,
                    selectedPromptId === prompt.id && styles.promptOptionSelected,
                  ]}
                  onPress={() => setSelectedPromptId(prompt.id)}
                >
                  <Text
                    style={[
                      styles.promptOptionText,
                      selectedPromptId === prompt.id && styles.promptOptionTextSelected,
                    ]}
                  >
                    {prompt.label}
                  </Text>
                  {selectedPromptId === prompt.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>

            {selectedPromptId && (
              <View style={styles.answerSection}>
                <Text style={styles.modalSectionTitle}>Votre réponse</Text>
                <TextInput
                  style={styles.answerInput}
                  value={promptAnswer}
                  onChangeText={setPromptAnswer}
                  placeholder="Tapez votre réponse ici..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.answerCharCount}>{promptAnswer.length}/300</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
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
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  uploadStatusText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  // Video section styles
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionalLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  videoPreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  videoPreview: {
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeVideoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
  },
  addVideoButton: {
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addVideoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  videoBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.secondary + '15',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  videoBonusText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  // Height styles
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  heightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightDisplay: {
    width: 100,
    alignItems: 'center',
  },
  heightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  setHeightLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Option chip styles (for lifestyle)
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.textLight,
  },
  // Interest styles
  interestCategory: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  interestChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  interestTextSelected: {
    color: colors.textLight,
  },
  // Prompt styles
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  promptQuestion: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  promptAnswer: {
    ...typography.body,
    color: colors.text,
  },
  addPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPromptText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalSave: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  promptsList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  promptOptionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  promptOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  answerSection: {
    marginTop: spacing.md,
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
    ...typography.body,
    color: colors.text,
  },
  answerCharCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  // Video loading styles
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: borderRadius.md,
  },
  videoLoadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
