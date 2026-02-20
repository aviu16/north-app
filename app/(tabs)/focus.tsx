import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { hapticLight, hapticSuccess, hapticMedium } from '../../src/utils/helpers';

type SessionState = 'idle' | 'running' | 'success' | 'failed';

const DURATIONS = [15, 25, 45];

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { state, recordFocusSession } = useApp();

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(selectedMinutes * 60);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [focusPulse, setFocusPulse] = useState(0);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  const progress = useMemo(() => {
    const total = selectedMinutes * 60;
    return Math.max(0, Math.min(1, (total - remainingSeconds) / total));
  }, [remainingSeconds, selectedMinutes]);

  const mascot = useMemo(() => {
    if (state.focusGame.workshopLevel >= 6) return '🪐';
    if (state.focusGame.workshopLevel >= 4) return '🦊';
    if (state.focusGame.workshopLevel >= 2) return '🐰';
    return '🧶';
  }, [state.focusGame.workshopLevel]);

  useEffect(() => {
    setRemainingSeconds(selectedMinutes * 60);
  }, [selectedMinutes]);

  useEffect(() => {
    if (sessionState !== 'running') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionState('success');
          recordFocusSession(selectedMinutes, true);
          hapticSuccess();
          return 0;
        }
        return prev - 1;
      });

      setFocusPulse((p) => (p + 1) % 6);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState, selectedMinutes]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState !== 'active' && sessionState === 'running') {
        setSessionState('failed');
        recordFocusSession(selectedMinutes, false);
        hapticMedium();
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [sessionState, selectedMinutes]);

  useEffect(() => {
    if (sessionState !== 'running') {
      spinAnim.stopAnimation();
      bobAnim.stopAnimation();
      return;
    }

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -5, duration: 900, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 5, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [sessionState]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const startSession = () => {
    hapticLight();
    setSessionState('running');
    setRemainingSeconds(selectedMinutes * 60);
  };

  const resetSession = () => {
    hapticLight();
    setSessionState('idle');
    setRemainingSeconds(selectedMinutes * 60);
  };

  const statusText =
    sessionState === 'running'
      ? `${state.focusGame.mascotName} is building while you focus`
      : sessionState === 'success'
        ? 'Session complete. Your world grew.'
        : sessionState === 'failed'
          ? 'Session failed. Your mascot stopped building.'
          : 'Start a focus session to grow your world.';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>Focus Forge</Text>
        <Text style={styles.subtitle}>Stay focused. Build your world in real time.</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Animated.Text
            style={[
              styles.mascot,
              {
                transform: [{ translateY: bobAnim }, { rotate: spin }],
              },
            ]}
          >
            {mascot}
          </Animated.Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroName}>{state.focusGame.worldName}</Text>
            <Text style={styles.heroMeta}>Level {state.focusGame.workshopLevel}</Text>
            <Text style={styles.heroMeta}>⭐ {state.focusGame.starsBuilt} built</Text>
            <Text style={styles.heroMeta}>🔥 streak {state.focusGame.currentFocusStreak}</Text>
          </View>
        </View>

        <View style={styles.timerWrap}>
          <Text style={styles.timer}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>

        {sessionState === 'running' && (
          <Text style={styles.sparkText}>{'✨'.repeat(focusPulse + 1)} building constellations</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.blockTitle}>Session Length</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.durationChip, selectedMinutes === m && styles.durationChipActive]}
              onPress={() => {
                if (sessionState === 'running') return;
                setSelectedMinutes(m);
              }}
            >
              <Text style={[styles.durationText, selectedMinutes === m && styles.durationTextActive]}>{m}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionRow}>
          {sessionState !== 'running' ? (
            <TouchableOpacity style={styles.startBtn} onPress={startSession}>
              <Text style={styles.startText}>Start Focus Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetSession}>
              <Text style={styles.cancelText}>Stop Session</Text>
            </TouchableOpacity>
          )}

          {(sessionState === 'success' || sessionState === 'failed') && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetSession}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      <Card style={styles.statsCard}>
        <Text style={styles.blockTitle}>Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{state.focusGame.successfulSessions}</Text>
            <Text style={styles.statLabel}>Sessions Won</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{state.focusGame.totalFocusedMinutes}</Text>
            <Text style={styles.statLabel}>Focused Minutes</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{state.focusGame.longestFocusStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{state.focusGame.failedSessions}</Text>
            <Text style={styles.statLabel}>Dropped Sessions</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FB',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.displayMedium,
    color: '#172236',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: '#57627A',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: '#13233A',
    borderColor: '#233D60',
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mascot: {
    fontSize: 44,
  },
  heroStats: {
    flex: 1,
  },
  heroName: {
    ...Typography.labelLarge,
    color: '#EAF2FF',
    fontFamily: 'Inter_700Bold',
  },
  heroMeta: {
    ...Typography.bodySmall,
    color: '#B9CAE6',
    fontFamily: 'Inter_400Regular',
  },
  timerWrap: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  timer: {
    fontSize: 54,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  statusText: {
    ...Typography.bodySmall,
    color: '#D4E3FF',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  track: {
    marginTop: Spacing.md,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#334F75',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#6FE0B8',
  },
  sparkText: {
    marginTop: Spacing.sm,
    ...Typography.labelSmall,
    color: '#AEEFD8',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  blockTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    marginBottom: Spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#D5DCE8',
    backgroundColor: '#FFFFFF',
  },
  durationChipActive: {
    backgroundColor: '#DDF4EA',
    borderColor: '#4EB98B',
  },
  durationText: {
    ...Typography.labelMedium,
    color: '#516176',
    fontFamily: 'Inter_700Bold',
  },
  durationTextActive: {
    color: '#2E8F69',
  },
  actionRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  startBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#3A78F2',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E84E4E',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  resetBtn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D0D7E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  resetText: {
    ...Typography.labelMedium,
    color: '#4E5D74',
    fontFamily: 'Inter_700Bold',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
  },
  statCell: {
    width: '50%',
  },
  statValue: {
    ...Typography.headlineLarge,
    color: '#172236',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    ...Typography.labelSmall,
    color: '#6B788F',
    fontFamily: 'Inter_400Regular',
  },
});
