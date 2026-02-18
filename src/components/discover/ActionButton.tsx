import React from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export interface ActionButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  image?: ImageSourcePropType;
  color?: string;
  glowColor: string;
  size?: number;
  onPress: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  emoji,
  image,
  color,
  glowColor,
  size = 60,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      {
        width: size,
        height: size,
        backgroundColor: colors.card,
        shadowColor: glowColor,
      }
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {emoji ? (
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    ) : image ? (
      <Image source={image} style={{ width: size * 0.5, height: size * 0.5, resizeMode: 'contain' }} />
    ) : icon ? (
      <Ionicons name={icon} size={size * 0.45} color={color} />
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
