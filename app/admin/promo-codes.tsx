import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { promoCodesService, PromoCode } from '../../src/services/supabase/promoCodes';

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50] as const;

export default function PromoCodesScreen() {
  const router = useRouter();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [newCode, setNewCode] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState<10 | 20 | 30 | 40 | 50>(20);
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [_hasExpiration, setHasExpiration] = useState(false);

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    const { codes: loadedCodes, error } = await promoCodesService.getAllCodes();
    if (error) {
      Alert.alert('Erreur', error);
    } else {
      setCodes(loadedCodes);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleGenerateCode = () => {
    setNewCode(promoCodesService.generateCode());
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code');
      return;
    }

    setIsCreating(true);
    const { code, error } = await promoCodesService.createCode(
      newCode.trim(),
      selectedDiscount,
      {
        description: description.trim() || undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      }
    );

    if (error) {
      Alert.alert('Erreur', error);
    } else if (code) {
      setCodes((prev) => [code, ...prev]);
      setShowCreateModal(false);
      resetForm();
      Alert.alert('Succès', `Code ${code.code} créé avec ${code.discountPercent}% de réduction`);
    }
    setIsCreating(false);
  };

  const resetForm = () => {
    setNewCode('');
    setSelectedDiscount(20);
    setDescription('');
    setMaxUses('');
    setHasExpiration(false);
  };

  const handleToggleCode = async (codeId: string, currentStatus: boolean) => {
    const { error } = await promoCodesService.toggleCode(codeId, !currentStatus);
    if (error) {
      Alert.alert('Erreur', error);
    } else {
      setCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, isActive: !currentStatus } : c))
      );
    }
  };

  const handleDeleteCode = (code: PromoCode) => {
    Alert.alert(
      'Supprimer le code',
      `Voulez-vous vraiment supprimer le code ${code.code} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await promoCodesService.deleteCode(code.id);
            if (error) {
              Alert.alert('Erreur', error);
            } else {
              setCodes((prev) => prev.filter((c) => c.id !== code.id));
            }
          },
        },
      ]
    );
  };

  const renderCodeItem = ({ item }: { item: PromoCode }) => (
    <View style={[styles.codeCard, !item.isActive && styles.codeCardInactive]}>
      <View style={styles.codeHeader}>
        <View style={styles.codeInfo}>
          <Text style={styles.codeText}>{item.code}</Text>
          <View style={[styles.discountBadge, { backgroundColor: getDiscountColor(item.discountPercent) }]}>
            <Text style={styles.discountText}>-{item.discountPercent}%</Text>
          </View>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleCode(item.id, item.isActive)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={item.isActive ? colors.primary : colors.textTertiary}
        />
      </View>

      {item.description && (
        <Text style={styles.codeDescription}>{item.description}</Text>
      )}

      <View style={styles.codeStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>
            {item.currentUses}{item.maxUses ? `/${item.maxUses}` : ''} utilisations
          </Text>
        </View>

        {item.validUntil && (
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              Expire le {new Date(item.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.codeActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteCode(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Codes Promo</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Liste des codes */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : codes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun code promo</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>Créer un code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={codes}
          keyExtractor={(item) => item.id}
          renderItem={renderCodeItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Code</Text>
            <TouchableOpacity onPress={handleCreateCode} disabled={isCreating}>
              <Text style={[styles.modalSave, isCreating && styles.modalSaveDisabled]}>
                {isCreating ? '...' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Code */}
            <Text style={styles.label}>Code</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={newCode}
                onChangeText={(text) => setNewCode(text.toUpperCase())}
                placeholder="Ex: SHY2024"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.generateButton} onPress={handleGenerateCode}>
                <Ionicons name="shuffle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Réduction */}
            <Text style={styles.label}>Réduction</Text>
            <View style={styles.discountOptions}>
              {DISCOUNT_OPTIONS.map((discount) => (
                <TouchableOpacity
                  key={discount}
                  style={[
                    styles.discountOption,
                    selectedDiscount === discount && styles.discountOptionSelected,
                    { backgroundColor: selectedDiscount === discount ? getDiscountColor(discount) : colors.surface },
                  ]}
                  onPress={() => setSelectedDiscount(discount)}
                >
                  <Text
                    style={[
                      styles.discountOptionText,
                      selectedDiscount === discount && styles.discountOptionTextSelected,
                    ]}
                  >
                    {discount}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Offre de lancement"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Limite d'utilisation */}
            <Text style={styles.label}>Nombre max d'utilisations (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={maxUses}
              onChangeText={setMaxUses}
              placeholder="Laisser vide pour illimité"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Le code sera appliqué sur les abonnements SHY+ et Premium.
                Les utilisateurs pourront l'entrer avant de payer.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getDiscountColor(discount: number): string {
  switch (discount) {
    case 10:
      return '#4CAF50';
    case 20:
      return '#8BC34A';
    case 30:
      return '#FFC107';
    case 40:
      return '#FF9800';
    case 50:
      return '#F44336';
    default:
      return colors.primary;
  }
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
  },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  codeCardInactive: {
    opacity: 0.6,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  discountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  codeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  codeStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    padding: spacing.sm,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSave: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text,
  },
  generateButton: {
    backgroundColor: colors.surface,
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  discountOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  discountOptionSelected: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  discountOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  discountOptionTextSelected: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
