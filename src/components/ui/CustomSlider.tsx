import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

interface CustomSliderProps {
  style?: object;
  minimumValue?: number;
  maximumValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  step?: number;
  disabled?: boolean;
}

/**
 * Custom slider component compatible with Expo managed workflow
 * Replaces @react-native-community/slider which has native build issues
 */
export function CustomSlider({
  style,
  minimumValue = 0,
  maximumValue = 100,
  value = 0,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#FF6B6B',
  maximumTrackTintColor = '#E0E0E0',
  thumbTintColor = '#FF6B6B',
  step = 1,
  disabled = false,
}: CustomSliderProps) {
  const containerWidth = useRef(0);
  const thumbPosition = useRef(new Animated.Value(0)).current;
  const currentValue = useRef(value);

  // Calculate position from value
  const valueToPosition = useCallback((val: number): number => {
    const range = maximumValue - minimumValue;
    if (range === 0) return 0;
    const percentage = (val - minimumValue) / range;
    return percentage * containerWidth.current;
  }, [minimumValue, maximumValue]);

  // Calculate value from position
  const positionToValue = useCallback((pos: number): number => {
    const range = maximumValue - minimumValue;
    const percentage = Math.max(0, Math.min(1, pos / containerWidth.current));
    let val = minimumValue + percentage * range;

    // Apply step
    if (step > 0) {
      val = Math.round(val / step) * step;
    }

    return Math.max(minimumValue, Math.min(maximumValue, val));
  }, [minimumValue, maximumValue, step]);

  // Update thumb position when value prop changes
  React.useEffect(() => {
    if (containerWidth.current > 0) {
      const pos = valueToPosition(value);
      thumbPosition.setValue(pos);
      currentValue.current = value;
    }
  }, [value, valueToPosition, thumbPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Set position based on touch location
        const touchX = evt.nativeEvent.locationX;
        const newValue = positionToValue(touchX);
        thumbPosition.setValue(valueToPosition(newValue));
        currentValue.current = newValue;
        onValueChange?.(newValue);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = positionToValue(touchX);
        thumbPosition.setValue(valueToPosition(newValue));
        currentValue.current = newValue;
        onValueChange?.(newValue);
      },
      onPanResponderRelease: () => {
        onSlidingComplete?.(currentValue.current);
      },
      onPanResponderTerminate: () => {
        onSlidingComplete?.(currentValue.current);
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    containerWidth.current = width - THUMB_SIZE;

    // Update thumb position after layout
    const pos = valueToPosition(value);
    thumbPosition.setValue(pos);
  };

  const trackWidth = thumbPosition.interpolate({
    inputRange: [0, containerWidth.current || 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Background track */}
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />

      {/* Filled track */}
      <Animated.View
        style={[
          styles.filledTrack,
          {
            backgroundColor: minimumTrackTintColor,
            width: Animated.add(thumbPosition, THUMB_SIZE / 2),
          },
        ]}
      />

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            transform: [{ translateX: thumbPosition }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />
    </View>
  );
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
  },
  filledTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: THUMB_SIZE / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CustomSlider;
