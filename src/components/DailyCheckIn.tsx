import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { MoodType, MoodEmoji, MoodLabels } from '../types';
import { useApp } from '../context/AppContext';
import { hapticLight, hapticSuccess } from '../utils/helpers';

const moods: MoodType[] = ['amazing', 'good', 'neutral', 'low', 'terrible'];

function MoodButton({ mood, selected, onPress }: { mood: MoodType; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, damping: 4, stiffness: 400, mass: 1, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 6, stiffness: 200, mass: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.moodBtn, selected && styles.moodBtnSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.moodEmoji}>{MoodEmoji[mood]}</Text>
        <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>
          {MoodLabels[mood]}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DailyCheckIn() {
  const { addDailyCheckIn, getTodaysCheckIn } = useApp();
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const [note, setNote] = useState('');

  const todaysCheckIn = getTodaysCheckIn();

  if (todaysCheckIn) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedRow}>
          <Text style={styles.completedEmoji}>{MoodEmoji[todaysCheckIn.mood]}</Text>
          <View style={styles.completedText}>
            <Text style={styles.completedMood}>Checked in: {MoodLabels[todaysCheckIn.mood]}</Text>
            {todaysCheckIn.note ? (
              <Text style={styles.completedNote} numberOfLines={1}>{todaysCheckIn.note}</Text>
            ) : null}
          </View>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      </View>
    );
  }

  const handleCheckIn = () => {
    if (!selectedMood) return;
    hapticSuccess();
    addDailyCheckIn(selectedMood, note.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you today?</Text>
      <View style={styles.moodRow}>
        {moods.map((mood) => (
          <MoodButton
            key={mood}
            mood={mood}
            selected={selectedMood === mood}
            onPress={() => {
              hapticLight();
              setSelectedMood(mood);
            }}
          />
        ))}
      </View>
      {selectedMood && (
        <>
          <TextInput
            style={styles.noteInput}
            placeholder="One thought for today..."
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={200}
          />
          <TouchableOpacity
            style={styles.checkInBtn}
            onPress={handleCheckIn}
            activeOpacity={0.7}
          >
            <Text style={styles.checkInBtnText}>Check in</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  title: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  moodLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  moodLabelSelected: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  noteInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  checkInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  checkInBtnText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  completedContainer: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(107, 143, 113, 0.15)',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  completedEmoji: {
    fontSize: 28,
  },
  completedText: {
    flex: 1,
  },
  completedMood: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  completedNote: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
});
