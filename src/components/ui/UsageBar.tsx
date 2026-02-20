import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { FREE_TIER_LIMITS } from '../../types';

interface UsageBarProps {
  remaining: number;
}

export const UsageBar: React.FC<UsageBarProps> = ({ remaining }) => {
  const router = useRouter();
  const total = FREE_TIER_LIMITS.aiMessagesPerDay;
  const used = total - remaining;
  const progress = used / total;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {remaining} of {total} messages left today
        </Text>
        <TouchableOpacity onPress={() => router.push('/paywall')}>
          <Text style={styles.upgrade}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundTertiary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  upgrade: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  track: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
