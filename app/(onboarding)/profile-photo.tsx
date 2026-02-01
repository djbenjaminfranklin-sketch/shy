import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { t } = useLanguage();
  const photo = data.photoUri;
  const video = data.videoUri;
  const [_isLoading, _setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const pickImage = async () => {
    try {
      // Demander la permission pour la galerie
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('onboarding.photoPermission'), t('onboarding.photoPermissionMessage'));
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
        console.log('Photo selected:', result.assets[0].uri);
        setImageLoaded(false);
        updateData({ photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('alerts.errorTitle'), t('onboarding.photoError'));
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('onboarding.photoPermission'), t('onboarding.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Photo taken:', result.assets[0].uri);
        setImageLoaded(false);
        updateData({ photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('alerts.errorTitle'), t('onboarding.cameraError'));
    }
  };

  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('onboarding.photoPermission'), t('onboarding.photoPermissionMessage'));
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
        console.log('Video selected:', result.assets[0].uri);
        updateData({ videoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert(t('alerts.errorTitle'), t('onboarding.videoError') || 'Erreur lors de la selection de la video');
    }
  };

  const removeVideo = () => {
    updateData({ videoUri: null });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          <Text style={styles.title}>{t('onboarding.addPhoto')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.photoHelps')}</Text>

          <Pressable style={styles.photoContainer} onPress={pickImage}>
            {photo ? (
              <View style={styles.photoWrapper}>
                {!imageLoaded && (
                  <View style={styles.photoLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
                <Image
                  source={{ uri: photo }}
                  style={[styles.photo, !imageLoaded && { opacity: 0 }]}
                  resizeMode="cover"
                  onLoad={() => {
                    console.log('Image loaded successfully:', photo);
                    setImageLoaded(true);
                  }}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error, 'URI:', photo);
                    setImageLoaded(false);
                  }}
                />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.photoText}>{t('onboarding.addPhotoButton')}</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.options}>
            <Pressable style={styles.optionButton} onPress={pickImage}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="images" size={28} color={colors.primary} />
              </View>
              <Text style={styles.optionText}>{t('onboarding.gallery')}</Text>
            </Pressable>
            <Pressable style={styles.optionButton} onPress={takePhoto}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </View>
              <Text style={styles.optionText}>{t('onboarding.camera')}</Text>
            </Pressable>
          </View>

          {/* Section Video */}
          <View style={styles.videoSection}>
            <View style={styles.videoHeader}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
              <Text style={styles.videoTitle}>{t('onboarding.addVideo') || 'Ajouter une video'}</Text>
              <Text style={styles.videoOptional}>{t('onboarding.optional') || 'Optionnel'}</Text>
            </View>

            {video ? (
              <View style={styles.videoPreviewContainer}>
                <Video
                  source={{ uri: video }}
                  style={styles.videoPreview}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  useNativeControls
                />
                <Pressable style={styles.removeVideoButton} onPress={removeVideo}>
                  <Ionicons name="close-circle" size={28} color={colors.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.videoPlaceholder} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.videoPlaceholderText}>
                  {t('onboarding.selectVideo') || 'Selectionner une video'}
                </Text>
              </Pressable>
            )}

            <View style={styles.videoBonus}>
              <Ionicons name="star" size={16} color={colors.secondary} />
              <Text style={styles.videoBonusText}>
                {t('onboarding.videoBonus') || 'Les profils avec video sont 3x plus vus et recoivent plus de matchs !'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !photo && styles.buttonDisabled]}
          onPress={() => router.push('/(onboarding)/face-verification' as never)}
          disabled={!photo}
        >
          <Text style={styles.buttonText}>{t('common.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  progressActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  photoContainer: {
    alignSelf: 'center',
    marginVertical: spacing.xl,
  },
  photoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photo: {
    width: 200,
    height: 200,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  optionButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.textLight,
  },
  // Video section
  videoSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  videoTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  videoOptional: {
    ...typography.caption,
    color: colors.textTertiary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  videoPlaceholder: {
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  videoPlaceholderText: {
    ...typography.body,
    color: colors.textSecondary,
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
});
