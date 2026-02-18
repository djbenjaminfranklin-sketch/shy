import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface PhotoGridProps {
  photos: string[];
  videoUri: string | null;
  videoLoading: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onPickVideo: () => void;
  onRemoveVideo: () => void;
  onVideoLoadStart: () => void;
  onVideoLoad: () => void;
  onVideoError: () => void;
}

export function PhotoGrid({
  photos,
  videoUri,
  videoLoading,
  onAddPhoto,
  onRemovePhoto,
  onPickVideo,
  onRemoveVideo,
  onVideoLoadStart,
  onVideoLoad,
  onVideoError,
}: PhotoGridProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos & Video</Text>
      <View style={styles.photosGrid}>
        {/* Photos existantes */}
        {photos.map((photo, index) => (
          <View key={`photo-${index}`} style={styles.photoItem}>
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              resizeMode="cover"
              onLoad={() => {}}
              onError={() => {}}
            />
            <Pressable
              style={styles.removeButton}
              onPress={() => onRemovePhoto(index)}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </Pressable>
          </View>
        ))}

        {/* Video (si presente) - affichee dans la grille */}
        {videoUri && (
          <View key="video" style={styles.photoItem}>
            {videoUri.startsWith('http') ? (
              // Video deja uploadee - miniature avec icone play
              <View style={styles.videoThumbnail}>
                <Ionicons name="play-circle" size={40} color={colors.textLight} />
                <View style={styles.videoBadgeOverlay}>
                  <Ionicons name="videocam" size={14} color={colors.textLight} />
                </View>
              </View>
            ) : (
              // Video locale - preview
              <View style={styles.videoThumbnailLocal}>
                {videoLoading && (
                  <View style={styles.videoLoadingSmall}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
                <Video
                  source={{ uri: videoUri }}
                  style={[styles.photo, videoLoading && { opacity: 0.3 }]}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  onLoadStart={onVideoLoadStart}
                  onLoad={onVideoLoad}
                  onError={onVideoError}
                />
                <View style={styles.videoBadgeOverlay}>
                  <Ionicons name="videocam" size={14} color={colors.textLight} />
                </View>
              </View>
            )}
            <Pressable style={styles.removeButton} onPress={onRemoveVideo}>
              <Text style={styles.removeIcon}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Bouton ajouter photo */}
        {photos.length < (videoUri ? 5 : 6) && (
          <Pressable style={styles.addPhotoButton} onPress={onAddPhoto}>
            <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
          </Pressable>
        )}

        {/* Bouton ajouter video (si pas de video) */}
        {!videoUri && photos.length < 6 && (
          <Pressable style={styles.addPhotoButton} onPress={onPickVideo}>
            <Ionicons name="videocam-outline" size={28} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Bonus video - affiche seulement si pas de video */}
      {!videoUri && (
        <View style={styles.videoBonus}>
          <Ionicons name="star" size={16} color={colors.secondary} />
          <Text style={styles.videoBonusText}>
            Les profils avec video sont 3x plus vus !
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbnailLocal: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoBadgeOverlay: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  videoLoadingSmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    zIndex: 10,
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
