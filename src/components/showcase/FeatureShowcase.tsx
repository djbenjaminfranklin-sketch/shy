import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeatureSlide {
  id: string;
  emoji: string;
  titleKey: keyof typeof import('../../i18n/translations/en').en.featureShowcase;
  descKey: keyof typeof import('../../i18n/translations/en').en.featureShowcase;
  color: string;
  glowColor: string;
}

const SLIDES: FeatureSlide[] = [
  {
    id: 'intentions',
    emoji: '🎯',
    titleKey: 'intentionsTitle',
    descKey: 'intentionsDesc',
    color: colors.intentionDating,
    glowColor: colors.shadowPink,
  },
  {
    id: 'availability',
    emoji: '⚡',
    titleKey: 'availabilityTitle',
    descKey: 'availabilityDesc',
    color: colors.available,
    glowColor: colors.shadowGreen,
  },
  {
    id: 'icebreaker',
    emoji: '🧊',
    titleKey: 'icebreakerTitle',
    descKey: 'icebreakerDesc',
    color: colors.icebreaker,
    glowColor: colors.shadowBlue,
  },
  {
    id: 'map',
    emoji: '🗺️',
    titleKey: 'mapTitle',
    descKey: 'mapDesc',
    color: colors.intentionLocal,
    glowColor: colors.shadowOrange,
  },
  {
    id: 'comfort',
    emoji: '💜',
    titleKey: 'comfortTitle',
    descKey: 'comfortDesc',
    color: colors.accent,
    glowColor: colors.shadowPurple,
  },
];

interface FeatureShowcaseProps {
  onComplete: () => void;
}

export function FeatureShowcase({ onComplete }: FeatureShowcaseProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item }: { item: FeatureSlide }) => (
    <View style={styles.slide}>
      <View style={[styles.emojiContainer, { shadowColor: item.glowColor }]}>
        <LinearGradient
          colors={[item.color + '30', item.color + '10']}
          style={styles.emojiGradient}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
        </LinearGradient>
      </View>

      <Text style={styles.slideTitle}>
        {(t as Function)(`featureShowcase.${item.titleKey}`)}
      </Text>
      <Text style={styles.slideDescription}>
        {(t as Function)(`featureShowcase.${item.descKey}`)}
      </Text>

      <View style={[styles.featureHighlight, { borderColor: item.color + '40' }]}>
        <View style={[styles.featureTag, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.featureTagText, { color: item.color }]}>
            {(t as Function)(`featureShowcase.${item.id}Tag`)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SHY</Text>
          <Text style={styles.headerSubtitle}>
            {(t as Function)('featureShowcase.headerSubtitle')}
          </Text>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Footer */}
        <View style={styles.footer}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  index === currentIndex && {
                    ...styles.dotActive,
                    backgroundColor: SLIDES[currentIndex].color,
                  },
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <LinearGradient
            colors={[SLIDES[currentIndex].color, SLIDES[currentIndex].color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentIndex === SLIDES.length - 1
                  ? (t as Function)('featureShowcase.getStarted')
                  : (t as Function)('common.next')}
              </Text>
            </Pressable>
          </LinearGradient>

          {currentIndex < SLIDES.length - 1 && (
            <Pressable style={styles.skipButton} onPress={onComplete}>
              <Text style={styles.skipButtonText}>
                {(t as Function)('common.skip')}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emojiContainer: {
    marginBottom: spacing.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
  emojiGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  slideTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  featureHighlight: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  featureTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  featureTagText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  nextButtonGradient: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  nextButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
