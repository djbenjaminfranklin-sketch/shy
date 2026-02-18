import { googlePlacesService } from '../services/google';

/**
 * Approxime les coordonnees pour la confidentialite
 * Reduit la precision a environ 500m-1km
 * Cela empeche la triangulation precise de la position
 */
export function approximateCoordinates(lat: number, lng: number): { latitude: number; longitude: number } {
  // Arrondir a 2 decimales (environ 1km de precision)
  // 0.01 degre = ~1.11km a l'equateur
  const precision = 100; // 2 decimales
  return {
    latitude: Math.round(lat * precision) / precision,
    longitude: Math.round(lng * precision) / precision,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calcule la distance entre deux points (formule de Haversine)
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeocodingState {
  city: string | null;
  neighborhood: string | null;
  formattedAddress: string | null;
}

/**
 * Geocode des coordonnees et retourne les infos de ville/quartier
 */
export async function geocodePosition(latitude: number, longitude: number): Promise<GeocodingState> {
  try {
    const { result } = await googlePlacesService.reverseGeocode(latitude, longitude);
    if (result) {
      return {
        city: result.city,
        neighborhood: result.neighborhood,
        formattedAddress: result.formattedAddress,
      };
    }
  } catch (geoError) {
    // Geocoding failed, GPS position only
  }
  return { city: null, neighborhood: null, formattedAddress: null };
}
