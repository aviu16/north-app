import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useStreak } from '../hooks/useStreak';
import { startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import { useApp } from '../context/AppContext';

export default function StreakCounter() {
  const { streak } = useStreak();
  const { state } = useApp();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak.current > 0) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, damping: 4, stiffness: 400, mass: 1, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 6, stiffness: 200, mass: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [streak.current]);

  // Build week dots
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const entryDates = new Set(
    state.journalEntries.map((e) => startOfDay(new Date(e.createdAt)).toISOString())
  );

  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const hasEntry = entryDates.has(startOfDay(day).toISOString());
    const isToday = isSameDay(day, new Date());
    return { hasEntry, isToday };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.streakRow, { transform: [{ scale }] }]}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={styles.streakNum}>{streak.current}</Text>
        <Text style={styles.streakLabel}>
          {streak.current === 0 ? 'Start your streak today' : 'day streak'}
        </Text>
      </Animated.View>
      <View style={styles.dotsRow}>
        {weekDots.map((dot, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              dot.hasEntry && styles.dotFilled,
              dot.isToday && !dot.hasEntry && styles.dotToday,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fireEmoji: {
    fontSize: 20,
  },
  streakNum: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  streakLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotToday: {
    borderColor: Colors.primary,
  },
});
