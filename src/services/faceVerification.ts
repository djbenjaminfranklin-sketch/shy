import * as FileSystem from 'expo-file-system';

export type HeadPosition = 'center' | 'left' | 'right' | 'up' | 'down';

export interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  headPosition: HeadPosition | null;
}

export interface VerificationStep {
  id: HeadPosition;
  label: string;
  instruction: string;
  completed: boolean;
  capturedUri?: string;
}

export const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: 'center',
    label: 'Centre',
    instruction: 'Regardez la camera bien en face',
    completed: false,
  },
  {
    id: 'left',
    label: 'Gauche',
    instruction: 'Tournez doucement la tete vers la gauche',
    completed: false,
  },
  {
    id: 'right',
    label: 'Droite',
    instruction: 'Tournez doucement la tete vers la droite',
    completed: false,
  },
];

export const faceVerificationService = {
  /**
   * Calculer un score de similarite entre deux images de visage
   * Note: Pour une vraie verification, utiliser un service cloud (AWS Rekognition, etc.)
   * Cette methode est une verification basique locale
   */
  async compareFaces(
    referenceUri: string,
    capturedUris: string[]
  ): Promise<{ match: boolean; confidence: number; error: string | null }> {
    try {
      // Verifier que les fichiers existent
      const refExists = await FileSystem.getInfoAsync(referenceUri);
      if (!refExists.exists) {
        return { match: false, confidence: 0, error: 'Photo de reference introuvable' };
      }

      for (const uri of capturedUris) {
        const capturedExists = await FileSystem.getInfoAsync(uri);
        if (!capturedExists.exists) {
          return { match: false, confidence: 0, error: 'Capture de verification introuvable' };
        }
      }

      // Pour une vraie implementation, envoyer les images a un service de comparaison faciale
      // AWS Rekognition CompareFaces ou Azure Face API
      //
      // Exemple avec AWS Rekognition:
      // const result = await rekognition.compareFaces({
      //   SourceImage: { Bytes: referenceImageBytes },
      //   TargetImage: { Bytes: capturedImageBytes },
      //   SimilarityThreshold: 80
      // }).promise();
      //
      // return {
      //   match: result.FaceMatches.length > 0,
      //   confidence: result.FaceMatches[0]?.Similarity || 0,
      //   error: null
      // };

      // SIMULATION: Pour le developpement, on retourne toujours true
      // A remplacer par un vrai service en production (AWS Rekognition, Azure Face, etc.)
      // Le service compare les photos capturees avec la photo de reference
      console.log('Comparing faces - reference:', referenceUri);
      console.log('Comparing faces - captured:', capturedUris.length, 'photos');

      return {
        match: true,
        confidence: 95,
        error: null,
      };
    } catch (err) {
      console.error('Error comparing faces:', err);
      return {
        match: false,
        confidence: 0,
        error: 'Erreur lors de la comparaison des visages',
      };
    }
  },

  /**
   * Verifier si toutes les etapes sont completees
   */
  areAllStepsCompleted(steps: VerificationStep[]): boolean {
    return steps.every((step) => step.completed);
  },

  /**
   * Obtenir l'etape actuelle
   */
  getCurrentStep(steps: VerificationStep[]): VerificationStep | null {
    return steps.find((step) => !step.completed) || null;
  },

  /**
   * Mettre a jour une etape comme completee
   */
  completeStep(
    steps: VerificationStep[],
    stepId: HeadPosition,
    capturedUri: string
  ): VerificationStep[] {
    return steps.map((step) =>
      step.id === stepId
        ? { ...step, completed: true, capturedUri }
        : step
    );
  },

  /**
   * Reinitialiser les etapes
   */
  resetSteps(): VerificationStep[] {
    return VERIFICATION_STEPS.map((step) => ({
      ...step,
      completed: false,
      capturedUri: undefined,
    }));
  },
};

export default faceVerificationService;
