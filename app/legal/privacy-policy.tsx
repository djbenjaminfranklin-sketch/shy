import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function PrivacyPolicyScreen() {
  const openGDPR = () => {
    Linking.openURL('https://eur-lex.europa.eu/eli/reg/2016/679/oj');
  };

  const openCNIL = () => {
    Linking.openURL('https://www.cnil.fr/fr/reglement-europeen-protection-donnees');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Politique de Confidentialité</Text>
        <Text style={styles.lastUpdate}>Dernière mise à jour : Janvier 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Responsable du traitement</Text>
          <Text style={styles.paragraph}>
            Le responsable du traitement de vos données personnelles est SHY SAS,
            dont le siège social est situé en France. Pour toute question relative
            à vos données : contact@shydating.eu
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Données collectées</Text>
          <Text style={styles.paragraph}>
            Nous collectons les données suivantes :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Données d'inscription :</Text> email, mot de passe (chiffré),
              date de naissance, genre
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Données de profil :</Text> prénom, photos, description,
              centres d'intérêt, intention de rencontre
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Données de géolocalisation :</Text> position approximative
              (uniquement si vous l'activez volontairement)
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Données d'utilisation :</Text> interactions, messages,
              préférences de recherche
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Données techniques :</Text> type d'appareil, version de
              l'application, logs de connexion
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Finalités du traitement</Text>
          <Text style={styles.paragraph}>
            Vos données sont utilisées pour :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Créer et gérer votre compte</Text>
            <Text style={styles.listItem}>• Vous proposer des profils correspondant à vos critères</Text>
            <Text style={styles.listItem}>• Permettre les échanges entre utilisateurs</Text>
            <Text style={styles.listItem}>• Assurer la sécurité et la modération de la plateforme</Text>
            <Text style={styles.listItem}>• Améliorer nos services et votre expérience</Text>
            <Text style={styles.listItem}>• Respecter nos obligations légales</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Base légale</Text>
          <Text style={styles.paragraph}>
            Le traitement de vos données repose sur :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Votre consentement (Art. 6.1.a RGPD) pour les données de profil et
              la géolocalisation
            </Text>
            <Text style={styles.listItem}>
              • L'exécution du contrat (Art. 6.1.b RGPD) pour la fourniture du service
            </Text>
            <Text style={styles.listItem}>
              • Notre intérêt légitime (Art. 6.1.f RGPD) pour la sécurité et la prévention
              des fraudes
            </Text>
          </View>
          <Pressable onPress={openGDPR}>
            <Text style={styles.link}>Consulter le RGPD officiel →</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Partage des données</Text>
          <Text style={styles.paragraph}>
            Vos données peuvent être partagées avec :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Nos prestataires techniques (hébergement, envoi d'emails)
            </Text>
            <Text style={styles.listItem}>
              • Les autorités compétentes sur demande légale
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Nous ne vendons jamais vos données personnelles à des tiers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Durée de conservation</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Données de compte : conservées tant que votre compte est actif
            </Text>
            <Text style={styles.listItem}>
              • Après suppression du compte : effacement sous 30 jours
            </Text>
            <Text style={styles.listItem}>
              • Données de modération : conservées 1 an pour la sécurité
            </Text>
            <Text style={styles.listItem}>
              • Données de facturation : conservées 10 ans (obligation légale)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Vos droits</Text>
          <Text style={styles.paragraph}>
            Conformément au RGPD, vous disposez des droits suivants :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit d'accès :</Text> obtenir une copie de vos données
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit de rectification :</Text> corriger vos données inexactes
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit à l'effacement :</Text> supprimer vos données
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit à la portabilité :</Text> récupérer vos données dans
              un format lisible
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit d'opposition :</Text> vous opposer à certains traitements
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>Droit de retrait :</Text> retirer votre consentement à tout moment
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Pour exercer vos droits : contact@shydating.eu ou depuis les paramètres de
            l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Sécurité</Text>
          <Text style={styles.paragraph}>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données : chiffrement des données sensibles,
            accès restreint, audits de sécurité réguliers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Transferts internationaux</Text>
          <Text style={styles.paragraph}>
            Vos données sont hébergées au sein de l'Union Européenne. En cas de
            transfert hors UE, nous nous assurons que des garanties appropriées
            sont en place (clauses contractuelles types).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Cookies et traceurs</Text>
          <Text style={styles.paragraph}>
            L'application utilise des identifiants techniques nécessaires à son
            fonctionnement. Nous n'utilisons pas de cookies publicitaires tiers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Mineurs</Text>
          <Text style={styles.paragraph}>
            L'application est strictement réservée aux personnes de 18 ans et plus.
            Nous ne collectons pas sciemment de données concernant les mineurs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Modifications</Text>
          <Text style={styles.paragraph}>
            Cette politique peut être mise à jour. Les modifications significatives
            vous seront notifiées par l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Réclamations</Text>
          <Text style={styles.paragraph}>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez
            introduire une réclamation auprès de la CNIL (Commission Nationale de
            l'Informatique et des Libertés).
          </Text>
          <Pressable onPress={openCNIL}>
            <Text style={styles.link}>Site de la CNIL →</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question relative à cette politique ou à vos données
            personnelles :{'\n\n'}
            Email : contact@shydating.eu{'\n'}
            Délégué à la protection des données : contact@shydating.eu
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
  },
  listItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
