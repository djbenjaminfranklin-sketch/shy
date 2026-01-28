import React from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Profile } from '../../types/profile';
import { Button } from '../ui/Button';

interface MatchAnimationProps {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onSendMessage: () => void;
}

export function MatchAnimation({
  visible,
  profile,
  onClose,
  onSendMessage,
}: MatchAnimationProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>C'est un Match ! 🎉</Text>

          <Text style={styles.subtitle}>
            Vous et {profile.displayName} vous etes mutuellement likes
          </Text>

          <View style={styles.avatarContainer}>
            {profile.photos?.[0] ? (
              <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
          </View>

          <View style={styles.buttons}>
            <Button
              title="Envoyer un message"
              onPress={onSendMessage}
              size="large"
            />
            <Button
              title="Continuer a decouvrir"
              onPress={onClose}
              variant="ghost"
              size="large"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
});

export default MatchAnimation;
