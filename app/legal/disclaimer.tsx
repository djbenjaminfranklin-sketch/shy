import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { LEGAL_DISCLAIMER } from '../../src/constants';

export default function DisclaimerScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mentions Légales</Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{LEGAL_DISCLAIMER}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Éditeur de l'application</Text>
          <Text style={styles.paragraph}>
            SHY{'\n'}
            Application mobile de mise en relation sociale{'\n'}
            Contact : contact@shy.app
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hébergement</Text>
          <Text style={styles.paragraph}>
            Les données sont hébergées sur des serveurs sécurisés conformes aux
            normes européennes de protection des données.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L'ensemble des éléments constituant l'application SHY (textes,
            graphismes, logiciels, etc.) est protégé par les lois relatives à la
            propriété intellectuelle.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description App Store</Text>
          <View style={styles.appStoreBox}>
            <Text style={styles.appStoreText}>
              Application sociale de mise en relation entre adultes consentants.
              Discutez, échangez et découvrez des personnes à proximité dans un
              cadre respectueux et sécurisé. Aucune transaction financière entre
              utilisateurs. Aucun service sexuel rémunéré.
            </Text>
          </View>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  disclaimerBox: {
    backgroundColor: colors.primary + '15',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    ...typography.body,
    color: colors.text,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  appStoreBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  appStoreText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
