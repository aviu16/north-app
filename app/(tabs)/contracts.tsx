import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { FutureContract } from '../../src/types';

const parseDateInput = (raw: string): Date | null => {
  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1;
  const d2 = new Date(raw.replace(' ', 'T'));
  if (!Number.isNaN(d2.getTime())) return d2;
  return null;
};

const statusTone: Record<FutureContract['status'], { bg: string; text: string; label: string }> = {
  active: { bg: '#E8F1FF', text: '#2E5FA9', label: 'Active' },
  awaiting_proof: { bg: '#FFF2DB', text: '#A0681E', label: 'Needs proof' },
  completed: { bg: '#E6F7EE', text: '#2C7A55', label: 'Completed' },
  failed: { bg: '#FBE8E6', text: '#A34E44', label: 'Missed' },
};

export default function ContractsScreen() {
  const insets = useSafeAreaInsets();
  const {
    state,
    addFutureContract,
    submitContractProof,
    markContractFailed,
    markContractAccountabilitySent,
    reactToContract,
  } = useApp();

  const [promise, setPromise] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [contactsInput, setContactsInput] = useState('');
  const [shareToCircle, setShareToCircle] = useState(true);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | undefined>();
  const [voiceDurationMs, setVoiceDurationMs] = useState<number | undefined>();

  const [proofTextById, setProofTextById] = useState<Record<string, string>>({});
  const [proofFileById, setProofFileById] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  const bob = useRef(new Animated.Value(0)).current;

  const contracts = useMemo(
    () => [...state.futureContracts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.futureContracts]
  );
  const activeOrAwaiting = contracts.filter((c) => c.status === 'active' || c.status === 'awaiting_proof');
  const nearestDeadlineMs = activeOrAwaiting.length
    ? Math.min(...activeOrAwaiting.map((c) => new Date(c.deadlineAt).getTime()))
    : null;

  const completedCount = contracts.filter((c) => c.status === 'completed').length;
  const level = Math.floor(completedCount / 3) + 1;
  const progress = ((completedCount % 3) / 3) * 100;
  const awaitingProofCount = contracts.filter((c) => c.status === 'awaiting_proof').length;
  const nearestHoursLeft =
    nearestDeadlineMs === null ? null : (nearestDeadlineMs - nowMs) / (1000 * 60 * 60);
  const mascotMood = awaitingProofCount > 0 ? 'panic' : nearestHoursLeft !== null && nearestHoursLeft < 6 ? 'active' : 'calm';
  const mascot = mascotMood === 'panic' ? '😵‍💫' : mascotMood === 'active' ? '🧵' : level >= 5 ? '🪡' : '🧶';

  const getLiveState = (contract: FutureContract): { label: string; tone: string } => {
    if (contract.status === 'completed') return { label: 'Kept', tone: '#2C7A55' };
    if (contract.status === 'failed') return { label: 'Missed', tone: '#A34E44' };
    if (contract.status === 'awaiting_proof') return { label: 'Proof overdue', tone: '#A0681E' };

    const ms = new Date(contract.deadlineAt).getTime() - nowMs;
    if (ms <= 0) return { label: 'Unlock now', tone: '#A0681E' };
    const hours = ms / (1000 * 60 * 60);
    if (hours < 2) return { label: 'Panic window', tone: '#B95A4D' };
    if (hours < 12) return { label: 'High pressure', tone: '#A0681E' };
    return { label: 'On track', tone: '#2E5FA9' };
  };

  const formatLiveCountdown = (deadlineAt: string) => {
    const ms = new Date(deadlineAt).getTime() - nowMs;
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 900, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startRecording = async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone required', 'Allow microphone to record your promise.');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const status = await recording.getStatusAsync();
    setVoiceUri(recording.getURI() || undefined);
    setVoiceDurationMs(status.durationMillis);
    setRecording(null);
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  };

  const createContract = () => {
    if (!promise.trim()) {
      Alert.alert('Missing promise', 'Write what you promise future-you.');
      return;
    }

    const parsed = parseDateInput(deadlineInput.trim());
    if (!parsed || parsed.getTime() <= Date.now() + 60000) {
      Alert.alert('Invalid deadline', 'Use format like 2026-02-25 18:00 and keep it in the future.');
      return;
    }

    const contacts = contactsInput
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((value) => ({
        id: `${Date.now()}-${value}`,
        name: value.includes('@') ? value.split('@')[0] : value,
        channel: value.includes('@') ? ('email' as const) : ('sms' as const),
        value,
      }));

    addFutureContract({
      promise: promise.trim(),
      deadlineAt: parsed.toISOString(),
      unlockAt: parsed.toISOString(),
      voiceUri,
      voiceDurationMs,
      accountabilityContacts: contacts,
      sharedToCircle: shareToCircle,
    });

    setPromise('');
    setDeadlineInput('');
    setContactsInput('');
    setVoiceUri(undefined);
    setVoiceDurationMs(undefined);
  };

  const attachProof = async (id: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    setProofFileById((prev) => ({ ...prev, [id]: result.assets[0].name }));
  };

  const submitProof = (contract: FutureContract) => {
    const proofText = (proofTextById[contract.id] || '').trim();
    const proofFileName = proofFileById[contract.id];
    if (!proofText && !proofFileName) {
      Alert.alert('Need proof', 'Add text or file before submitting.');
      return;
    }
    submitContractProof(contract.id, proofText, proofFileName);
  };

  const shareFailure = async (contract: FutureContract) => {
    markContractFailed(contract.id);
    const targets = contract.accountabilityContacts.length
      ? contract.accountabilityContacts.map((c) => c.value).join(', ')
      : 'accountability contacts';

    await Share.share({
      message: `I missed my North contract:\n\n"${contract.promise}"\n\nPlease hold me accountable. Send to: ${targets}`,
      url: contract.voiceUri,
    });

    markContractAccountabilitySent(contract.id);
  };

  const shareWinCard = async (contract: FutureContract) => {
    await Share.share({
      message: `✅ Promise kept in North\n\n"${contract.promise}"\n\nHeld myself accountable and shipped it.`,
    });
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Animated.Text style={[styles.heroMascot, { transform: [{ translateY: bob }] }]}>{mascot}</Animated.Text>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Promise Studio Board</Text>
            <Text style={styles.heroSub}>Level {level} • {completedCount} promises kept</Text>
            <Text style={styles.heroSub}>Circle members watching: {state.circles.reduce((sum, c) => sum + c.memberCount, 0)}</Text>
            <Text style={styles.heroSub}>
              Mascot state: {mascotMood === 'panic' ? 'Panic - submit proof now' : mascotMood === 'active' ? 'Knitting fast - deadlines approaching' : 'Calm and building'}
            </Text>
          </View>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
      </Card>

      <Card>
        <Text style={styles.blockTitle}>1) Create Voice Contract</Text>
        <TextInput style={styles.input} placeholder="By Friday I will ship X" placeholderTextColor="#8EAAC6" value={promise} onChangeText={setPromise} multiline />
        <TextInput style={styles.input} placeholder="Deadline (2026-02-25 18:00)" placeholderTextColor="#8EAAC6" value={deadlineInput} onChangeText={setDeadlineInput} />
        <TextInput style={styles.input} placeholder="Accountability contacts (comma-separated)" placeholderTextColor="#8EAAC6" value={contactsInput} onChangeText={setContactsInput} />

        <TouchableOpacity style={[styles.toggle, shareToCircle && styles.toggleActive]} onPress={() => setShareToCircle((v) => !v)}>
          <Text style={[styles.toggleText, shareToCircle && styles.toggleTextActive]}>
            {shareToCircle ? '✓ Posting to Inner Circle' : 'Post to Inner Circle'}
          </Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, recording && styles.btnDanger]} onPress={recording ? stopRecording : startRecording}>
            <Text style={styles.btnText}>{recording ? 'Stop recording' : 'Record future-self voice'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={createContract}>
            <Text style={styles.btnSecondaryText}>Create Contract</Text>
          </TouchableOpacity>
        </View>

        {voiceDurationMs ? <Text style={styles.meta}>Voice clip: {Math.round(voiceDurationMs / 1000)}s</Text> : null}
      </Card>

      <Text style={styles.sectionTitle}>2) Live Contract Feed</Text>
      {contracts.length === 0 ? (
        <Card><Text style={styles.meta}>No contracts yet.</Text></Card>
      ) : (
        contracts.map((contract) => {
          const tone = statusTone[contract.status];
          return (
            <Card key={contract.id} style={styles.contractCard}>
              <View style={styles.contractTop}>
                <Text style={styles.promise}>{contract.promise}</Text>
                <View style={[styles.badge, { backgroundColor: tone.bg }]}><Text style={[styles.badgeText, { color: tone.text }]}>{tone.label}</Text></View>
              </View>
              <Text style={styles.meta}>Deadline: {new Date(contract.deadlineAt).toLocaleString()}</Text>
              {(contract.status === 'active' || contract.status === 'awaiting_proof') && (
                <View style={styles.liveStateRow}>
                  <Text style={styles.liveTimer}>{formatLiveCountdown(contract.deadlineAt)}</Text>
                  <Text style={[styles.liveStateText, { color: getLiveState(contract).tone }]}>
                    {getLiveState(contract).label}
                  </Text>
                </View>
              )}

              {contract.sharedToCircle && contract.status !== 'completed' && (
                <View style={styles.reactionRow}>
                  {['🔥', '👏', '💪'].map((emoji) => {
                    const count = contract.socialReactions?.find((r) => r.emoji === emoji)?.count || 0;
                    return (
                      <TouchableOpacity key={emoji} style={styles.reactionChip} onPress={() => reactToContract(contract.id, emoji)}>
                        <Text style={styles.reactionText}>{emoji} {count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {contract.status === 'awaiting_proof' && (
                <View style={styles.proofWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Paste proof link or describe what you shipped"
                    value={proofTextById[contract.id] || ''}
                    onChangeText={(v) => setProofTextById((prev) => ({ ...prev, [contract.id]: v }))}
                    multiline
                  />

                  <View style={styles.row}>
                    <TouchableOpacity style={styles.btnGhost} onPress={() => attachProof(contract.id)}>
                      <Text style={styles.btnGhostText}>Attach file</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDone} onPress={() => submitProof(contract)}>
                      <Text style={styles.btnDoneText}>Submit proof</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.btnFail} onPress={() => shareFailure(contract)}>
                    <Text style={styles.btnFailText}>I failed - send accountability</Text>
                  </TouchableOpacity>
                </View>
              )}

              {contract.status === 'completed' && (
                <TouchableOpacity style={styles.winBtn} onPress={() => shareWinCard(contract)}>
                  <Text style={styles.winBtnText}>Share Win Card</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECF4FB' },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 130, gap: Spacing.md },
  hero: { marginTop: Spacing.md, backgroundColor: '#1E466A', borderColor: '#4E7697', borderWidth: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroMascot: { fontSize: 38 },
  heroTextWrap: { flex: 1 },
  heroTitle: { ...Typography.headlineSmall, color: '#EEF5FF', fontFamily: 'Inter_700Bold' },
  heroSub: { ...Typography.bodySmall, color: '#D8E9FB', fontFamily: 'Inter_400Regular' },
  track: { marginTop: Spacing.sm, height: 10, borderRadius: 999, backgroundColor: '#5C7E9A', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#88E9C2' },
  blockTitle: { ...Typography.headlineSmall, color: '#1C2B40', fontFamily: 'Inter_700Bold', marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: '#BFD2E5',
    backgroundColor: '#F8FCFF',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodySmall,
    color: '#17324D',
    marginBottom: Spacing.sm,
    fontFamily: 'Inter_400Regular',
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#D2DAE6',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  toggleActive: {
    backgroundColor: '#EAF3FF',
    borderColor: '#8EB4EA',
  },
  toggleText: {
    ...Typography.labelSmall,
    color: '#5A6E8C',
    fontFamily: 'Inter_600SemiBold',
  },
  toggleTextActive: {
    color: '#2E5FA9',
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  btn: { flex: 1, backgroundColor: '#2C6899', borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center' },
  btnDanger: { backgroundColor: '#BC4E4E' },
  btnText: { ...Typography.labelMedium, color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
  btnSecondary: { paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: '#88E9C2', justifyContent: 'center' },
  btnSecondaryText: { ...Typography.labelMedium, color: '#124536', fontFamily: 'Inter_700Bold' },
  sectionTitle: { ...Typography.headlineSmall, color: '#1C2B40', fontFamily: 'Inter_700Bold' },
  contractCard: { backgroundColor: '#FFFFFF' },
  contractTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  promise: { ...Typography.labelLarge, color: '#1B2B40', fontFamily: 'Inter_700Bold', flex: 1 },
  badge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  badgeText: { ...Typography.labelSmall, fontFamily: 'Inter_700Bold' },
  meta: { ...Typography.labelSmall, color: '#6B7890', marginTop: 4, fontFamily: 'Inter_400Regular' },
  liveStateRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTimer: {
    ...Typography.labelMedium,
    color: '#19335A',
    fontFamily: 'Inter_700Bold',
  },
  liveStateText: {
    ...Typography.labelSmall,
    fontFamily: 'Inter_700Bold',
  },
  reactionRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  reactionChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: BorderRadius.xl, backgroundColor: '#EEF4FF', borderWidth: 1, borderColor: '#D6E2F7' },
  reactionText: { ...Typography.labelSmall, color: '#355B91', fontFamily: 'Inter_600SemiBold' },
  proofWrap: { marginTop: Spacing.sm },
  btnGhost: { flex: 1, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#D2DAE6', alignItems: 'center', paddingVertical: Spacing.sm },
  btnGhostText: { ...Typography.labelSmall, color: '#4E5F78', fontFamily: 'Inter_600SemiBold' },
  btnDone: { flex: 1, borderRadius: BorderRadius.md, backgroundColor: '#2F9367', alignItems: 'center', paddingVertical: Spacing.sm },
  btnDoneText: { ...Typography.labelSmall, color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
  btnFail: { marginTop: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: '#FBE8E6', borderWidth: 1, borderColor: '#E5B7B1', alignItems: 'center', paddingVertical: Spacing.sm },
  btnFailText: { ...Typography.labelSmall, color: '#9E4D44', fontFamily: 'Inter_700Bold' },
  winBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: '#E6F7EE', borderWidth: 1, borderColor: '#BFE3CF', alignItems: 'center', paddingVertical: Spacing.sm },
  winBtnText: { ...Typography.labelSmall, color: '#2C7A55', fontFamily: 'Inter_700Bold' },
});
