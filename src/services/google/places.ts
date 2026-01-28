/**
 * Service Google Places API
 * Pour la recherche de lieux et le géocodage
 */

// La clé API est chargée depuis les variables d'environnement
// Configurez EXPO_PUBLIC_GOOGLE_PLACES_API_KEY dans votre fichier .env
export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const GEOCODE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
}

export interface GeocodingResult {
  address: string;
  city: string;
  country: string;
  postalCode: string;
  neighborhood: string;
  formattedAddress: string;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_PLACES_API_KEY;
  }

  /**
   * Vérifie si l'API est configurée
   */
  isConfigured(): boolean {
    return this.apiKey !== 'YOUR_GOOGLE_PLACES_API_KEY' && this.apiKey.length > 0;
  }

  /**
   * Recherche de lieux avec autocomplétion
   */
  async searchPlaces(
    query: string,
    options?: {
      latitude?: number;
      longitude?: number;
      radius?: number;
      types?: string;
      language?: string;
    }
  ): Promise<{ predictions: PlacePrediction[]; error: string | null }> {
    if (!this.isConfigured()) {
      console.warn('Google Places API key not configured');
      return { predictions: [], error: 'API non configurée' };
    }

    try {
      const params = new URLSearchParams({
        input: query,
        key: this.apiKey,
        language: options?.language || 'fr',
      });

      if (options?.latitude && options?.longitude) {
        params.append('location', `${options.latitude},${options.longitude}`);
        params.append('radius', String(options.radius || 50000));
      }

      if (options?.types) {
        params.append('types', options.types);
      }

      const response = await fetch(
        `${PLACES_BASE_URL}/autocomplete/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places error:', data.status);
        return { predictions: [], error: data.error_message || data.status };
      }

      const predictions: PlacePrediction[] = (data.predictions || []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));

      return { predictions, error: null };
    } catch (error) {
      console.error('Error searching places:', error);
      return { predictions: [], error: 'Erreur de recherche' };
    }
  }

  /**
   * Obtenir les détails d'un lieu par son Place ID
   */
  async getPlaceDetails(placeId: string): Promise<{ place: PlaceResult | null; error: string | null }> {
    if (!this.isConfigured()) {
      return { place: null, error: 'API non configurée' };
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types',
        language: 'fr',
      });

      const response = await fetch(
        `${PLACES_BASE_URL}/details/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        return { place: null, error: data.error_message || data.status };
      }

      const result = data.result;
      const place: PlaceResult = {
        placeId: result.place_id,
        name: result.name,
        address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        types: result.types || [],
      };

      return { place, error: null };
    } catch (error) {
      console.error('Error getting place details:', error);
      return { place: null, error: 'Erreur lors de la récupération des détails' };
    }
  }

  /**
   * Géocodage inverse : coordonnées → adresse
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ result: GeocodingResult | null; error: string | null }> {
    if (!this.isConfigured()) {
      // Fallback sans API : retourner des données basiques
      return {
        result: {
          address: '',
          city: 'Position actuelle',
          country: '',
          postalCode: '',
          neighborhood: '',
          formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        },
        error: null,
      };
    }

    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: this.apiKey,
        language: 'fr',
        result_type: 'street_address|locality|neighborhood',
      });

      const response = await fetch(
        `${GEOCODE_BASE_URL}/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return { result: null, error: data.error_message || data.status };
      }

      if (!data.results || data.results.length === 0) {
        return {
          result: {
            address: '',
            city: 'Position inconnue',
            country: '',
            postalCode: '',
            neighborhood: '',
            formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          },
          error: null,
        };
      }

      const result = data.results[0];
      const components = result.address_components || [];

      const getComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.long_name || '';
      };

      const geocodingResult: GeocodingResult = {
        address: getComponent('route'),
        city: getComponent('locality') || getComponent('administrative_area_level_2'),
        country: getComponent('country'),
        postalCode: getComponent('postal_code'),
        neighborhood: getComponent('neighborhood') || getComponent('sublocality'),
        formattedAddress: result.formatted_address,
      };

      return { result: geocodingResult, error: null };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { result: null, error: 'Erreur de géocodage' };
    }
  }

  /**
   * Géocodage : adresse → coordonnées
   */
  async geocode(address: string): Promise<{
    latitude: number | null;
    longitude: number | null;
    error: string | null
  }> {
    if (!this.isConfigured()) {
      return { latitude: null, longitude: null, error: 'API non configurée' };
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        language: 'fr',
      });

      const response = await fetch(
        `${GEOCODE_BASE_URL}/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        return { latitude: null, longitude: null, error: data.error_message || data.status };
      }

      const location = data.results[0]?.geometry?.location;
      if (!location) {
        return { latitude: null, longitude: null, error: 'Adresse non trouvée' };
      }

      return {
        latitude: location.lat,
        longitude: location.lng,
        error: null,
      };
    } catch (error) {
      console.error('Error geocoding:', error);
      return { latitude: null, longitude: null, error: 'Erreur de géocodage' };
    }
  }

  /**
   * Rechercher des lieux à proximité
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    options?: {
      radius?: number;
      type?: string;
      keyword?: string;
    }
  ): Promise<{ places: PlaceResult[]; error: string | null }> {
    if (!this.isConfigured()) {
      return { places: [], error: 'API non configurée' };
    }

    try {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: String(options?.radius || 1000),
        key: this.apiKey,
        language: 'fr',
      });

      if (options?.type) {
        params.append('type', options.type);
      }

      if (options?.keyword) {
        params.append('keyword', options.keyword);
      }

      const response = await fetch(
        `${PLACES_BASE_URL}/nearbysearch/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return { places: [], error: data.error_message || data.status };
      }

      const places: PlaceResult[] = (data.results || []).map((p: any) => ({
        placeId: p.place_id,
        name: p.name,
        address: p.vicinity || p.formatted_address || '',
        latitude: p.geometry.location.lat,
        longitude: p.geometry.location.lng,
        types: p.types || [],
      }));

      return { places, error: null };
    } catch (error) {
      console.error('Error searching nearby:', error);
      return { places: [], error: 'Erreur de recherche' };
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
export default googlePlacesService;
