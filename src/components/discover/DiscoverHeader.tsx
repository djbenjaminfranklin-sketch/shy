import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { BoostIndicator } from '../boost/BoostIndicator';

interface DiscoverHeaderProps {
  onFilterPress: () => void;
  onIceBreakerPress: () => void;
  boostsAvailable: number;
  isBoostActive: boolean;
  activeBoostExpiresAt: string | null;
  onBoostExpire: () => void;
}

export const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
  onFilterPress,
  onIceBreakerPress,
  boostsAvailable,
  isBoostActive,
  activeBoostExpiresAt,
  onBoostExpire,
}) => (
  <>
    <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onFilterPress}
      >
        <Ionicons name="options" size={26} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.headerButton}
        onPress={onIceBreakerPress}
      >
        <View>
          <Ionicons name="flash" size={26} color={colors.boost} />
          {boostsAvailable > 0 && !isBoostActive && (
            <View style={styles.boostBadge}>
              <Text style={styles.boostBadgeText}>{boostsAvailable}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>

    {/* Boost indicator when active */}
    {isBoostActive && (
      <View style={styles.boostIndicatorContainer}>
        <BoostIndicator expiresAt={activeBoostExpiresAt} onExpire={onBoostExpire} />
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  boostBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.boost,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  boostBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  boostIndicatorContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
