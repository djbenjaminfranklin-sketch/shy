import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';

interface UseLocationPermissionsReturn {
  permissionStatus: Location.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook pour gerer les permissions de localisation
 */
export function useLocationPermissions(): UseLocationPermissionsReturn {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  // Verifier les permissions au demarrage
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    };

    checkPermission();
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }, []);

  return {
    permissionStatus,
    requestPermission,
  };
}

export default useLocationPermissions;
