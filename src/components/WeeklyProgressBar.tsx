import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useStreak } from '../hooks/useStreak';
import { useProgressAnimation } from '../hooks/useAnimations';

export default function WeeklyProgressBar() {
  const { weeklyProgress } = useStreak();
  const progress = useProgressAnimation(weeklyProgress.progress);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {weeklyProgress.entriesThisWeek} of {weeklyProgress.goal} entries this week
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: fillWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginBottom: Spacing.sm,
  },
  track: {
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});
