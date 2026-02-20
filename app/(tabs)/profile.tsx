import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { Card, Avatar, Divider, ProBadge } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { useSubscription } from '../../src/hooks/useSubscription';
import { hapticLight, hapticMedium } from '../../src/utils/helpers';

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  value,
  onPress,
  isToggle,
  toggleValue,
  onToggle,
  danger,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={isToggle || !onPress}
    activeOpacity={0.6}
  >
    <View style={styles.settingLeft}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
    </View>
    {isToggle && onToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ false: Colors.backgroundTertiary, true: Colors.primaryMuted }}
        thumbColor={toggleValue ? Colors.primary : Colors.textMuted}
      />
    ) : value ? (
      <Text style={styles.settingValue}>{value}</Text>
    ) : (
      <Text style={styles.chevron}>›</Text>
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { isPro } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalEntries = state.journalEntries.length;
  const totalWords = state.journalEntries.reduce((sum, e) => sum + e.wordCount, 0);
  const totalChats = state.chatMessages.length;

  const handleClearJournal = () => {
    Alert.alert(
      'Clear Journal',
      'This will delete all your journal entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            hapticMedium();
            dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: [] });
          },
        },
      ]
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'This will delete all your conversations with North.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            hapticMedium();
            dispatch({ type: 'CLEAR_CHAT_MESSAGES' });
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete ALL data and reset the app to its initial state. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            hapticMedium();
            const keys = await AsyncStorage.getAllKeys();
            const northKeys = keys.filter((k) => k.startsWith('north_'));
            await AsyncStorage.multiRemove(northKeys);
            dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: [] });
            dispatch({ type: 'CLEAR_CHAT_MESSAGES' });
            dispatch({ type: 'SET_SUGGESTED_ACTIONS', payload: [] });
            dispatch({ type: 'SET_ONBOARDED', payload: false });
            dispatch({ type: 'SET_USER', payload: null });
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar name={state.user?.name || 'User'} size={64} />
        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{state.user?.name || 'User'}</Text>
          {isPro && <ProBadge size="md" />}
        </View>
        <Text style={styles.profileJoined}>
          On this journey since {new Date(state.user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalWords.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalChats}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>
      </Card>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Card style={styles.settingsCard} padding="xs">
          <SettingItem
            icon={isPro ? '⭐' : '🧭'}
            label={isPro ? 'North Pro' : 'Free Plan'}
            value={isPro ? 'Active' : 'Upgrade'}
            onPress={isPro ? undefined : () => router.push('/paywall')}
          />
        </Card>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingsCard} padding="xs">
          <SettingItem
            icon="🔔"
            label="Notifications"
            isToggle
            toggleValue={state.user?.preferences.notifications ?? true}
            onToggle={(value) => {
              hapticLight();
              if (state.user) {
                dispatch({
                  type: 'SET_USER',
                  payload: {
                    ...state.user,
                    preferences: { ...state.user.preferences, notifications: value },
                  },
                });
              }
            }}
          />
          <Divider spacing={0} />
          <SettingItem
            icon="📳"
            label="Haptic Feedback"
            isToggle
            toggleValue={state.user?.preferences.haptics ?? true}
            onToggle={(value) => {
              hapticLight();
              if (state.user) {
                dispatch({
                  type: 'SET_USER',
                  payload: {
                    ...state.user,
                    preferences: { ...state.user.preferences, haptics: value },
                  },
                });
              }
            }}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Settings</Text>
        <Card style={styles.settingsCard} padding="xs">
          <SettingItem
            icon="🤖"
            label="AI Model"
            value="Claude Sonnet"
          />
          <Divider spacing={0} />
          <SettingItem
            icon="🔑"
            label="API Key"
            value="Configure"
            onPress={() => {
              Alert.alert(
                'API Key',
                'To use the AI Guide, add your Claude API key in src/constants/config.ts'
              );
            }}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Card style={styles.settingsCard} padding="xs">
          <SettingItem
            icon="📝"
            label="Clear Journal Entries"
            onPress={handleClearJournal}
          />
          <Divider spacing={0} />
          <SettingItem
            icon="💬"
            label="Clear Chat History"
            onPress={handleClearChat}
          />
          <Divider spacing={0} />
          <SettingItem
            icon="⚠️"
            label="Reset App"
            onPress={handleResetApp}
            danger
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>North v1.0.0</Text>
        <Text style={styles.footerSub}>Find your direction.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 140,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  profileName: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  profileJoined: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  statsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  settingValue: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  dangerText: {
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  footerText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  footerSub: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
});
