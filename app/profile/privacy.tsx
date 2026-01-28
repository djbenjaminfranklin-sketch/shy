import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useLocation } from '../../src/contexts/LocationContext';
import { Button } from '../../src/components/ui/Button';

export default function PrivacyScreen() {
  const router = useRouter();
  const { isEnabled: locationEnabled, disableLocation } = useLocation();

  const handleDataRequest = () => {
    // TODO: Implement data export
    Linking.openURL('mailto:privacy@shy.app?subject=Demande de données personnelles');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos droits (RGPD)</Text>
          <Text style={styles.description}>
            Conformément au Règlement Général sur la Protection des Données, vous disposez
            des droits suivants sur vos données personnelles :
          </Text>

          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <Text style={styles.rightIcon}>📋</Text>
              <View style={styles.rightInfo}>
                <Text style={styles.rightTitle}>Droit d'accès</Text>
                <Text style={styles.rightDescription}>
                  Demander une copie de vos données personnelles
                </Text>
              </View>
            </View>

            <View style={styles.rightItem}>
              <Text style={styles.rightIcon}>✏️</Text>
              <View style={styles.rightInfo}>
                <Text style={styles.rightTitle}>Droit de rectification</Text>
                <Text style={styles.rightDescription}>
                  Modifier vos informations depuis votre profil
                </Text>
              </View>
            </View>

            <View style={styles.rightItem}>
              <Text style={styles.rightIcon}>🗑️</Text>
              <View style={styles.rightInfo}>
                <Text style={styles.rightTitle}>Droit à l'effacement</Text>
                <Text style={styles.rightDescription}>
                  Supprimer définitivement votre compte et données
                </Text>
              </View>
            </View>

            <View style={styles.rightItem}>
              <Text style={styles.rightIcon}>📦</Text>
              <View style={styles.rightInfo}>
                <Text style={styles.rightTitle}>Droit à la portabilité</Text>
                <Text style={styles.rightDescription}>
                  Recevoir vos données dans un format lisible
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Demander mes données"
            onPress={handleDataRequest}
            variant="outline"
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Géolocalisation</Text>
          <Text style={styles.description}>
            Statut actuel : {locationEnabled ? 'Activée' : 'Désactivée'}
          </Text>
          {locationEnabled && (
            <Button
              title="Masquer ma position"
              onPress={disableLocation}
              variant="outline"
              style={styles.button}
            />
          )}
          <Text style={styles.hint}>
            Même activée, seule une distance approximative est partagée.
            Votre adresse exacte n'est jamais visible.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supprimer mon compte</Text>
          <Text style={styles.description}>
            La suppression de votre compte entraîne l'effacement définitif et
            irréversible de toutes vos données personnelles dans un délai de 30 jours.
          </Text>
          <Button
            title="Supprimer mon compte"
            onPress={() => router.push('/profile/delete-account' as any)}
            variant="danger"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  rightsList: {
    marginBottom: spacing.md,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  rightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  rightInfo: {
    flex: 1,
  },
  rightTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  rightDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  button: {
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
