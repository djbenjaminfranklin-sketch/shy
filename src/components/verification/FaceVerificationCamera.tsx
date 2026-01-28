import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_SIZE = SCREEN_WIDTH - spacing.lg * 2;
const OVAL_WIDTH = CAMERA_SIZE * 0.65;
const OVAL_HEIGHT = CAMERA_SIZE * 0.85;

interface Step {
  id: string;
  label: string;
  instruction: string;
  icon: string; // Ionicons name
}

const STEPS: Step[] = [
  {
    id: 'front',
    label: 'Face',
    instruction: 'Regardez la caméra',
    icon: 'happy-outline',
  },
  {
    id: 'left',
    label: 'Gauche',
    instruction: 'Tournez légèrement vers la gauche',
    icon: 'arrow-back',
  },
  {
    id: 'right',
    label: 'Droite',
    instruction: 'Tournez légèrement vers la droite',
    icon: 'arrow-forward',
  },
];

interface Props {
  referencePhotoUri: string;
  onVerificationComplete: (verified: boolean, capturedUris: string[]) => void;
  onCancel: () => void;
}

export function FaceVerificationCamera({
  referencePhotoUri,
  onVerificationComplete,
  onCancel,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [status, setStatus] = useState<'ready' | 'countdown' | 'capturing' | 'success' | 'done'>('ready');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedPhotosRef = useRef<string[]>([]); // Ref pour éviter les problèmes de closure
  const isCapturingRef = useRef(false); // Éviter les captures multiples

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Reset refs on mount and cleanup on unmount
  useEffect(() => {
    capturedPhotosRef.current = [];
    isCapturingRef.current = false;

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
  }, []);

  // Animation de pulsation de l'ovale
  useEffect(() => {
    if (status === 'ready' || status === 'countdown') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim]);

  // Démarrer automatiquement le countdown après un délai
  useEffect(() => {
    if (status === 'ready' && permission?.granted && !isCapturingRef.current) {
      // Clear any existing timer
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }

      // Délai plus long pour la première capture, plus court pour les suivantes
      const delay = currentStepIndex === 0 ? 2000 : 1500;

      autoStartTimerRef.current = setTimeout(() => {
        if (status === 'ready' && !isCapturingRef.current) {
          startCountdown();
        }
      }, delay);

      return () => {
        if (autoStartTimerRef.current) {
          clearTimeout(autoStartTimerRef.current);
          autoStartTimerRef.current = null;
        }
      };
    }
  }, [status, currentStepIndex, permission?.granted, startCountdown]);

  const startCountdown = useCallback(() => {
    setStatus('countdown');
    setCountdown(3);

    // Clear any existing countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // Countdown 3 -> 2 -> 1 -> capture
    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  }, []);

  const capturePhoto = async () => {
    // Éviter les captures multiples simultanées
    if (!cameraRef.current || isCapturingRef.current) {
      console.log('Camera not ready or already capturing');
      return;
    }

    isCapturingRef.current = true;
    setStatus('capturing');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });

      if (photo?.uri) {
        // Utiliser la ref pour éviter les problèmes de closure
        capturedPhotosRef.current = [...capturedPhotosRef.current, photo.uri];
        const newPhotos = capturedPhotosRef.current;
        setCapturedPhotos(newPhotos);

        setStatus('success');

        // Attendre puis passer à l'étape suivante
        setTimeout(() => {
          isCapturingRef.current = false;

          if (currentStepIndex >= STEPS.length - 1) {
            // Toutes les photos capturées - finaliser
            setStatus('done');
            finalizeVerification(newPhotos);
          } else {
            // Passer à l'étape suivante
            setCurrentStepIndex(prev => prev + 1);
            setStatus('ready');
          }
        }, 1200);
      } else {
        console.warn('Photo capture returned no URI');
        isCapturingRef.current = false;
        setStatus('ready');
      }
    } catch (error) {
      console.error('Capture error:', error);
      isCapturingRef.current = false;
      setStatus('ready'); // Retry
    }
  };

  const finalizeVerification = async (photos: string[]) => {
    // Simulation - en production, comparer avec referencePhotoUri via API
    setTimeout(() => {
      onVerificationComplete(true, photos);
    }, 1500);
  };

  const getOvalColor = () => {
    switch (status) {
      case 'countdown': return colors.warning;
      case 'capturing': return colors.warning;
      case 'success': return colors.success;
      default: return colors.primary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready': return currentStep.instruction;
      case 'countdown': return currentStep.instruction;
      case 'capturing': return 'Capture...';
      case 'success': return 'Parfait !';
      case 'done': return 'Vérification en cours...';
      default: return '';
    }
  };

  // Permission screen
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera" size={64} color={colors.primary} />
          <Text style={styles.permissionTitle}>Caméra requise</Text>
          <Text style={styles.permissionText}>
            La caméra est nécessaire pour vérifier votre identité
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelTextButton} onPress={onCancel}>
            <Text style={styles.cancelTextButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={styles.closeButton} />
      </View>

      {/* Progress steps */}
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index < currentStepIndex && styles.stepCircleCompleted,
              index === currentStepIndex && styles.stepCircleActive,
            ]}>
              {index < currentStepIndex ? (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index === currentStepIndex && styles.stepNumberActive,
                ]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              index === currentStepIndex && styles.stepLabelActive,
            ]}>{step.label}</Text>
          </View>
        ))}
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          {/* Overlay avec ovale */}
          <View style={styles.overlay}>
            <View style={styles.overlayDark} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayDark} />
              <Animated.View style={[
                styles.ovalFrame,
                {
                  borderColor: getOvalColor(),
                  transform: [{ scale: pulseAnim }],
                },
              ]}>
                {/* Countdown au centre */}
                {countdown !== null && (
                  <Text style={styles.countdownText}>{countdown}</Text>
                )}
                {status === 'success' && (
                  <Ionicons name="checkmark-circle" size={60} color={colors.success} />
                )}
                {status === 'done' && (
                  <Ionicons name="hourglass" size={50} color={colors.primary} />
                )}
              </Animated.View>
              <View style={styles.overlayDark} />
            </View>
            <View style={styles.overlayDark} />
          </View>

          {/* Direction indicator */}
          {currentStep.id !== 'front' && status !== 'success' && status !== 'done' && (
            <View style={[
              styles.directionBadge,
              currentStep.id === 'left' ? styles.directionLeft : styles.directionRight,
            ]}>
              <Ionicons
                name={currentStep.icon as keyof typeof Ionicons.glyphMap}
                size={32}
                color={colors.white}
              />
            </View>
          )}
        </CameraView>
      </View>

      {/* Status */}
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {status === 'ready' && (
          <Text style={styles.statusHint}>La capture démarre automatiquement</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
        <Text style={styles.infoText}>
          Vos photos sont sécurisées et utilisées uniquement pour la vérification
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Camera
  cameraWrapper: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    alignSelf: 'center',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: OVAL_HEIGHT,
  },
  ovalFrame: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  directionBadge: {
    position: 'absolute',
    top: '45%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionLeft: {
    left: spacing.md,
  },
  directionRight: {
    right: spacing.md,
  },

  // Status
  statusBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  statusHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: 'auto',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Permission
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  cancelTextButton: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  cancelTextButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default FaceVerificationCamera;
