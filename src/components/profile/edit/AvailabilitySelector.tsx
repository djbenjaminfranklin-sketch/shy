import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { AvailabilityId, AVAILABILITY_LIST } from '../../../constants/availability';
import { Chip } from '../../ui/Chip';

interface AvailabilitySelectorProps {
  availability: AvailabilityId | null;
  onAvailabilityChange: (value: AvailabilityId | null) => void;
}

export function AvailabilitySelector({
  availability,
  onAvailabilityChange,
}: AvailabilitySelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Disponibilite</Text>
      <View style={styles.chipContainer}>
        <Chip
          label="Non precisee"
          selected={availability === null}
          onPress={() => onAvailabilityChange(null)}
        />
        {AVAILABILITY_LIST.map((item) => (
          <Chip
            key={item.id}
            label={item.labelShort}
            selected={availability === item.id}
            onPress={() => onAvailabilityChange(item.id)}
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
