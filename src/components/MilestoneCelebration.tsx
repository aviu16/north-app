import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { hapticSuccess } from '../utils/helpers';

interface Props {
  milestone: number;
  visible: boolean;
  onDismiss: () => void;
}

const milestoneMessages: Record<number, { emoji: string; title: string; message: string }> = {
  3: {
    emoji: '🌱',
    title: 'Three in a row',
    message: 'You showed up three days straight. That matters more than you think.',
  },
  7: {
    emoji: '🔥',
    title: 'One week',
    message: 'The habit is forming. You chose to reflect for seven days. Keep going.',
  },
  14: {
    emoji: '⭐',
    title: 'Two weeks',
    message: "This isn't a phase anymore. You're building something real.",
  },
  30: {
    emoji: '🏔️',
    title: 'One month',
    message: "This is who you are now. Thirty days of showing up for yourself.",
  },
  100: {
    emoji: '💎',
    title: 'One hundred days',
    message: 'Remarkable.',
  },
};

export default function MilestoneCelebration({ milestone, visible, onDismiss }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 12, stiffness: 200, mass: 1, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [visible]);

  const data = milestoneMessages[milestone];
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{data.emoji}</Text>
          <Text style={styles.streakNum}>{milestone}</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.message}>{data.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              hapticSuccess();
              onDismiss();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Keep going</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['4xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  streakNum: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
  },
  buttonText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});
