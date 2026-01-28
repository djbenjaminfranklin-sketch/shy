import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Conditions Générales d'Utilisation</Text>
        <Text style={styles.lastUpdate}>Dernière mise à jour : Janvier 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Présentation du service</Text>
          <Text style={styles.paragraph}>
            SHY est une application mobile de rencontres permettant à des utilisateurs
            majeurs de se découvrir et d'entrer en contact. L'application est éditée
            par SHY SAS, société par actions simplifiée.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            L'utilisation de l'application implique l'acceptation pleine et entière
            des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez
            pas utiliser l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Conditions d'accès</Text>
          <Text style={styles.paragraph}>
            Pour utiliser SHY, vous devez :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Être âgé(e) d'au moins 18 ans</Text>
            <Text style={styles.listItem}>• Créer un compte avec des informations exactes</Text>
            <Text style={styles.listItem}>• Utiliser une photo récente et authentique de vous</Text>
            <Text style={styles.listItem}>• Résider en France ou dans un pays de l'UE</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Inscription et compte</Text>
          <Text style={styles.paragraph}>
            Lors de votre inscription, vous vous engagez à fournir des informations
            exactes et à jour. Vous êtes responsable de la confidentialité de vos
            identifiants de connexion. Tout usage frauduleux de votre compte doit
            nous être signalé immédiatement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Utilisation du service</Text>
          <Text style={styles.paragraph}>
            Vous vous engagez à utiliser SHY de manière respectueuse et conforme
            à la loi. Il est strictement interdit de :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Harceler, menacer ou intimider d'autres utilisateurs</Text>
            <Text style={styles.listItem}>• Publier du contenu illégal, offensant ou inapproprié</Text>
            <Text style={styles.listItem}>• Usurper l'identité d'une autre personne</Text>
            <Text style={styles.listItem}>• Utiliser l'application à des fins commerciales non autorisées</Text>
            <Text style={styles.listItem}>• Contourner les mesures de sécurité de l'application</Text>
            <Text style={styles.listItem}>• Créer plusieurs comptes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Contenu utilisateur</Text>
          <Text style={styles.paragraph}>
            Vous conservez la propriété de vos contenus (photos, textes). En les
            publiant sur SHY, vous nous accordez une licence non exclusive pour les
            afficher dans le cadre du service. Vous garantissez détenir les droits
            sur tout contenu que vous publiez.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Modération</Text>
          <Text style={styles.paragraph}>
            SHY se réserve le droit de modérer, suspendre ou supprimer tout compte
            ou contenu qui contreviendrait aux présentes CGU, sans préavis ni
            compensation. Les décisions de modération sont prises à notre seule
            discrétion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Responsabilité</Text>
          <Text style={styles.paragraph}>
            SHY fournit une plateforme de mise en relation. Nous ne sommes pas
            responsables des interactions entre utilisateurs ni des rencontres qui
            pourraient en découler. Vous utilisez l'application à vos propres risques.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Abonnements et paiements</Text>
          <Text style={styles.paragraph}>
            Certaines fonctionnalités peuvent nécessiter un abonnement payant.
            Les prix sont indiqués dans l'application. Les abonnements sont
            renouvelés automatiquement sauf résiliation. Vous pouvez gérer vos
            abonnements dans les paramètres de votre store (App Store / Google Play).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Résiliation</Text>
          <Text style={styles.paragraph}>
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres
            de l'application. La suppression entraîne l'effacement de vos données
            personnelles conformément à notre Politique de Confidentialité.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Modifications des CGU</Text>
          <Text style={styles.paragraph}>
            Nous pouvons modifier ces CGU à tout moment. Les modifications
            importantes vous seront notifiées. La poursuite de l'utilisation après
            notification vaut acceptation des nouvelles conditions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Droit applicable</Text>
          <Text style={styles.paragraph}>
            Les présentes CGU sont soumises au droit français. Tout litige relatif
            à l'utilisation de SHY sera soumis aux tribunaux compétents de Paris.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces CGU, contactez-nous à : contact@shydating.eu
          </Text>
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
    marginBottom: spacing.xs,
  },
  lastUpdate: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xl,
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
  list: {
    marginVertical: spacing.sm,
    paddingLeft: spacing.md,
  },
  listItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
