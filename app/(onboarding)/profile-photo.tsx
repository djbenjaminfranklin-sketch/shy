import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressActive]} />
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

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, !photo && styles.buttonDisabled]}
            onPress={() => router.push('/(onboarding)/face-verification' as never)}
            disabled={!photo}
          >
            <Text style={styles.buttonText}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginTop: 'auto',
    marginBottom: spacing.lg,
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
});
