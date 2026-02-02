import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

interface DismissKeyboardProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that dismisses keyboard when tapping outside of inputs.
 * Wrap your screen content with this component to enable tap-to-dismiss.
 */
export function DismissKeyboard({ children }: DismissKeyboardProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
