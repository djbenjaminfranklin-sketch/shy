import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function DisclaimerScreen() {
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
        <Text style={styles.headerTitle}>Mentions légales</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 1er février 2026</Text>

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle" size={24} color={colors.primary} style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            SHY est une plateforme sociale de mise en relation entre adultes consentants. Elle ne propose ni ne facilite aucun service sexuel rémunéré.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Éditeur de l'application</Text>
        <Text style={styles.paragraph}>
          SHY Dating{'\n'}
          Application mobile de rencontres sociales{'\n'}
          Email : contact@shydating.eu
        </Text>

        <Text style={styles.sectionTitle}>2. Hébergement</Text>
        <Text style={styles.paragraph}>
          Les données sont hébergées par Supabase Inc. sur des serveurs sécurisés conformes aux standards européens de protection des données.
        </Text>

        <Text style={styles.sectionTitle}>3. Nature du service</Text>
        <Text style={styles.paragraph}>
          SHY est une application de rencontres destinée aux adultes de 18 ans et plus souhaitant faire des rencontres sociales, amicales ou amoureuses.
        </Text>
        <Text style={styles.paragraph}>
          L'Application propose :
        </Text>
        <Text style={styles.bulletPoint}>• La création d'un profil personnel</Text>
        <Text style={styles.bulletPoint}>• La découverte d'autres utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Un système de "match" mutuel</Text>
        <Text style={styles.bulletPoint}>• Une messagerie privée entre utilisateurs ayant "matché"</Text>

        <Text style={styles.sectionTitle}>4. Restriction d'âge</Text>
        <Text style={styles.paragraph}>
          L'utilisation de SHY est strictement réservée aux personnes majeures (18 ans et plus). Une vérification de l'âge est effectuée lors de l'inscription.
        </Text>

        <Text style={styles.sectionTitle}>5. Responsabilité</Text>
        <Text style={styles.paragraph}>
          SHY agit en tant qu'intermédiaire technique permettant la mise en relation entre utilisateurs. Nous ne sommes pas responsables :
        </Text>
        <Text style={styles.bulletPoint}>• Du contenu publié par les utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Des interactions entre utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Des rencontres ayant lieu en dehors de l'Application</Text>
        <Text style={styles.bulletPoint}>• De l'exactitude des informations fournies par les utilisateurs</Text>

        <Text style={styles.sectionTitle}>6. Modération</Text>
        <Text style={styles.paragraph}>
          Nous mettons en place des outils de modération pour assurer un environnement sûr :
        </Text>
        <Text style={styles.bulletPoint}>• Système de signalement des profils</Text>
        <Text style={styles.bulletPoint}>• Possibilité de bloquer des utilisateurs</Text>
        <Text style={styles.bulletPoint}>• Modération des contenus signalés</Text>
        <Text style={styles.bulletPoint}>• Suspension des comptes violant les règles</Text>

        <Text style={styles.sectionTitle}>7. Propriété intellectuelle</Text>
        <Text style={styles.paragraph}>
          L'ensemble des éléments de l'Application (logo, design, code, textes) sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </Text>

        <Text style={styles.sectionTitle}>8. Droit applicable</Text>
        <Text style={styles.paragraph}>
          Les présentes mentions légales sont soumises au droit européen. En cas de litige, les tribunaux compétents seront ceux du ressort du siège social de l'éditeur.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question ou réclamation :{'\n'}
          Email : contact@shydating.eu
        </Text>
        <Text style={styles.paragraph}>
          Pour les questions relatives à vos données personnelles :{'\n'}
          Email : privacy@shydating.eu
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
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight || '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disclaimerIcon: {
    marginRight: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 20,
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
