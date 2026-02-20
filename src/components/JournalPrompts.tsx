import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { getPrompts } from '../constants/prompts';
import { MoodType } from '../types';
import { hapticLight } from '../utils/helpers';

interface Props {
  recentMood?: MoodType;
  onSelectPrompt: (text: string) => void;
}

export default function JournalPrompts({ recentMood, onSelectPrompt }: Props) {
  const prompts = getPrompts(recentMood, 3);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {prompts.map((prompt, i) => (
        <TouchableOpacity
          key={i}
          style={styles.chip}
          onPress={() => {
            hapticLight();
            onSelectPrompt(prompt.text);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.chipEmoji}>{prompt.emoji}</Text>
          <Text style={styles.chipText} numberOfLines={2}>{prompt.text}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    maxWidth: 200,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});
