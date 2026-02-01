import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ProfileMarker } from './ProfileMarker';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ProfileWithLocation {
  id: string;
  displayName: string;
  age: number;
  photos: string[];
  intention: string;
  latitude: number | null;
  longitude: number | null;
  distance?: number | null;
  isOnline?: boolean;
  lastActiveAt?: string | null;
}

interface ValidProfile {
  id: string;
  displayName: string;
  age: number;
  photos: string[];
  intention: string;
  latitude: number;
  longitude: number;
  distance?: number | null;
  isOnline?: boolean;
  lastActiveAt?: string | null;
}

interface ProfileMapViewProps {
  profiles: ProfileWithLocation[];
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  searchRadius: number;
  onProfilePress: (profile: ValidProfile) => void;
  isLoading?: boolean;
}

export function ProfileMapView({
  profiles,
  userLocation,
  searchRadius,
  onProfilePress,
  isLoading = false,
}: ProfileMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // Position initiale (Paris par défaut si pas de localisation)
  const defaultLocation = {
    latitude: 48.8566,
    longitude: 2.3522,
  };

  const center = userLocation || defaultLocation;

  // Calculer le delta basé sur le rayon de recherche
  const getLatitudeDelta = (radiusKm: number) => {
    // 1 degré de latitude ≈ 111 km
    return (radiusKm / 111) * 2.5;
  };

  const initialRegion: Region = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: getLatitudeDelta(searchRadius),
    longitudeDelta: getLatitudeDelta(searchRadius),
  };

  useEffect(() => {
    if (!region) {
      setRegion(initialRegion);
    }
  }, [userLocation]);

  // Recentrer sur la position utilisateur
  const handleRecenter = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: getLatitudeDelta(searchRadius),
        longitudeDelta: getLatitudeDelta(searchRadius),
      }, 500);
    }
  };

  // Filtrer les profils valides avec coordonnées
  const validProfiles = profiles.filter(
    (p): p is ValidProfile => p.latitude !== null && p.longitude !== null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        mapType="standard"
      >
        {/* Marqueur de la position de l'utilisateur */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Marqueurs des profils */}
        {validProfiles.map((profile) => (
          <ProfileMarker
            key={profile.id}
            profile={profile}
            onPress={onProfilePress}
          />
        ))}
      </MapView>

      {/* Bouton recentrer */}
      {userLocation && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Dating</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00D4FF' }]} />
          <Text style={styles.legendText}>Social</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00FF88' }]} />
          <Text style={styles.legendText}>Amical</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>Local</Text>
        </View>
      </View>

      {/* Compteur de profils */}
      <View style={styles.profileCount}>
        <Ionicons name="people" size={16} color={colors.text} />
        <Text style={styles.profileCountText}>
          {validProfiles.length} {validProfiles.length === 1 ? 'profil' : 'profils'} autour de toi
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Bouton recentrer
  recenterButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: 140,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // Légende
  legend: {
    position: 'absolute',
    left: spacing.md,
    bottom: 140,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Compteur
  profileCount: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  // Marqueur utilisateur (point bleu)
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default ProfileMapView;
