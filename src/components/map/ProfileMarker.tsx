import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

// Couleurs selon l'intention
const INTENTION_COLORS: Record<string, string> = {
  dating: colors.primary,
  social: '#00D4FF',
  amical: '#00FF88',
  local: '#FF9500',
};

interface Profile {
  id: string;
  displayName: string;
  age: number;
  photos: string[];
  intention: string;
  latitude: number;
  longitude: number;
  distance?: number | null;
  isOnline?: boolean;
}

interface ProfileMarkerProps {
  profile: Profile;
  onPress: (profile: Profile) => void;
}

export function ProfileMarker({ profile, onPress }: ProfileMarkerProps) {
  const intentionColor = INTENTION_COLORS[profile.intention] || colors.primary;

  return (
    <Marker
      coordinate={{
        latitude: profile.latitude,
        longitude: profile.longitude,
      }}
      onPress={() => onPress(profile)}
      tracksViewChanges={false}
    >
      {/* Marqueur personnalisé */}
      <View style={styles.markerContainer}>
        <View style={[styles.markerBorder, { borderColor: intentionColor }]}>
          <Image
            source={{ uri: profile.photos[0] }}
            style={styles.markerImage}
          />
          {profile.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        {/* Petit triangle sous le marqueur */}
        <View style={[styles.markerArrow, { borderTopColor: intentionColor }]} />
      </View>

      {/* Callout quand on tape */}
      <Callout tooltip onPress={() => onPress(profile)}>
        <View style={styles.calloutContainer}>
          <Image
            source={{ uri: profile.photos[0] }}
            style={styles.calloutImage}
          />
          <View style={styles.calloutInfo}>
            <Text style={styles.calloutName}>
              {profile.displayName}, {profile.age}
            </Text>
            <View style={styles.calloutRow}>
              <View style={[styles.intentionDot, { backgroundColor: intentionColor }]} />
              <Text style={styles.calloutIntention}>
                {profile.intention === 'dating' ? 'Dating' :
                 profile.intention === 'social' ? 'Social' :
                 profile.intention === 'amical' ? 'Amical' : 'Local'}
              </Text>
            </View>
            {profile.distance !== null && profile.distance !== undefined && (
              <View style={styles.calloutRow}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={styles.calloutDistance}>{profile.distance} km</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  // Marqueur
  markerContainer: {
    alignItems: 'center',
  },
  markerBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    padding: 2,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00FF88',
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Callout
  calloutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 220,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  calloutInfo: {
    flex: 1,
  },
  calloutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  intentionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calloutIntention: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calloutDistance: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default ProfileMarker;
