import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
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

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;

/**
 * Custom slider component compatible with Expo managed workflow
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
  const [containerWidth, setContainerWidth] = useState(0);
  const [thumbX, setThumbX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const currentValueRef = useRef(value);

  // Store latest values in refs to avoid stale closures in PanResponder
  const containerWidthRef = useRef(containerWidth);
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  const disabledRef = useRef(disabled);
  const minimumValueRef = useRef(minimumValue);
  const maximumValueRef = useRef(maximumValue);
  const stepRef = useRef(step);

  // Keep refs updated
  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    onSlidingCompleteRef.current = onSlidingComplete;
  }, [onSlidingComplete]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    minimumValueRef.current = minimumValue;
    maximumValueRef.current = maximumValue;
    stepRef.current = step;
  }, [minimumValue, maximumValue, step]);

  // Calculate position from value
  const valueToPosition = useCallback((val: number): number => {
    const range = maximumValue - minimumValue;
    if (range === 0 || containerWidth === 0) return 0;
    const percentage = (val - minimumValue) / range;
    return percentage * (containerWidth - THUMB_SIZE);
  }, [minimumValue, maximumValue, containerWidth]);

  // Calculate value from position (uses refs for PanResponder compatibility)
  const positionToValueFromRefs = useCallback((pos: number): number => {
    const width = containerWidthRef.current;
    const min = minimumValueRef.current;
    const max = maximumValueRef.current;
    const currentStep = stepRef.current;

    if (width === 0) return min;
    const trackWidth = width - THUMB_SIZE;
    const percentage = Math.max(0, Math.min(1, pos / trackWidth));
    let val = min + percentage * (max - min);

    // Apply step
    if (currentStep > 0) {
      val = Math.round(val / currentStep) * currentStep;
    }

    return Math.max(min, Math.min(max, val));
  }, []);

  // Update thumb position when value prop changes (and not dragging)
  useEffect(() => {
    if (!isDragging && containerWidth > 0) {
      setThumbX(valueToPosition(value));
      currentValueRef.current = value;
    }
  }, [value, valueToPosition, containerWidth, isDragging]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Create PanResponder using refs to avoid stale closures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          setIsDragging(true);
          const touchX = evt.nativeEvent.locationX;
          const width = containerWidthRef.current;
          const newPos = Math.max(0, Math.min(touchX - THUMB_SIZE / 2, width - THUMB_SIZE));
          const newValue = positionToValueFromRefs(newPos);

          // Calculate position from value for consistent display
          const range = maximumValueRef.current - minimumValueRef.current;
          const percentage = range === 0 ? 0 : (newValue - minimumValueRef.current) / range;
          const displayPos = percentage * (width - THUMB_SIZE);

          setThumbX(displayPos);
          currentValueRef.current = newValue;
          onValueChangeRef.current?.(newValue);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const touchX = evt.nativeEvent.locationX;
          const width = containerWidthRef.current;
          const newPos = Math.max(0, Math.min(touchX - THUMB_SIZE / 2, width - THUMB_SIZE));
          const newValue = positionToValueFromRefs(newPos);

          // Calculate position from value for consistent display
          const range = maximumValueRef.current - minimumValueRef.current;
          const percentage = range === 0 ? 0 : (newValue - minimumValueRef.current) / range;
          const displayPos = percentage * (width - THUMB_SIZE);

          setThumbX(displayPos);
          currentValueRef.current = newValue;
          onValueChangeRef.current?.(newValue);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          onSlidingCompleteRef.current?.(currentValueRef.current);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          onSlidingCompleteRef.current?.(currentValueRef.current);
        },
      }),
    [positionToValueFromRefs]
  );

  const filledWidth = thumbX + THUMB_SIZE / 2;

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Background track */}
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />

      {/* Filled track */}
      <View
        style={[
          styles.filledTrack,
          {
            backgroundColor: minimumTrackTintColor,
            width: filledWidth,
          },
        ]}
      />

      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            left: thumbX,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />
    </View>
  );
}

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
