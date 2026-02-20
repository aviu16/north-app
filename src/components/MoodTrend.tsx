import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { MoodType, MoodColors } from '../types';
import { useApp } from '../context/AppContext';
import { useStaggeredEntry } from '../hooks/useAnimations';
import { startOfDay, subDays, isSameDay } from 'date-fns';

const moodHeight: Record<MoodType, number> = {
  amazing: 24,
  good: 18,
  neutral: 12,
  low: 8,
  terrible: 4,
};

function MoodDot({ mood, index }: { mood: MoodType | null; index: number }) {
  const animStyle = useStaggeredEntry(index, 80);

  if (!mood) {
    return (
      <Animated.View style={[styles.dotWrapper, { opacity: animStyle.opacity, transform: animStyle.transform }]}>
        <View style={[styles.dot, styles.dotEmpty]} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.dotWrapper, { opacity: animStyle.opacity, transform: animStyle.transform }]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: MoodColors[mood],
            marginTop: 24 - moodHeight[mood],
          },
        ]}
      />
    </Animated.View>
  );
}

export default function MoodTrend() {
  const { state } = useApp();

  // Get last 7 days of moods
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const entry = state.journalEntries.find((e) =>
      isSameDay(startOfDay(new Date(e.createdAt)), date) && e.mood
    );
    return entry?.mood as MoodType | null ?? null;
  });

  // Don't show if no mood data
  const hasMoods = days.some((d) => d !== null);
  if (!hasMoods) return null;

  return (
    <View style={styles.container}>
      {days.map((mood, i) => (
        <MoodDot key={i} mood={mood} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 32,
  },
  dotWrapper: {
    height: 28,
    justifyContent: 'flex-end',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotEmpty: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
});
