import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 1er février 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Chez SHY, nous prenons la protection de vos données personnelles très au sérieux. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations conformément au Règlement Général sur la Protection des Données (RGPD).
        </Text>

        <Text style={styles.sectionTitle}>2. Responsable du traitement</Text>
        <Text style={styles.paragraph}>
          SHY Dating{'\n'}
          Email : privacy@shydating.eu
        </Text>

        <Text style={styles.sectionTitle}>3. Données collectées</Text>
        <Text style={styles.paragraph}>
          Nous collectons les données suivantes :
        </Text>
        <Text style={styles.bulletPoint}>• Informations de profil : nom, date de naissance, genre, photos</Text>
        <Text style={styles.bulletPoint}>• Données de contact : adresse email</Text>
        <Text style={styles.bulletPoint}>• Préférences : intentions de rencontre, centres d'intérêt</Text>
        <Text style={styles.bulletPoint}>• Données de localisation : uniquement si vous l'autorisez explicitement</Text>
        <Text style={styles.bulletPoint}>• Communications : messages échangés avec d'autres utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Données techniques : type d'appareil, système d'exploitation</Text>

        <Text style={styles.sectionTitle}>4. Finalités du traitement</Text>
        <Text style={styles.paragraph}>
          Vos données sont utilisées pour :
        </Text>
        <Text style={styles.bulletPoint}>• Fournir et améliorer nos services de mise en relation</Text>
        <Text style={styles.bulletPoint}>• Personnaliser votre expérience utilisateur</Text>
        <Text style={styles.bulletPoint}>• Assurer la sécurité de l'Application</Text>
        <Text style={styles.bulletPoint}>• Communiquer avec vous concernant votre compte</Text>
        <Text style={styles.bulletPoint}>• Respecter nos obligations légales</Text>

        <Text style={styles.sectionTitle}>5. Base légale</Text>
        <Text style={styles.paragraph}>
          Le traitement de vos données est fondé sur :
        </Text>
        <Text style={styles.bulletPoint}>• Votre consentement explicite</Text>
        <Text style={styles.bulletPoint}>• L'exécution du contrat de service</Text>
        <Text style={styles.bulletPoint}>• Nos intérêts légitimes (sécurité, amélioration du service)</Text>
        <Text style={styles.bulletPoint}>• Nos obligations légales</Text>

        <Text style={styles.sectionTitle}>6. Partage des données</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :
        </Text>
        <Text style={styles.bulletPoint}>• D'autres utilisateurs : selon vos paramètres de visibilité</Text>
        <Text style={styles.bulletPoint}>• Prestataires de services : hébergement, paiement (sous contrat de confidentialité)</Text>
        <Text style={styles.bulletPoint}>• Autorités : si requis par la loi</Text>

        <Text style={styles.sectionTitle}>7. Conservation des données</Text>
        <Text style={styles.paragraph}>
          Vos données sont conservées tant que votre compte est actif. Après suppression de votre compte, vos données sont effacées sous 30 jours, sauf obligation légale de conservation.
        </Text>

        <Text style={styles.sectionTitle}>8. Vos droits (RGPD)</Text>
        <Text style={styles.paragraph}>
          Conformément au RGPD, vous disposez des droits suivants :
        </Text>
        <Text style={styles.bulletPoint}>• Droit d'accès : obtenir une copie de vos données</Text>
        <Text style={styles.bulletPoint}>• Droit de rectification : corriger vos données</Text>
        <Text style={styles.bulletPoint}>• Droit à l'effacement : supprimer vos données</Text>
        <Text style={styles.bulletPoint}>• Droit à la portabilité : recevoir vos données dans un format structuré</Text>
        <Text style={styles.bulletPoint}>• Droit d'opposition : vous opposer à certains traitements</Text>
        <Text style={styles.bulletPoint}>• Droit de retrait du consentement : à tout moment</Text>

        <Text style={styles.sectionTitle}>9. Sécurité</Text>
        <Text style={styles.paragraph}>
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données : chiffrement, contrôle d'accès, audits réguliers.
        </Text>

        <Text style={styles.sectionTitle}>10. Géolocalisation</Text>
        <Text style={styles.paragraph}>
          La géolocalisation est désactivée par défaut. Si vous l'activez, seule une distance approximative est affichée aux autres utilisateurs, jamais votre position exacte. Vous pouvez désactiver cette fonctionnalité à tout moment.
        </Text>

        <Text style={styles.sectionTitle}>11. Cookies et traceurs</Text>
        <Text style={styles.paragraph}>
          L'Application utilise des technologies de suivi minimales, uniquement nécessaires au fonctionnement du service. Aucun cookie publicitaire n'est utilisé.
        </Text>

        <Text style={styles.sectionTitle}>12. Modifications</Text>
        <Text style={styles.paragraph}>
          Cette politique peut être mise à jour. Nous vous informerons de tout changement significatif via l'Application.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact</Text>
        <Text style={styles.paragraph}>
          Pour exercer vos droits ou pour toute question :{'\n'}
          Email : privacy@shydating.eu
        </Text>
        <Text style={styles.paragraph}>
          Vous pouvez également contacter l'autorité de contrôle compétente (CNIL en France) si vous estimez que vos droits ne sont pas respectés.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  lastUpdate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginLeft: 12,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
