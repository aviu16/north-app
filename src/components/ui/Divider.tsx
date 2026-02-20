import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

interface DividerProps {
  style?: ViewStyle;
  spacing?: number;
}

export const Divider: React.FC<DividerProps> = ({ style, spacing = Spacing.lg }) => (
  <View
    style={[
      styles.divider,
      { marginVertical: spacing },
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
