import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { storageService } from '../services/supabase/storage';
import { profilesService } from '../services/supabase/profiles';
import { useAuth } from './AuthContext';
import type { GenderId } from '../constants/genders';
import type { IntentionId } from '../constants/intentions';
import type { DrinkingId, SmokingId, ChildrenId, ProfilePromptAnswer } from '../constants/lifestyle';

interface OnboardingData {
  // Photo
  photoUri: string | null;

  // Video (optional)
  videoUri: string | null;

  // Face verification (for women)
  isVerified: boolean;
  verificationPhotos: string[];

  // Basic info
  displayName: string;
  birthDate: Date | null;
  gender: string;

  // Intention
  intention: string;

  // Interests
  interests: string[];

  // Lifestyle
  height: number | null;
  drinking: DrinkingId | null;
  smoking: SmokingId | null;
  children: ChildrenId | null;
  prompts: ProfilePromptAnswer[];

  // Gender preferences (who you're looking for)
  genderFilter: GenderId[];

  // Location
  locationEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
  completeOnboarding: () => Promise<{ success: boolean; error: string | null }>;
  isSubmitting: boolean;
}

const initialData: OnboardingData = {
  photoUri: null,
  videoUri: null,
  isVerified: false,
  verificationPhotos: [],
  displayName: '',
  birthDate: null,
  gender: '',
  intention: '',
  interests: [],
  height: null,
  drinking: null,
  smoking: null,
  children: null,
  prompts: [],
  genderFilter: [],
  locationEnabled: false,
  latitude: null,
  longitude: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
  }, []);

  const completeOnboarding = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    setIsSubmitting(true);

    try {
      // 1. Upload la photo de profil si présente
      let photoUrl: string | null = null;
      if (data.photoUri) {
        const { url, error: uploadError } = await storageService.uploadProfilePhoto(
          user.id,
          data.photoUri,
          0
        );
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          photoUrl = url;
        }
      }

      // 2. Upload la vidéo de profil si présente
      let videoUrl: string | null = null;
      if (data.videoUri) {
        const { url, error: uploadError } = await storageService.uploadProfileVideo(
          user.id,
          data.videoUri
        );
        if (uploadError) {
          console.error('Error uploading video:', uploadError);
        } else {
          videoUrl = url;
        }
      }

      // 3. Créer le profil
      const { error: profileError } = await profilesService.createProfile(user.id, {
        displayName: data.displayName,
        birthDate: data.birthDate?.toISOString().split('T')[0] || '',
        gender: data.gender as GenderId,
        intention: data.intention as IntentionId,
        interests: data.interests,
        photos: photoUrl ? [photoUrl] : [],
        videoUrl: videoUrl,
        height: data.height,
        drinking: data.drinking,
        smoking: data.smoking,
        children: data.children,
        prompts: data.prompts,
        genderFilter: data.genderFilter,
        locationEnabled: data.locationEnabled,
        latitude: data.latitude,
        longitude: data.longitude,
        isVerified: data.isVerified,
      });

      if (profileError) {
        return { success: false, error: profileError };
      }

      // 4. Reset les données
      resetData();

      return { success: true, error: null };
    } catch (err) {
      console.error('Error completing onboarding:', err);
      return { success: false, error: 'Une erreur est survenue' };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, data, resetData]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        resetData,
        completeOnboarding,
        isSubmitting,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
