import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function TermsScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.replace('/profile/settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 1er février 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
        <Text style={styles.paragraph}>
          En accédant et en utilisant l'application SHY ("l'Application"), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'Application.
        </Text>

        <Text style={styles.sectionTitle}>2. Description du service</Text>
        <Text style={styles.paragraph}>
          SHY est une plateforme sociale de mise en relation entre adultes consentants âgés de 18 ans et plus. L'Application permet aux utilisateurs de créer un profil, de découvrir d'autres utilisateurs et d'échanger des messages.
        </Text>
        <Text style={styles.paragraph}>
          SHY ne propose ni ne facilite aucun service sexuel rémunéré. L'Application est destinée uniquement à des fins de rencontres sociales légitimes.
        </Text>

        <Text style={styles.sectionTitle}>3. Éligibilité</Text>
        <Text style={styles.paragraph}>
          Pour utiliser SHY, vous devez :
        </Text>
        <Text style={styles.bulletPoint}>• Avoir au moins 18 ans</Text>
        <Text style={styles.bulletPoint}>• Être légalement autorisé à utiliser ce service dans votre juridiction</Text>
        <Text style={styles.bulletPoint}>• Ne pas avoir été précédemment banni de l'Application</Text>
        <Text style={styles.bulletPoint}>• Ne pas être inscrit sur un registre de délinquants sexuels</Text>

        <Text style={styles.sectionTitle}>4. Compte utilisateur</Text>
        <Text style={styles.paragraph}>
          Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.
        </Text>

        <Text style={styles.sectionTitle}>5. Règles de conduite</Text>
        <Text style={styles.paragraph}>
          En utilisant SHY, vous acceptez de ne pas :
        </Text>
        <Text style={styles.bulletPoint}>• Publier du contenu illégal, offensant ou inapproprié</Text>
        <Text style={styles.bulletPoint}>• Harceler, menacer ou intimider d'autres utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Usurper l'identité d'une autre personne</Text>
        <Text style={styles.bulletPoint}>• Utiliser l'Application à des fins commerciales non autorisées</Text>
        <Text style={styles.bulletPoint}>• Solliciter des services sexuels rémunérés</Text>
        <Text style={styles.bulletPoint}>• Partager du contenu impliquant des mineurs</Text>
        <Text style={styles.bulletPoint}>• Collecter des informations sur d'autres utilisateurs sans leur consentement</Text>

        <Text style={styles.sectionTitle}>5bis. Système de messagerie et protection contre le harcèlement</Text>
        <Text style={styles.paragraph}>
          SHY utilise un système de messagerie asymétrique conçu pour protéger les utilisateurs contre le harcèlement non sollicité. Ce système permet à certains utilisateurs (notamment les femmes) d'initier des conversations directement, tandis que d'autres doivent d'abord envoyer une invitation qui doit être acceptée.
        </Text>
        <Text style={styles.paragraph}>
          Cette mesure vise à :
        </Text>
        <Text style={styles.bulletPoint}>• Réduire significativement le harcèlement et les messages non désirés</Text>
        <Text style={styles.bulletPoint}>• Permettre aux utilisateurs de choisir avec qui ils souhaitent communiquer</Text>
        <Text style={styles.bulletPoint}>• Créer un environnement plus sûr et respectueux pour tous</Text>
        <Text style={styles.paragraph}>
          Cette fonctionnalité est basée sur les retours de notre communauté et les meilleures pratiques de l'industrie en matière de sécurité sur les applications de rencontres. Tous les utilisateurs peuvent modifier leurs préférences de contact dans leurs paramètres.</Text>

        <Text style={styles.sectionTitle}>6. Contenu utilisateur</Text>
        <Text style={styles.paragraph}>
          Vous conservez tous les droits sur le contenu que vous publiez sur SHY. En publiant du contenu, vous nous accordez une licence mondiale, non exclusive et libre de redevances pour utiliser, afficher et distribuer ce contenu dans le cadre de l'Application.
        </Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de supprimer tout contenu qui viole ces conditions ou que nous jugeons inapproprié.
        </Text>

        <Text style={styles.sectionTitle}>7. Abonnements et achats</Text>
        <Text style={styles.paragraph}>
          Certaines fonctionnalités de SHY peuvent nécessiter un abonnement payant. Les paiements sont traités via l'App Store d'Apple. Les abonnements se renouvellent automatiquement sauf si vous les annulez au moins 24 heures avant la fin de la période en cours.
        </Text>

        <Text style={styles.sectionTitle}>8. Résiliation</Text>
        <Text style={styles.paragraph}>
          Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'Application. Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation de ces conditions.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation de responsabilité</Text>
        <Text style={styles.paragraph}>
          SHY est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas responsables des interactions entre utilisateurs ni des dommages résultant de l'utilisation de l'Application.
        </Text>

        <Text style={styles.sectionTitle}>10. Modifications</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication dans l'Application.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant ces conditions, contactez-nous à : support@shydating.eu
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
