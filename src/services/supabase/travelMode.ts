import { supabase } from './client';
import type { TravelMode, TravelModeFormData, TravelLocation } from '../../types/travelMode';

export const travelModeService = {
  /**
   * Récupérer le mode voyage actif d'un utilisateur
   */
  async getActiveTravelMode(
    userId: string
  ): Promise<{ travelMode: TravelMode | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('travel_modes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('[travelModeService.getActiveTravelMode] Error:', error);
        return { travelMode: null, error: error.message };
      }

      if (!data) {
        return { travelMode: null, error: null };
      }

      const travelMode: TravelMode = {
        id: data.id,
        userId: data.user_id,
        destination: {
          city: data.city,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
        },
        arrivalDate: data.arrival_date,
        departureDate: data.departure_date,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { travelMode, error: null };
    } catch (err) {
      console.error('[travelModeService.getActiveTravelMode] Unexpected error:', err);
      return { travelMode: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Activer un mode voyage
   */
  async activateTravelMode(
    userId: string,
    formData: TravelModeFormData
  ): Promise<{ travelMode: TravelMode | null; error: string | null }> {
    try {
      const { error } = await supabase.rpc('activate_travel_mode', {
        p_user_id: userId,
        p_city: formData.city,
        p_country: formData.country,
        p_latitude: formData.latitude,
        p_longitude: formData.longitude,
        p_arrival_date: formData.arrivalDate.toISOString().split('T')[0],
        p_departure_date: formData.departureDate
          ? formData.departureDate.toISOString().split('T')[0]
          : null,
      });

      if (error) {
        console.error('[travelModeService.activateTravelMode] Error:', error);
        return { travelMode: null, error: error.message };
      }

      // Récupérer le mode voyage créé
      return this.getActiveTravelMode(userId);
    } catch (err) {
      console.error('[travelModeService.activateTravelMode] Unexpected error:', err);
      return { travelMode: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Désactiver le mode voyage
   */
  async deactivateTravelMode(
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.rpc('deactivate_travel_mode', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[travelModeService.deactivateTravelMode] Error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[travelModeService.deactivateTravelMode] Unexpected error:', err);
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les profils en mode voyage dans une zone
   */
  async getTravelersInArea(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<{ travelers: TravelMode[]; error: string | null }> {
    try {
      // Calcul approximatif du bounding box
      const latDelta = radiusKm / 111; // 1 degré ≈ 111 km
      const lonDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

      const { data, error } = await supabase
        .from('travel_modes')
        .select('*')
        .eq('is_active', true)
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lonDelta)
        .lte('longitude', longitude + lonDelta);

      if (error) {
        console.error('[travelModeService.getTravelersInArea] Error:', error);
        return { travelers: [], error: error.message };
      }

      const travelers: TravelMode[] = (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        destination: {
          city: d.city,
          country: d.country,
          latitude: d.latitude,
          longitude: d.longitude,
        },
        arrivalDate: d.arrival_date,
        departureDate: d.departure_date,
        isActive: d.is_active,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      return { travelers, error: null };
    } catch (err) {
      console.error('[travelModeService.getTravelersInArea] Unexpected error:', err);
      return { travelers: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Rechercher une ville (pour l'autocomplétion)
   */
  async searchCities(query: string): Promise<TravelLocation[]> {
    // Pour l'instant, filtrer les villes populaires
    // Plus tard, on pourrait utiliser une API de géocodage
    const { POPULAR_CITIES } = await import('../../types/travelMode');

    const normalizedQuery = query.toLowerCase().trim();
    return POPULAR_CITIES.filter(
      (city) =>
        city.city.toLowerCase().includes(normalizedQuery) ||
        city.country.toLowerCase().includes(normalizedQuery)
    );
  },
};

export default travelModeService;
