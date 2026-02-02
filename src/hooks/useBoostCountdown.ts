import { useState, useEffect, useCallback, useRef } from 'react';

interface UseBoostCountdownResult {
  remainingSeconds: number;
  formattedTime: string;
  isExpired: boolean;
}

/**
 * Hook that manages a countdown timer for active boosts
 * @param expiresAt - ISO date string when the boost expires, or null if no boost active
 * @param onExpire - Callback when the boost expires
 */
export function useBoostCountdown(
  expiresAt: string | null,
  onExpire?: () => void
): UseBoostCountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const onExpireRef = useRef(onExpire);

  // Keep the callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
    return diff;
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    // Initial calculation
    const initial = calculateRemaining();
    setRemainingSeconds(initial);

    if (initial <= 0) {
      onExpireRef.current?.();
      return;
    }

    // Set up interval
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculateRemaining]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isExpired: remainingSeconds <= 0,
  };
}

export default useBoostCountdown;
