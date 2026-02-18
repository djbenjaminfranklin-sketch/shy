import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { IntentionBadge } from '../profile/IntentionBadge';
import { AvailabilityBadge } from '../profile/AvailabilityBadge';
import type { ProfileWithDistance } from '../../types/profile';

interface ProfileInfoOverlayProps {
  profile: ProfileWithDistance;
}

export const ProfileInfoOverlay: React.FC<ProfileInfoOverlayProps> = ({ profile }) => (
  <View style={styles.profileInfo} pointerEvents="none">
    {/* Badge en ligne - basé sur lastActiveAt */}
    {profile.lastActiveAt && (
      (() => {
        const lastActive = new Date(profile.lastActiveAt);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
        const isOnline = diffMinutes < 5;

        if (isOnline) {
          return (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Actif.ve</Text>
            </View>
          );
        } else if (diffMinutes < 60) {
          return (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Il y a {diffMinutes} min</Text>
            </View>
          );
        } else if (diffMinutes < 1440) {
          return (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Il y a {Math.floor(diffMinutes / 60)}h</Text>
            </View>
          );
        }
        return null;
      })()
    )}

    {/* Nom et age */}
    <View style={styles.nameRow}>
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.age}>{profile.age}</Text>
    </View>

    {/* Distance */}
    {profile.distance !== null && (
      <View style={styles.distanceRow}>
        <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
        <Text style={styles.distance}>a {profile.distance} km</Text>
      </View>
    )}

    {/* Bio */}
    {profile.bio && (
      <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
    )}

    {/* Badges intention et disponibilité */}
    <View style={styles.badgesRow}>
      <IntentionBadge intention={profile.intention} size="medium" />
      {profile.availability && (
        <AvailabilityBadge availability={profile.availability} size="medium" />
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  profileInfo: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
  },
  onlineText: {
    color: colors.online,
    fontSize: 13,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  offlineText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  age: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.white,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  bio: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    lineHeight: 22,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
});
