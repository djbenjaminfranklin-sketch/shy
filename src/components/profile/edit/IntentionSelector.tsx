import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { IntentionId, INTENTION_LIST } from '../../../constants/intentions';
import { Chip } from '../../ui/Chip';

interface IntentionSelectorProps {
  intention: IntentionId;
  onIntentionChange: (value: IntentionId) => void;
}

export function IntentionSelector({
  intention,
  onIntentionChange,
}: IntentionSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Votre intention</Text>
      <View style={styles.chipContainer}>
        {INTENTION_LIST.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={intention === item.id}
            onPress={() => onIntentionChange(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
