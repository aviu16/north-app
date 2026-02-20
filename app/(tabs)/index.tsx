import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Typography } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';

const ROOM_BG = require('../../assets/scene/room_diorama.png');
const SIGN = require('../../assets/scene/sign_focus.png');
const MASCOT_IDLE = require('../../assets/scene/mascot_idle.png');
const MASCOT_WORK = require('../../assets/scene/mascot_work.png');
const MASCOT_PANIC = require('../../assets/scene/mascot_panic.png');
const MASCOT_PAUSED = require('../../assets/scene/mascot_paused.png');

const formatClock = (deadlineAt: string, nowMs: number) => {
  const diff = new Date(deadlineAt).getTime() - nowMs;
  if (diff <= 0) return '00:00:00';
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addFutureContract, submitContractProof, markContractFailed, markContractAccountabilitySent } = useApp();

  const [nowMs, setNowMs] = useState(Date.now());
  const [promiseDraft, setPromiseDraft] = useState('');
  const [windowHours, setWindowHours] = useState<12 | 24 | 48>(24);
  const [pets, setPets] = useState(0);

  const floatY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const activeContracts = useMemo(
    () => state.futureContracts.filter((c) => c.status === 'active' || c.status === 'awaiting_proof'),
    [state.futureContracts]
  );
  const completedCount = useMemo(
    () => state.futureContracts.filter((c) => c.status === 'completed').length,
    [state.futureContracts]
  );

  const activeContract = useMemo(() => {
    if (activeContracts.length === 0) return null;
    return [...activeContracts].sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())[0];
  }, [activeContracts]);

  const mode = useMemo<'idle' | 'work' | 'panic' | 'paused'>(() => {
    if (!activeContract) return 'idle';
    if (activeContract.status === 'awaiting_proof') return 'paused';
    const leftH = (new Date(activeContract.deadlineAt).getTime() - nowMs) / (1000 * 60 * 60);
    return leftH <= 2 ? 'panic' : 'work';
  }, [activeContract, nowMs]);

  const roomLevel = Math.floor(completedCount / 3) + 1;
  const levelProgress = ((completedCount % 3) / 3) * 100;

  const liveProgress = useMemo(() => {
    if (!activeContract) return levelProgress;
    const start = new Date(activeContract.createdAt).getTime();
    const end = new Date(activeContract.deadlineAt).getTime();
    const p = ((nowMs - start) / Math.max(1, end - start)) * 100;
    return Math.max(0, Math.min(100, p));
  }, [activeContract, nowMs, levelProgress]);

  const timer = activeContract ? formatClock(activeContract.deadlineAt, nowMs) : '--:--:--';

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    floatY.stopAnimation();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: mode === 'panic' ? 320 : 900, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 6, duration: mode === 'panic' ? 320 : 900, useNativeDriver: true }),
      ])
    ).start();
  }, [mode, floatY]);

  const mascotSource =
    mode === 'panic' ? MASCOT_PANIC : mode === 'paused' ? MASCOT_PAUSED : mode === 'work' ? MASCOT_WORK : MASCOT_IDLE;

  const petMascot = () => {
    setPets((v) => v + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    pulse.stopAnimation();
    pulse.setValue(0.92);
    Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const createQuickContract = () => {
    const text = promiseDraft.trim();
    if (!text) return;
    const deadline = new Date(Date.now() + windowHours * 60 * 60 * 1000);

    addFutureContract({
      promise: text,
      deadlineAt: deadline.toISOString(),
      unlockAt: deadline.toISOString(),
      voiceUri: undefined,
      voiceDurationMs: undefined,
      accountabilityContacts: [],
      sharedToCircle: true,
    });

    setPromiseDraft('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  };

  const markWin = () => {
    if (!activeContract) return;
    submitContractProof(activeContract.id, 'Quick proof from Home');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  };

  const markMiss = () => {
    if (!activeContract) return;
    markContractFailed(activeContract.id);
    markContractAccountabilitySent(activeContract.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={ROOM_BG} style={styles.roomImage} resizeMode="cover" />

        <Animated.View style={[styles.mascotAnchor, { transform: [{ translateY: floatY }, { scale: pulse }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={petMascot}>
            <Image source={mascotSource} style={styles.mascotImage} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>

        <Image source={SIGN} style={styles.sign} resizeMode="contain" />

        <View style={styles.overlayTop}>
          <Text style={styles.title}>Future-Self Studio</Text>
          <Text style={styles.subTitle}>
            {mode === 'idle' && 'Start a promise and the room comes alive.'}
            {mode === 'work' && 'Mascot is building while you execute.'}
            {mode === 'panic' && 'Deadline danger mode.'}
            {mode === 'paused' && 'Paused until proof is submitted.'}
          </Text>
        </View>

        <View style={styles.livePanel}>
          <View style={styles.track}><View style={[styles.fill, { width: `${liveProgress}%` }]} /></View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>{activeContract ? activeContract.promise : `Room level ${roomLevel}`}</Text>
            <Text style={styles.timer}>{timer}</Text>
          </View>
        </View>
      </View>

      {!activeContract ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start Promise</Text>
          <TextInput
            value={promiseDraft}
            onChangeText={setPromiseDraft}
            placeholder="By tonight I will ship..."
            placeholderTextColor="#8399B0"
            style={styles.input}
          />
          <View style={styles.row}>
            {[12, 24, 48].map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, windowHours === h && styles.chipActive]}
                onPress={() => setWindowHours(h as 12 | 24 | 48)}
              >
                <Text style={[styles.chipText, windowHours === h && styles.chipTextActive]}>{h}h</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.primaryBtn} onPress={createQuickContract}>
              <Text style={styles.primaryBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.card, styles.row]}>
          <TouchableOpacity style={styles.winBtn} onPress={markWin}><Text style={styles.winBtnText}>I shipped this</Text></TouchableOpacity>
          <TouchableOpacity style={styles.missBtn} onPress={markMiss}><Text style={styles.missBtnText}>I missed it</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{activeContracts.length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{completedCount}</Text><Text style={styles.statLabel}>Kept</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{(state.collectibles ?? []).length}</Text><Text style={styles.statLabel}>Drops</Text></View>
      </View>

      <Text style={styles.petText}>mascot pats: {pets}</Text>
      <TouchableOpacity onPress={() => router.push('/(tabs)/contracts')}><Text style={styles.link}>Open full Contracts board</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#CFE6F6' },
  content: { paddingHorizontal: 14, paddingBottom: 130, gap: 10 },

  hero: {
    marginTop: 8,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#83A9C1',
    overflow: 'hidden',
    backgroundColor: '#D5ECF7',
  },
  roomImage: { width: '100%', height: 620 },
  overlayTop: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(236,248,255,0.82)',
    borderRadius: 12,
    padding: 10,
  },
  title: { ...Typography.headlineMedium, color: '#2A4B66', fontFamily: 'Inter_700Bold' },
  subTitle: { ...Typography.bodySmall, color: '#476A85', fontFamily: 'Inter_400Regular' },

  mascotAnchor: {
    position: 'absolute',
    left: '50%',
    marginLeft: -66,
    top: 320,
  },
  mascotImage: { width: 132, height: 150 },

  sign: {
    position: 'absolute',
    width: 180,
    height: 70,
    left: '50%',
    marginLeft: -90,
    bottom: 80,
  },

  livePanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(233,246,255,0.85)',
    borderRadius: 12,
    padding: 8,
  },
  track: { height: 10, borderRadius: 999, backgroundColor: '#ABCADA', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#79E0B4' },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...Typography.labelSmall, flex: 1, color: '#355A72', fontFamily: 'Inter_600SemiBold' },
  timer: { ...Typography.labelSmall, color: '#2B4A61', fontFamily: 'Inter_700Bold' },

  card: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CADAE6',
    backgroundColor: '#F7FBFF',
    padding: 10,
  },
  cardTitle: { ...Typography.labelLarge, color: '#284761', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#B8CCDD',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#2A465D',
    paddingHorizontal: 10,
    paddingVertical: 10,
    ...Typography.bodySmall,
    fontFamily: 'Inter_400Regular',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#B8CCDD',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F6FCFF',
  },
  chipActive: { backgroundColor: '#85E6BE', borderColor: '#85E6BE' },
  chipText: { ...Typography.labelSmall, color: '#3D607A', fontFamily: 'Inter_600SemiBold' },
  chipTextActive: { color: '#144035' },

  primaryBtn: {
    marginLeft: 'auto',
    borderRadius: 999,
    backgroundColor: '#F7D6AB',
    borderWidth: 2,
    borderColor: '#8A5D43',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryBtnText: { ...Typography.labelMedium, color: '#4A2E1D', fontFamily: 'Inter_700Bold' },

  winBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#82E1B8',
    alignItems: 'center',
    paddingVertical: 11,
  },
  winBtnText: { ...Typography.labelLarge, color: '#163C31', fontFamily: 'Inter_700Bold' },
  missBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F2C1BE',
    alignItems: 'center',
    paddingVertical: 11,
  },
  missBtnText: { ...Typography.labelLarge, color: '#64312D', fontFamily: 'Inter_700Bold' },

  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D2DCE6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNum: { ...Typography.headlineLarge, color: '#264360', fontFamily: 'Inter_700Bold' },
  statLabel: { ...Typography.labelSmall, color: '#667F97', fontFamily: 'Inter_400Regular' },

  petText: { ...Typography.labelSmall, color: '#4B6D86', textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  link: { ...Typography.labelMedium, color: '#3F6380', textAlign: 'center', textDecorationLine: 'underline', fontFamily: 'Inter_600SemiBold' },
});
