import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { ActionButton } from './ActionButton';

interface ActionButtonsRowProps {
  onRewind: () => void;
  onNope: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  onSendMessage?: () => void;
  canDirectMessage: boolean;
}

export const ActionButtonsRow: React.FC<ActionButtonsRowProps> = ({
  onRewind,
  onNope,
  onSuperLike,
  onLike,
  onSendMessage,
  canDirectMessage,
}) => (
  <View style={styles.actionsContainer} pointerEvents="box-none">
    <ActionButton
      icon="refresh"
      color="#FFFFFF"
      glowColor={colors.rewindGlow}
      size={64}
      onPress={onRewind}
    />
    <ActionButton
      image={require('../../../assets/nope-x.png')}
      glowColor={colors.dislikeGlow}
      size={64}
      onPress={onNope}
    />
    <ActionButton
      emoji="🫶"
      glowColor={colors.superLikeGlow}
      size={64}
      onPress={onSuperLike}
    />
    <ActionButton
      emoji="💞"
      glowColor={colors.likeGlow}
      size={64}
      onPress={onLike}
    />
    {/* Bouton message : visible seulement si message direct autorisé */}
    {canDirectMessage && onSendMessage && (
      <ActionButton
        icon="chatbubble"
        color={colors.primary}
        glowColor={colors.shadowPink}
        size={52}
        onPress={onSendMessage}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  actionsContainer: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
});
