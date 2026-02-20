import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { UsageBar } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { useSubscription } from '../../src/hooks/useSubscription';
import { sendMessage, generateExecutionPlan, ExecutionPlan } from '../../src/services/ai';
import { formatTime, hapticLight, hapticSuccess } from '../../src/utils/helpers';
import { SuggestedAction } from '../../src/types';

const quickPrompts = [
  { emoji: '🔍', label: 'Patterns', prompt: 'Based on my journal entries, what patterns do you notice in my life right now?' },
  { emoji: '🎯', label: 'Today focus', prompt: 'What should I focus on today based on what you know about me?' },
  { emoji: '💭', label: 'Avoidance', prompt: 'What am I avoiding that is costing me momentum?' },
  { emoji: '🌱', label: 'Growth edge', prompt: 'Where am I growing and where am I still stuck?' },
];

type CoachTone = 'supportive' | 'assertive';

export default function GuideScreen() {
  const { state, addChatMessage, clearChat, dispatch } = useApp();
  const { isPro, canSendAIMessage, remainingMessages } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [coachTone, setCoachTone] = useState<CoachTone>('assertive');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [state.chatMessages.length, plan?.focus]);

  const consumeUsage = () => {
    if (!isPro) {
      dispatch({ type: 'INCREMENT_AI_USAGE' });
    }
  };

  const guardUsage = () => {
    if (!canSendAIMessage) {
      router.push('/paywall');
      return false;
    }
    return true;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;
    if (!guardUsage()) return;

    hapticLight();
    setInput('');
    addChatMessage('user', messageText);
    consumeUsage();
    setIsLoading(true);

    try {
      const allMessages = [
        ...state.chatMessages,
        {
          id: 'temp',
          role: 'user' as const,
          content: messageText,
          createdAt: new Date().toISOString(),
        },
      ];

      const response = await sendMessage(allMessages, state.journalEntries, { tone: coachTone });
      hapticSuccess();
      addChatMessage('assistant', response);
    } catch {
      addChatMessage(
        'assistant',
        "I'm having trouble connecting right now. Check your API key in settings or try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildPlan = async () => {
    if (isPlanLoading) return;
    if (!guardUsage()) return;

    const latestEntry = state.journalEntries[0];
    const targetGoal = goalInput.trim() || latestEntry?.title || 'Get unstuck and execute this week';

    setIsPlanLoading(true);
    consumeUsage();

    try {
      const nextPlan = await generateExecutionPlan(targetGoal, state.journalEntries, coachTone);
      setPlan(nextPlan);
      addChatMessage(
        'assistant',
        `Built your 7-day execution plan for: "${targetGoal}". Start with this first win: ${nextPlan.firstWin}`
      );
      hapticSuccess();
    } catch {
      addChatMessage('assistant', 'I could not generate a plan right now. Try again in a minute.');
    } finally {
      setIsPlanLoading(false);
    }
  };

  const addPlanToActions = () => {
    if (!plan) return;

    const existingTitles = new Set(state.suggestedActions.map((a) => a.title.toLowerCase().trim()));
    const planActions: SuggestedAction[] = plan.thisWeek
      .filter((step) => !existingTitles.has(step.title.toLowerCase().trim()))
      .map((step) => ({
        id: Crypto.randomUUID(),
        title: step.title,
        description: `${step.rationale} (${step.effort} effort)`,
        category: 'goal',
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }));

    dispatch({
      type: 'SET_SUGGESTED_ACTIONS',
      payload: [...planActions, ...state.suggestedActions],
    });

    addChatMessage('assistant', `Added ${planActions.length} plan steps to your suggested actions.`);
  };

  const handleClearChat = () => {
    hapticLight();
    clearChat();
    setPlan(null);
  };

  const hasMessages = state.chatMessages.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Guide</Text>
          <Text style={styles.headerSub}>Execution mode, not just advice</Text>
        </View>
        {hasMessages && (
          <TouchableOpacity onPress={handleClearChat}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toneRow}>
        <TouchableOpacity
          style={[styles.toneChip, coachTone === 'assertive' && styles.toneChipActive]}
          onPress={() => setCoachTone('assertive')}
        >
          <Text style={[styles.toneText, coachTone === 'assertive' && styles.toneTextActive]}>Assertive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toneChip, coachTone === 'supportive' && styles.toneChipActive]}
          onPress={() => setCoachTone('supportive')}
        >
          <Text style={[styles.toneText, coachTone === 'supportive' && styles.toneTextActive]}>Supportive</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planBuilder}>
        <TextInput
          style={styles.planInput}
          placeholder="Goal for this week (optional)"
          placeholderTextColor={Colors.textMuted}
          value={goalInput}
          onChangeText={setGoalInput}
          maxLength={160}
        />
        <TouchableOpacity
          style={[styles.planButton, isPlanLoading && styles.planButtonDisabled]}
          onPress={handleBuildPlan}
          disabled={isPlanLoading}
        >
          {isPlanLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.planButtonText}>Build 7-day plan</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[styles.messagesContent, !hasMessages && !plan && styles.emptyCenter]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {plan && (
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Execution Plan</Text>
            <Text style={styles.planLine}><Text style={styles.planLabel}>Focus:</Text> {plan.focus}</Text>
            <Text style={styles.planLine}><Text style={styles.planLabel}>Risk:</Text> {plan.risk}</Text>
            <Text style={styles.planLine}><Text style={styles.planLabel}>First win:</Text> {plan.firstWin}</Text>

            <View style={styles.stepList}>
              {plan.thisWeek.map((step, index) => (
                <View key={`${step.title}-${index}`} style={styles.stepItem}>
                  <Text style={styles.stepTitle}>{index + 1}. {step.title}</Text>
                  <Text style={styles.stepMeta}>{step.rationale} • {step.effort}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.addActionsBtn} onPress={addPlanToActions}>
              <Text style={styles.addActionsText}>Add Plan To Actions</Text>
            </TouchableOpacity>
          </View>
        )}

        {!hasMessages ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧭</Text>
            <Text style={styles.emptyTitle}>Ask North anything</Text>
            <Text style={styles.emptyDescription}>
              {state.journalEntries.length >= 3
                ? 'North has context now. Ask for patterns, blind spots, or direct next steps.'
                : 'Write a few journal entries first, then North can give specific guidance.'}
            </Text>
            <View style={styles.quickPrompts}>
              {quickPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickPrompt}
                  onPress={() => handleSend(prompt.prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPromptEmoji}>{prompt.emoji}</Text>
                  <Text style={styles.quickPromptText} numberOfLines={2}>{prompt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          state.chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
            >
              {msg.role === 'assistant' && <Text style={styles.bubbleIcon}>🧭</Text>}
              <View
                style={[
                  styles.bubbleContent,
                  msg.role === 'user' ? styles.userBubbleContent : styles.assistantBubbleContent,
                ]}
              >
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>{msg.content}</Text>
                <Text style={[styles.bubbleTime, msg.role === 'user' && styles.userBubbleTime]}>
                  {formatTime(msg.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}

        {isLoading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.bubbleIcon}>🧭</Text>
            <View style={[styles.bubbleContent, styles.assistantBubbleContent, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {!isPro && <UsageBar remaining={remainingMessages} />}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 96 }]}> 
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask North..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  clearText: {
    ...Typography.labelMedium,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  toneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  toneChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  toneChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  toneText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  toneTextActive: {
    color: Colors.primary,
  },
  planBuilder: {
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planInput: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  planButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  planButtonDisabled: {
    opacity: 0.7,
  },
  planButtonText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  emptyCenter: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  planCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  planTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    marginBottom: Spacing.sm,
  },
  planLabel: {
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  planLine: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  stepList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  stepItem: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepTitle: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  stepMeta: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  addActionsBtn: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addActionsText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    fontFamily: 'Inter_400Regular',
  },
  quickPrompts: {
    width: '100%',
    gap: Spacing.sm,
  },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  quickPromptEmoji: {
    fontSize: 20,
  },
  quickPromptText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  bubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  bubbleIcon: {
    fontSize: 20,
    marginTop: Spacing.xs,
  },
  bubbleContent: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubbleContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubbleContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  userBubbleTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  inputContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.md,
    maxHeight: 120,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.backgroundTertiary,
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
