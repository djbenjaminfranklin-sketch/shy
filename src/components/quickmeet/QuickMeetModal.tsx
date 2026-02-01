import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useQuickMeet } from '../../hooks/useQuickMeet';
import { colors } from '../../theme/colors';
import { Button } from '../ui/Button';
import type { MeetDuration, TimeSlot, SuggestedPlace, PlaceType } from '../../types/quickMeet';

interface QuickMeetModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
}

export function QuickMeetModal({
  visible,
  onClose,
  conversationId,
  otherUserId,
  otherUserName,
}: QuickMeetModalProps) {
  const { t } = useLanguage();
  const {
    activeProposal,
    canPropose: _canPropose,
    isProposer,
    isRecipient,
    availableDurations,
    availableTimeSlots,
    availablePlaceTypes,
    createProposal,
    acceptProposal,
    declineProposal,
    cancelProposal,
    getDurationLabel,
    getPlaceTypeDisplay,
    isLoading: _isLoading,
  } = useQuickMeet(conversationId, otherUserId);

  // État pour la création
  const [selectedDuration, setSelectedDuration] = useState<MeetDuration>(15);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedPlaceType, setSelectedPlaceType] = useState<PlaceType>('cafe');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // État pour la réponse
  const [responseSlotId, setResponseSlotId] = useState<string | null>(null);
  const [responsePlaceId, setResponsePlaceId] = useState<string | null>(null);

  // Créer les lieux suggérés basés sur le type sélectionné
  const suggestedPlaces: SuggestedPlace[] = useMemo(() => {
    const display = getPlaceTypeDisplay(selectedPlaceType);
    return [
      {
        id: `place-${selectedPlaceType}-1`,
        name: `${display.label} du coin`,
        type: selectedPlaceType,
        address: 'À définir ensemble',
        isPublic: true,
      },
    ];
  }, [selectedPlaceType, getPlaceTypeDisplay]);

  // Toggle la sélection d'un créneau
  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : prev.length < 3
        ? [...prev, slotId]
        : prev
    );
  };

  // Envoyer la proposition
  const handleSendProposal = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert(t('common.error'), t('quickMeet.selectSlotError'));
      return;
    }

    setIsSending(true);

    const slots: TimeSlot[] = availableTimeSlots.filter((slot) =>
      selectedSlots.includes(slot.id)
    );

    const success = await createProposal(
      selectedDuration,
      slots,
      suggestedPlaces,
      message || undefined
    );

    setIsSending(false);

    if (success) {
      Alert.alert(t('quickMeet.proposalSentTitle'), t('quickMeet.proposalSentMessage'));
      onClose();
    }
  };

  // Accepter la proposition
  const handleAccept = async () => {
    if (!responseSlotId || !responsePlaceId) {
      Alert.alert(t('common.error'), t('quickMeet.selectResponseError'));
      return;
    }

    setIsSending(true);
    const success = await acceptProposal(responseSlotId, responsePlaceId);
    setIsSending(false);

    if (success) {
      Alert.alert(t('quickMeet.acceptedTitle'), t('quickMeet.acceptedMessage', { name: otherUserName }));
      onClose();
    }
  };

  // Décliner la proposition
  const handleDecline = () => {
    Alert.alert(
      t('quickMeet.declineTitle'),
      t('quickMeet.declineMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('quickMeet.declineNotReady'),
          onPress: () => declineProposal('not_ready').then(() => onClose()),
        },
        {
          text: t('quickMeet.declinePreferChat'),
          onPress: () => declineProposal('prefer_chat').then(() => onClose()),
        },
      ]
    );
  };

  // Annuler la proposition
  const handleCancel = () => {
    Alert.alert(
      t('quickMeet.cancelTitle'),
      t('quickMeet.cancelMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => cancelProposal().then(() => onClose()),
        },
      ]
    );
  };

  // Rendu du contenu selon l'état
  const renderContent = () => {
    // Si une proposition est en attente et on est le destinataire
    if (activeProposal && isRecipient) {
      return (
        <>
          <View style={styles.proposalHeader}>
            <Text style={styles.proposalIcon}>☕</Text>
            <Text style={styles.proposalTitle}>
              {t('quickMeet.receivedTitle', { name: otherUserName })}
            </Text>
            <Text style={styles.proposalSubtitle}>
              {t('quickMeet.receivedSubtitle')}
            </Text>
          </View>

          {activeProposal.message && (
            <View style={styles.messageCard}>
              <Text style={styles.messageLabel}>{t('quickMeet.theirMessage')}</Text>
              <Text style={styles.messageText}>"{activeProposal.message}"</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('quickMeet.selectTime')}</Text>
          {activeProposal.proposedSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                responseSlotId === slot.id && styles.slotCardSelected,
              ]}
              onPress={() => setResponseSlotId(slot.id)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={responseSlotId === slot.id ? colors.primary : colors.text}
              />
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <Text style={styles.slotDuration}>
                {getDurationLabel(activeProposal.duration)}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>{t('quickMeet.selectPlace')}</Text>
          {activeProposal.suggestedPlaces.map((place) => {
            const display = getPlaceTypeDisplay(place.type);
            return (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placeCard,
                  responsePlaceId === place.id && styles.placeCardSelected,
                ]}
                onPress={() => setResponsePlaceId(place.id)}
              >
                <Text style={styles.placeIcon}>{display.icon}</Text>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{display.label}</Text>
                  <Text style={styles.placeDesc}>{display.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Safety info */}
          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text style={styles.safetyText}>{t('quickMeet.safetyTip')}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title={t('quickMeet.decline')}
              onPress={handleDecline}
              variant="outline"
              style={styles.declineButton}
            />
            <Button
              title={isSending ? t('common.loading') : t('quickMeet.accept')}
              onPress={handleAccept}
              disabled={isSending || !responseSlotId || !responsePlaceId}
              style={styles.acceptButton}
            />
          </View>
        </>
      );
    }

    // Si on a envoyé une proposition en attente
    if (activeProposal && isProposer) {
      return (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingIcon}>⏳</Text>
          <Text style={styles.waitingTitle}>{t('quickMeet.waitingTitle')}</Text>
          <Text style={styles.waitingText}>
            {t('quickMeet.waitingText', { name: otherUserName })}
          </Text>
          <Button
            title={t('quickMeet.cancelProposal')}
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      );
    }

    // Formulaire de création
    return (
      <>
        <View style={styles.headerInfo}>
          <Text style={styles.headerIcon}>☕</Text>
          <Text style={styles.headerTitle}>{t('quickMeet.createTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('quickMeet.createSubtitle')}</Text>
        </View>

        {/* Durée */}
        <Text style={styles.sectionTitle}>{t('quickMeet.duration')}</Text>
        <View style={styles.durationRow}>
          {availableDurations.map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationChip,
                selectedDuration === duration && styles.durationChipSelected,
              ]}
              onPress={() => setSelectedDuration(duration)}
            >
              <Text
                style={[
                  styles.durationText,
                  selectedDuration === duration && styles.durationTextSelected,
                ]}
              >
                {getDurationLabel(duration)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Créneaux */}
        <Text style={styles.sectionTitle}>
          {t('quickMeet.timeSlots')} ({selectedSlots.length}/3)
        </Text>
        {availableTimeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.slotCard,
              selectedSlots.includes(slot.id) && styles.slotCardSelected,
            ]}
            onPress={() => toggleSlot(slot.id)}
          >
            <Ionicons
              name={selectedSlots.includes(slot.id) ? 'checkbox' : 'square-outline'}
              size={22}
              color={selectedSlots.includes(slot.id) ? colors.primary : colors.textSecondary}
            />
            <Text style={styles.slotLabel}>{slot.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Type de lieu */}
        <Text style={styles.sectionTitle}>{t('quickMeet.placeType')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placeTypesScroll}>
          {availablePlaceTypes.map((type) => {
            const display = getPlaceTypeDisplay(type);
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.placeTypeChip,
                  selectedPlaceType === type && styles.placeTypeChipSelected,
                ]}
                onPress={() => setSelectedPlaceType(type)}
              >
                <Text style={styles.placeTypeIcon}>{display.icon}</Text>
                <Text
                  style={[
                    styles.placeTypeText,
                    selectedPlaceType === type && styles.placeTypeTextSelected,
                  ]}
                >
                  {display.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Message optionnel */}
        <Text style={styles.sectionTitle}>{t('quickMeet.addMessage')}</Text>
        <TextInput
          style={styles.messageInput}
          placeholder={t('quickMeet.messagePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={150}
        />

        {/* Safety info */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.safetyText}>{t('quickMeet.safetyInfo')}</Text>
        </View>

        <Button
          title={isSending ? t('common.loading') : t('quickMeet.sendProposal')}
          onPress={handleSendProposal}
          disabled={isSending || selectedSlots.length === 0}
          style={styles.sendButton}
        />
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('quickMeet.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  durationTextSelected: {
    color: colors.primary,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 8,
    gap: 12,
  },
  slotCardSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  slotLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  slotDuration: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  placeTypesScroll: {
    marginBottom: 8,
  },
  placeTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 10,
    gap: 6,
  },
  placeTypeChipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  placeTypeIcon: {
    fontSize: 18,
  },
  placeTypeText: {
    fontSize: 14,
    color: colors.text,
  },
  placeTypeTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 199, 132, 0.15)',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  sendButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  // Received proposal styles
  proposalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  proposalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  proposalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  proposalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: colors.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    fontStyle: 'italic',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 8,
    gap: 12,
  },
  placeCardSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  placeIcon: {
    fontSize: 24,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  placeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  // Waiting styles
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  cancelButton: {
    minWidth: 200,
  },
});

export default QuickMeetModal;
