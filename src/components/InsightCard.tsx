import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { Card, Badge } from './ui';
import { useApp } from '../context/AppContext';
import { useInsight } from '../hooks/useInsight';

export default function InsightCard() {
  const { state } = useApp();
  const { cachedInsight, fetchInsight } = useInsight();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const totalEntries = state.journalEntries.length;

  useEffect(() => {
    if (totalEntries >= 3 && !cachedInsight) {
      setIsLoading(true);
      fetchInsight().finally(() => setIsLoading(false));
    }
  }, [totalEntries]);

  if (totalEntries < 3) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💡</Text>
          <Badge label="AI Insight" color={Colors.accent} />
        </View>
        <Text style={styles.text}>
          Keep journaling — I need a few more entries to share what I see.
        </Text>
      </Card>
    );
  }

  return (
    <Card
      style={styles.card}
      onPress={() => router.push('/(tabs)/guide')}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>💡</Text>
        <Badge label="AI Insight" color={Colors.accent} />
      </View>
      {isLoading ? (
        <View style={styles.shimmer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.shimmerText}>Reading your journal...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.text}>
            {cachedInsight?.text || 'Tap to generate your first insight.'}
          </Text>
          <Text style={styles.link}>Talk to North about this →</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryMuted,
    borderColor: 'rgba(107, 143, 113, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  shimmer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  shimmerText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  link: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    marginTop: Spacing.md,
  },
});
