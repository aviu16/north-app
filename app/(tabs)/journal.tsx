import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { Card, Badge, EmptyState } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { useInsight } from '../../src/hooks/useInsight';
import { formatDate, hapticLight, hapticSuccess, hapticMedium } from '../../src/utils/helpers';
import { MoodType, MoodEmoji, MoodLabels, MoodColors, SourceLabels } from '../../src/types';
import JournalPrompts from '../../src/components/JournalPrompts';
import MoodTrend from '../../src/components/MoodTrend';

const moods: MoodType[] = ['amazing', 'good', 'neutral', 'low', 'terrible'];

function AnimatedMoodButton({
  mood,
  selected,
  onPress,
}: {
  mood: MoodType;
  selected: boolean;
  onPress: () => void;
}) {
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
        style={[
          styles.moodOption,
          selected && {
            backgroundColor: MoodColors[mood] + '20',
            borderColor: MoodColors[mood],
          },
        ]}
        onPress={handlePress}
      >
        <Text style={styles.moodEmoji}>{MoodEmoji[mood]}</Text>
        <Text
          style={[
            styles.moodLabel,
            selected && { color: MoodColors[mood] },
          ]}
        >
          {MoodLabels[mood]}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function JournalScreen() {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp();
  const { fetchSuggestedActions } = useInsight();
  const insets = useSafeAreaInsets();
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickCapture, setIsQuickCapture] = useState(false);
  const [showSaveCelebration, setShowSaveCelebration] = useState(false);
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const filteredEntries = state.journalEntries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentMood = state.journalEntries[0]?.mood as MoodType | undefined;

  const openNewEntry = () => {
    hapticLight();
    setTitle('');
    setContent('');
    setSelectedMood(undefined);
    setEditingEntry(null);
    setIsQuickCapture(false);
    setShowEditor(true);
  };

  const openEditEntry = (id: string) => {
    const entry = state.journalEntries.find((e) => e.id === id);
    if (!entry) return;
    hapticLight();
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedMood(entry.mood);
    setEditingEntry(id);
    setIsQuickCapture(false);
    setShowEditor(true);
  };

  useEffect(() => {
    if (showSaveCelebration) {
      Animated.sequence([
        Animated.timing(celebrationOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(celebrationOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setShowSaveCelebration(false));
    }
  }, [showSaveCelebration]);

  const handleSave = () => {
    if (isQuickCapture) {
      if (content.trim().length === 0) return;
    } else {
      if (title.trim().length === 0 && content.trim().length === 0) return;
    }

    hapticSuccess();

    if (editingEntry) {
      const entry = state.journalEntries.find((e) => e.id === editingEntry);
      if (entry) {
        updateJournalEntry({
          ...entry,
          title: title.trim() || 'Untitled',
          content: content.trim(),
          mood: selectedMood,
        });
      }
    } else {
      const entryTitle = isQuickCapture
        ? `${selectedMood ? MoodLabels[selectedMood] : 'Quick'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : title.trim() || 'Untitled';
      addJournalEntry(entryTitle, content.trim(), selectedMood);
    }

    setShowEditor(false);
    setShowSaveCelebration(true);

    const totalAfterSave = state.journalEntries.length + (editingEntry ? 0 : 1);
    if (totalAfterSave >= 2) {
      fetchSuggestedActions();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          hapticMedium();
          deleteJournalEntry(id);
        },
      },
    ]);
  };

  const handlePromptSelect = useCallback((promptText: string) => {
    setContent(promptText + '\n\n');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSub}>
            {state.journalEntries.length === 0
              ? "What's on your mind today?"
              : `${state.journalEntries.length} ${state.journalEntries.length === 1 ? 'entry' : 'entries'}`}
          </Text>
        </View>
        <MoodTrend />
      </View>

      {/* Search */}
      {state.journalEntries.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Entries List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredEntries.length === 0 && state.journalEntries.length === 0 ? (
          <EmptyState
            icon="📝"
            title="What's on your mind today?"
            description="Your first entry is the hardest. After that, North starts learning who you are."
            actionLabel="Write entry"
            onAction={openNewEntry}
          />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No results"
            description="Try a different search term."
          />
        ) : (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              style={styles.entryCard}
              onPress={() => openEditEntry(entry.id)}
            >
              <View style={styles.entryTop}>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  {entry.source !== 'north' && (
                    <Badge label={SourceLabels[entry.source]} color={Colors.accent} />
                  )}
                </View>
                {entry.mood && (
                  <Text style={styles.entryMood}>{MoodEmoji[entry.mood]}</Text>
                )}
              </View>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
              <View style={styles.entryFooter}>
                <Text style={styles.entryWordCount}>{entry.wordCount} words</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(entry.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 96 }]}
        onPress={openNewEntry}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Editor Modal */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorHeaderTitle}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>

          {!editingEntry && (
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, !isQuickCapture && styles.modeBtnActive]}
                onPress={() => { hapticLight(); setIsQuickCapture(false); }}
              >
                <Text style={[styles.modeBtnText, !isQuickCapture && styles.modeBtnTextActive]}>Full Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, isQuickCapture && styles.modeBtnActive]}
                onPress={() => { hapticLight(); setIsQuickCapture(true); }}
              >
                <Text style={[styles.modeBtnText, isQuickCapture && styles.modeBtnTextActive]}>Quick Capture</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.moodSelector}>
            {moods.map((mood) => (
              <AnimatedMoodButton
                key={mood}
                mood={mood}
                selected={selectedMood === mood}
                onPress={() => {
                  hapticLight();
                  setSelectedMood(selectedMood === mood ? undefined : mood);
                }}
              />
            ))}
          </View>

          {!editingEntry && content.length === 0 && (
            <JournalPrompts recentMood={recentMood} onSelectPrompt={handlePromptSelect} />
          )}

          {!isQuickCapture && (
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          )}

          <TextInput
            style={[styles.contentInput, isQuickCapture && styles.quickContentInput]}
            placeholder={isQuickCapture ? "What's on your mind? (280 chars)" : 'Write your thoughts...'}
            placeholderTextColor={Colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus={!editingEntry}
            maxLength={isQuickCapture ? 280 : undefined}
          />

          {isQuickCapture && (
            <Text style={styles.charCount}>{content.length}/280</Text>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Save Celebration */}
      {showSaveCelebration && (
        <Animated.View style={[styles.celebration, { opacity: celebrationOpacity }]}>
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationCheck}>✓</Text>
            <Text style={styles.celebrationText}>Saved!</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerLeft: { flex: 1 },
  headerTitle: { ...Typography.displayMedium, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  headerSub: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.xs, fontFamily: 'Inter_400Regular' },
  searchContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  searchInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, ...Typography.bodyMedium, color: Colors.textPrimary, fontFamily: 'Inter_400Regular',
  },
  list: { flex: 1, paddingHorizontal: Spacing.xl },
  entryCard: { marginBottom: Spacing.md },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entryDate: { ...Typography.labelSmall, color: Colors.textTertiary, fontFamily: 'Inter_400Regular' },
  entryMood: { fontSize: 20 },
  entryTitle: { ...Typography.headlineSmall, color: Colors.textPrimary, marginBottom: Spacing.xs, fontFamily: 'Inter_600SemiBold' },
  entryContent: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md, fontFamily: 'Inter_400Regular' },
  entryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryWordCount: { ...Typography.labelSmall, color: Colors.textTertiary, fontFamily: 'Inter_400Regular' },
  deleteText: { ...Typography.labelSmall, color: Colors.error, fontFamily: 'Inter_600SemiBold' },
  fab: {
    position: 'absolute', right: Spacing.xl, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.md,
  },
  fabText: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Inter_400Regular', marginTop: -2 },
  editorContainer: { flex: 1, backgroundColor: Colors.background },
  editorHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  editorCancel: { ...Typography.bodyLarge, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', minWidth: 60 },
  editorHeaderTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  editorSave: { ...Typography.bodyLarge, color: Colors.primary, fontFamily: 'Inter_600SemiBold', minWidth: 60, textAlign: 'right' },
  modeToggle: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    backgroundColor: Colors.backgroundTertiary, borderRadius: BorderRadius.md, padding: 3,
  },
  modeBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  modeBtnActive: { backgroundColor: Colors.backgroundSecondary, ...Shadows.sm },
  modeBtnText: { ...Typography.labelMedium, color: Colors.textTertiary, fontFamily: 'Inter_400Regular' },
  modeBtnTextActive: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  moodSelector: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.xs },
  moodOption: {
    alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  moodEmoji: { fontSize: 18, marginBottom: 2 },
  moodLabel: { ...Typography.labelSmall, color: Colors.textTertiary, fontFamily: 'Inter_400Regular' },
  titleInput: { ...Typography.headlineLarge, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, fontFamily: 'Inter_600SemiBold' },
  contentInput: { flex: 1, ...Typography.bodyLarge, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: 0, lineHeight: 28, fontFamily: 'Inter_400Regular' },
  quickContentInput: { paddingTop: Spacing.md },
  charCount: { ...Typography.labelSmall, color: Colors.textTertiary, textAlign: 'right', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, fontFamily: 'Inter_400Regular' },
  celebration: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  celebrationCard: { backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.xl, padding: Spacing['3xl'], alignItems: 'center', ...Shadows.lg },
  celebrationCheck: { fontSize: 40, color: Colors.primary, marginBottom: Spacing.sm },
  celebrationText: { ...Typography.headlineSmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
});
