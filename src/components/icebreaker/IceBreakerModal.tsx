import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { ICEBREAKER_PRODUCTS } from '../../constants/subscriptions';
import { Button } from '../ui/Button';
import { useIceBreaker } from '../../contexts/IceBreakerContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { IceBreakerResult, IceBreakerCandidate } from '../../types/icebreaker';
import { IceBreakerProfileCard } from './IceBreakerProfileCard';

interface IceBreakerModalProps {
  visible: boolean;
  onClose: () => void;
}

type ModalStep = 'intro' | 'loading' | 'preview' | 'sending' | 'results';

export function IceBreakerModal({ visible, onClose }: IceBreakerModalProps) {
  const { t } = useLanguage();
  const {
    iceBreakersAvailable,
    purchaseIceBreakers,
    getCandidates,
    sendToSingle,
  } = useIceBreaker();

  const [step, setStep] = useState<ModalStep>('intro');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [candidates, setCandidates] = useState<IceBreakerCandidate[]>([]);
  const [replacementPool, setReplacementPool] = useState<IceBreakerCandidate[]>([]);
  const [results, setResults] = useState<IceBreakerResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingCandidateId, setSendingCandidateId] = useState<string | null>(null);
  const [sentCandidateIds, setSentCandidateIds] = useState<Set<string>>(new Set());

  const handleStartIceBreaker = async () => {
    setStep('loading');
    setError(null);

    const { candidates: fetchedCandidates, replacementPool: pool, error: fetchError } = await getCandidates();

    if (fetchError || fetchedCandidates.length === 0) {
      setError(fetchError || t('icebreaker.noProfilesFound'));
      setStep('intro');
      return;
    }

    // Mark all as approved by default
    setCandidates(fetchedCandidates.map(c => ({ ...c, approved: true })));
    setReplacementPool(pool);
    setStep('preview');
  };

  const handleSendToCandidate = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    setSendingCandidateId(candidateId);
    setError(null);

    const { success, error: sendError } = await sendToSingle(candidate);

    setSendingCandidateId(null);

    if (success) {
      // Fermer le modal après envoi réussi
      handleClose();
    } else {
      setError(sendError || 'Erreur lors de l\'envoi');
    }
  };

  const handleReplaceCandidate = (candidateId: string) => {
    if (replacementPool.length === 0) {
      // No more replacements available
      return;
    }

    // Get a replacement from the pool
    const replacement = { ...replacementPool[0], approved: true };
    const newPool = replacementPool.slice(1);

    // Replace the candidate
    setCandidates(prev =>
      prev.map(c =>
        c.id === candidateId ? replacement : c
      )
    );
    setReplacementPool(newPool);
  };

  const handleMessageChange = (candidateId: string, newMessage: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === candidateId ? { ...c, message: newMessage } : c
      )
    );
  };

  const handlePurchase = async (productId: string) => {
    setIsPurchasing(true);
    setSelectedProductId(productId);
    try {
      await purchaseIceBreakers(productId);
    } finally {
      setIsPurchasing(false);
      setSelectedProductId(null);
    }
  };

  const handleClose = () => {
    setStep('intro');
    setCandidates([]);
    setReplacementPool([]);
    setResults(null);
    setError(null);
    setSendingCandidateId(null);
    setSentCandidateIds(new Set());
    onClose();
  };

  const sentCount = sentCandidateIds.size;

  // Results screen
  if (step === 'results' && results) {
    const resultsSentCount = results.filter(r => r.sent).length;

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, styles.successIcon]}>
                  <Ionicons name="snow" size={40} color={colors.white} />
                </View>
                <Text style={styles.title}>{t('icebreaker.sent')}</Text>
                <Text style={styles.description}>
                  {t('icebreaker.sentDescription', { count: resultsSentCount })}
                </Text>
              </View>

              <View style={styles.resultsContainer}>
                {results.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <Ionicons
                        name={result.sent ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={result.sent ? colors.success : colors.error}
                      />
                      <Text style={styles.resultName}>{result.profileName}</Text>
                    </View>
                    <Text style={styles.resultMessage} numberOfLines={2}>
                      "{result.message}"
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={t('common.close')}
                onPress={handleClose}
                size="large"
                style={styles.closeButtonLarge}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Preview screen - show candidates for approval
  if (step === 'preview' || step === 'sending') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="snow-outline" size={40} color={colors.icebreaker} />
                </View>
                <Text style={styles.title}>{t('icebreaker.previewTitle')}</Text>
                <Text style={styles.description}>
                  {t('icebreaker.previewDescription')}
                </Text>
              </View>

              {/* Candidates list */}
              <View style={styles.candidatesContainer}>
                {candidates.map((candidate) => (
                  <IceBreakerProfileCard
                    key={candidate.id}
                    candidate={candidate}
                    onSend={() => handleSendToCandidate(candidate.id)}
                    onReplace={() => handleReplaceCandidate(candidate.id)}
                    onMessageChange={(msg) => handleMessageChange(candidate.id, msg)}
                    isSending={sendingCandidateId === candidate.id}
                    isSent={sentCandidateIds.has(candidate.id)}
                  />
                ))}
              </View>

              {/* Replacement info */}
              {replacementPool.length > 0 && (
                <View style={styles.replacementInfo}>
                  <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                  <Text style={styles.replacementInfoText}>
                    {t('icebreaker.replacementsAvailable', { count: replacementPool.length })}
                  </Text>
                </View>
              )}

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Done button */}
              {sentCount > 0 && (
                <Button
                  title={t('common.done')}
                  onPress={handleClose}
                  size="large"
                  style={styles.sendButton}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Loading screen
  if (step === 'loading') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.icebreaker} />
              <Text style={styles.loadingText}>{t('icebreaker.findingProfiles')}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Intro screen (default)
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="snow-outline" size={40} color={colors.icebreaker} />
              </View>
              <Text style={styles.title}>{t('icebreaker.title')}</Text>
              <Text style={styles.description}>{t('icebreaker.description')}</Text>
            </View>

            {/* How it works */}
            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>{t('icebreaker.howItWorks')}</Text>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>{t('icebreaker.step1')}</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>{t('icebreaker.step2')}</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>{t('icebreaker.step3')}</Text>
              </View>
            </View>

            {/* Available Ice Breakers */}
            {iceBreakersAvailable > 0 && (
              <View style={styles.availableSection}>
                <View style={styles.availableHeader}>
                  <Text style={styles.availableCount}>{iceBreakersAvailable}</Text>
                  <Text style={styles.availableLabel}>
                    {t('icebreaker.available', { count: iceBreakersAvailable })}
                  </Text>
                </View>

                <Button
                  title={t('icebreaker.use')}
                  onPress={handleStartIceBreaker}
                  variant="secondary"
                  size="large"
                  style={styles.activateButton}
                />
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Purchase section */}
            <View style={styles.purchaseSection}>
              {iceBreakersAvailable > 0 && (
                <Text style={styles.orText}>{t('icebreaker.orBuyMore')}</Text>
              )}
              {iceBreakersAvailable === 0 && (
                <Text style={styles.noIceBreakersText}>{t('icebreaker.noIceBreakers')}</Text>
              )}

              <View style={styles.productsGrid}>
                {ICEBREAKER_PRODUCTS.map((product) => (
                  <Pressable
                    key={product.id}
                    style={[
                      styles.productCard,
                      product.popular && styles.productCardPopular,
                      product.bestValue && styles.productCardBestValue,
                    ]}
                    onPress={() => handlePurchase(product.productId)}
                    disabled={isPurchasing}
                  >
                    {product.popular && (
                      <View style={styles.productBadge}>
                        <Text style={styles.productBadgeText}>{t('icebreaker.popular')}</Text>
                      </View>
                    )}
                    {product.bestValue && (
                      <View style={[styles.productBadge, styles.productBadgeBest]}>
                        <Text style={styles.productBadgeText}>{t('icebreaker.bestValue')}</Text>
                      </View>
                    )}

                    <View style={styles.productContent}>
                      <View style={styles.productQuantity}>
                        <Ionicons name="snow" size={24} color={colors.icebreaker} />
                        <Text style={styles.productQuantityText}>{product.quantity}</Text>
                      </View>

                      <Text style={styles.productLabel}>
                        {product.quantity === 1
                          ? t('icebreaker.single')
                          : t('icebreaker.pack', { count: product.quantity })}
                      </Text>

                      {isPurchasing && selectedProductId === product.productId ? (
                        <ActivityIndicator size="small" color={colors.icebreaker} />
                      ) : (
                        <Text style={styles.productPrice}>{product.priceLabel}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.disclaimerText}>{t('icebreaker.disclaimer')}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.icebreaker + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successIcon: {
    backgroundColor: colors.icebreaker,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  howItWorks: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  howItWorksTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.icebreaker,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  stepText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  availableSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  availableCount: {
    ...typography.h1,
    color: colors.icebreaker,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  availableLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  activateButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.icebreaker,
  },
  purchaseSection: {
    marginBottom: spacing.lg,
  },
  orText: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  noIceBreakersText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  productCardPopular: {
    borderColor: colors.icebreaker,
  },
  productCardBestValue: {
    borderColor: colors.premium,
  },
  productBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.icebreaker,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderBottomLeftRadius: borderRadius.sm,
  },
  productBadgeBest: {
    backgroundColor: colors.premium,
  },
  productBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 9,
  },
  productContent: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  productQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  productQuantityText: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  productLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  productPrice: {
    ...typography.bodyMedium,
    color: colors.icebreaker,
    fontWeight: '700',
  },
  resultsContainer: {
    marginBottom: spacing.lg,
  },
  resultItem: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  resultMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  closeButtonLarge: {
    marginBottom: spacing.lg,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  // Preview styles
  candidatesContainer: {
    marginBottom: spacing.md,
  },
  replacementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  replacementInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: colors.icebreaker,
    marginBottom: spacing.lg,
  },
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  // Error styles
  errorBox: {
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
});

export default IceBreakerModal;
