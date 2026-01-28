import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useTranslations } from '../../src/contexts/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INTRO_DURATION = 3000; // 3 seconds

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const [showIntro, setShowIntro] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const hasTransitioned = useRef(false);

  // Auto-transition after 3 seconds
  useEffect(() => {
    if (!showIntro || videoError) return;

    const timer = setTimeout(() => {
      if (!hasTransitioned.current) {
        transitionToMain();
      }
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, [showIntro, videoError]);

  const transitionToMain = () => {
    if (hasTransitioned.current) return;
    hasTransitioned.current = true;

    if (videoRef.current) {
      videoRef.current.stopAsync();
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowIntro(false);
    });
  };

  const handleVideoEnd = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      transitionToMain();
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowIntro(false);
    fadeAnim.setValue(1);
  };

  const skipIntro = () => {
    transitionToMain();
  };

  // Video intro screen
  if (showIntro && !videoError) {
    return (
      <View style={styles.introContainer}>
        <Video
          ref={videoRef}
          source={require('../../assets/videos/logo-intro.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={handleVideoEnd}
          onError={handleVideoError}
        />

        {/* Skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={skipIntro}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  // Main welcome screen
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, '#0A0A0A', colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SHY</Text>
              <Text style={styles.logoX}>✕</Text>
            </View>
            <Text style={styles.tagline}>
              {t('welcome.tagline')}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.like + '20' }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.like} />
              </View>
              <Text style={styles.featureText}>{t('welcome.features.verified')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.superLike + '20' }]}>
                <Ionicons name="location" size={24} color={colors.superLike} />
              </View>
              <Text style={styles.featureText}>{t('welcome.features.nearby')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="heart" size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{t('welcome.features.connections')}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>{t('welcome.createAccount')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>{t('welcome.login')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.disclaimer}>
              {t('welcome.footerText')}
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                <Text style={styles.link}>{t('welcome.terms')}</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>•</Text>
              <TouchableOpacity onPress={() => router.push('/legal/privacy-policy')}>
                <Text style={styles.link}>{t('welcome.privacy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Intro video
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },

  // Main screen
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },

  // Header / Logo
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
  logoX: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 4,
  },
  tagline: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Features
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Buttons
  buttons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    fontSize: 13,
    color: colors.primary,
  },
  separator: {
    fontSize: 13,
    color: colors.textTertiary,
    marginHorizontal: spacing.sm,
  },
});
