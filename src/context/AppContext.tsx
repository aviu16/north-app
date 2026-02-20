import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, JournalEntry, ChatMessage, SuggestedAction, Connection, SubscriptionTier, SubscriptionPeriod, FREE_TIER_LIMITS, DailyCheckIn, StreakData, CachedInsight, InsightPattern, MoodType, RewardState, FutureContract, FocusGameState, SocialCircle, Collectible, FriendRoom, RoomCondition } from '../types';
import * as Crypto from 'expo-crypto';
import { isToday } from 'date-fns';
import { initPurchases, checkProStatus } from '../services/purchases';

interface AppState {
  user: User | null;
  journalEntries: JournalEntry[];
  chatMessages: ChatMessage[];
  suggestedActions: SuggestedAction[];
  connections: Connection[];
  isLoading: boolean;
  isOnboarded: boolean;
  streakData: StreakData;
  dailyCheckIns: DailyCheckIn[];
  cachedInsight: CachedInsight | null;
  insightPatterns: InsightPattern[];
  rewards: RewardState;
  futureContracts: FutureContract[];
  focusGame: FocusGameState;
  circles: SocialCircle[];
  collectibles: Collectible[];
  friendRooms: FriendRoom[];
  roomCondition: RoomCondition;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONBOARDED'; payload: boolean }
  | { type: 'ADD_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'UPDATE_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'DELETE_JOURNAL_ENTRY'; payload: string }
  | { type: 'SET_JOURNAL_ENTRIES'; payload: JournalEntry[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_CHAT_MESSAGES' }
  | { type: 'SET_SUGGESTED_ACTIONS'; payload: SuggestedAction[] }
  | { type: 'TOGGLE_ACTION_COMPLETE'; payload: string }
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'UPDATE_CONNECTION'; payload: Connection }
  | { type: 'SET_SUBSCRIPTION'; payload: { tier: SubscriptionTier; period?: SubscriptionPeriod } }
  | { type: 'INCREMENT_AI_USAGE' }
  | { type: 'RESET_DAILY_USAGE' }
  | { type: 'SET_STREAK_DATA'; payload: StreakData }
  | { type: 'ADD_DAILY_CHECKIN'; payload: DailyCheckIn }
  | { type: 'SET_DAILY_CHECKINS'; payload: DailyCheckIn[] }
  | { type: 'SET_CACHED_INSIGHT'; payload: CachedInsight | null }
  | { type: 'SET_INSIGHT_PATTERNS'; payload: InsightPattern[] }
  | { type: 'SET_REWARDS'; payload: RewardState }
  | { type: 'COMPLETE_ACTION'; payload: string }
  | { type: 'SET_FUTURE_CONTRACTS'; payload: FutureContract[] }
  | { type: 'ADD_FUTURE_CONTRACT'; payload: FutureContract }
  | { type: 'UPDATE_FUTURE_CONTRACT'; payload: FutureContract }
  | { type: 'SET_FOCUS_GAME'; payload: FocusGameState }
  | { type: 'RECORD_FOCUS_SESSION'; payload: { minutes: number; completed: boolean } }
  | { type: 'REACT_TO_CONTRACT'; payload: { id: string; emoji: string } }
  | { type: 'SET_COLLECTIBLES'; payload: Collectible[] }
  | { type: 'ADD_COLLECTIBLE'; payload: Collectible }
  | { type: 'SET_FRIEND_ROOMS'; payload: FriendRoom[] }
  | { type: 'SET_ROOM_CONDITION'; payload: RoomCondition };

const defaultStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastEntryDate: '',
  weeklyGoal: 5,
  entriesThisWeek: 0,
  milestones: [],
};

const defaultFriendRooms: FriendRoom[] = [
  {
    id: 'friend-1',
    name: 'Orbit Buddy',
    mascot: '🦊',
    level: 5,
    theme: 'Moon Study',
    lastUpdate: new Date().toISOString(),
    reactionSummary: 'kept 2 promises today',
  },
  {
    id: 'friend-2',
    name: 'Pixel Crew',
    mascot: '🧵',
    level: 3,
    theme: 'Builder Loft',
    lastUpdate: new Date().toISOString(),
    reactionSummary: 'started a new challenge',
  },
];

const initialState: AppState = {
  user: null,
  journalEntries: [],
  chatMessages: [],
  suggestedActions: [],
  connections: [
    {
      id: 'notion',
      type: 'notion',
      name: 'Notion',
      isConnected: false,
      status: 'disconnected',
    },
    {
      id: 'gmail',
      type: 'gmail',
      name: 'Gmail',
      isConnected: false,
      status: 'coming_soon',
    },
    {
      id: 'apple_notes',
      type: 'apple_notes',
      name: 'Apple Notes',
      isConnected: false,
      status: 'coming_soon',
    },
    {
      id: 'obsidian',
      type: 'obsidian',
      name: 'Obsidian',
      isConnected: false,
      status: 'coming_soon',
    },
  ],
  isLoading: true,
  isOnboarded: false,
  streakData: defaultStreakData,
  dailyCheckIns: [],
  cachedInsight: null,
  insightPatterns: [],
  rewards: {
    xp: 0,
    level: 1,
    hearts: 0,
    unlockedCompanions: ['Sprout'],
    currentCompanion: 'Sprout',
  },
  futureContracts: [],
  focusGame: {
    mascotName: 'Nova',
    worldName: 'North Star Workshop',
    starsBuilt: 0,
    workshopLevel: 1,
    successfulSessions: 0,
    failedSessions: 0,
    currentFocusStreak: 0,
    longestFocusStreak: 0,
    totalFocusedMinutes: 0,
  },
  circles: [
    { id: 'inner-circle', name: 'Inner Circle', memberCount: 8, weeklyKeeps: 0 },
    { id: 'builders', name: 'Builders', memberCount: 23, weeklyKeeps: 0 },
  ],
  collectibles: [],
  friendRooms: defaultFriendRooms,
  roomCondition: 'steady',
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: action.payload };
    case 'ADD_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: [action.payload, ...state.journalEntries],
      };
    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.filter((e) => e.id !== action.payload),
      };
    case 'SET_JOURNAL_ENTRIES':
      return { ...state, journalEntries: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    case 'CLEAR_CHAT_MESSAGES':
      return { ...state, chatMessages: [] };
    case 'SET_SUGGESTED_ACTIONS':
      return { ...state, suggestedActions: action.payload };
    case 'TOGGLE_ACTION_COMPLETE':
      return {
        ...state,
        suggestedActions: state.suggestedActions.map((a) =>
          a.id === action.payload ? { ...a, isCompleted: !a.isCompleted } : a
        ),
      };
    case 'COMPLETE_ACTION':
      return {
        ...state,
        suggestedActions: state.suggestedActions.map((a) =>
          a.id === action.payload ? { ...a, isCompleted: true } : a
        ),
      };
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'SET_SUBSCRIPTION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          subscription: {
            tier: action.payload.tier,
            period: action.payload.period,
            startedAt: action.payload.tier === 'pro' ? new Date().toISOString() : undefined,
            expiresAt: undefined,
          },
        },
      };
    case 'INCREMENT_AI_USAGE':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          usage: {
            ...state.user.usage,
            aiMessagesUsedToday: state.user.usage.aiMessagesUsedToday + 1,
          },
        },
      };
    case 'RESET_DAILY_USAGE':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          usage: {
            aiMessagesUsedToday: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          },
        },
      };
    case 'SET_STREAK_DATA':
      return { ...state, streakData: action.payload };
    case 'ADD_DAILY_CHECKIN':
      return {
        ...state,
        dailyCheckIns: [action.payload, ...state.dailyCheckIns],
      };
    case 'SET_DAILY_CHECKINS':
      return { ...state, dailyCheckIns: action.payload };
    case 'SET_CACHED_INSIGHT':
      return { ...state, cachedInsight: action.payload };
    case 'SET_INSIGHT_PATTERNS':
      return { ...state, insightPatterns: action.payload };
    case 'SET_REWARDS':
      return { ...state, rewards: action.payload };
    case 'SET_FUTURE_CONTRACTS':
      return { ...state, futureContracts: action.payload };
    case 'ADD_FUTURE_CONTRACT':
      return { ...state, futureContracts: [action.payload, ...state.futureContracts] };
    case 'UPDATE_FUTURE_CONTRACT':
      return {
        ...state,
        futureContracts: state.futureContracts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'SET_FOCUS_GAME':
      return { ...state, focusGame: action.payload };
    case 'RECORD_FOCUS_SESSION': {
      const { minutes, completed } = action.payload;
      const totalFocusedMinutes = state.focusGame.totalFocusedMinutes + (completed ? minutes : 0);
      const starsBuilt = state.focusGame.starsBuilt + (completed ? Math.max(1, Math.floor(minutes / 10)) : 0);
      const successfulSessions = state.focusGame.successfulSessions + (completed ? 1 : 0);
      const failedSessions = state.focusGame.failedSessions + (completed ? 0 : 1);
      const currentFocusStreak = completed ? state.focusGame.currentFocusStreak + 1 : 0;
      const longestFocusStreak = Math.max(state.focusGame.longestFocusStreak, currentFocusStreak);
      const workshopLevel = Math.max(1, Math.floor(starsBuilt / 8) + 1);

      return {
        ...state,
        focusGame: {
          ...state.focusGame,
          starsBuilt,
          workshopLevel,
          successfulSessions,
          failedSessions,
          currentFocusStreak,
          longestFocusStreak,
          totalFocusedMinutes,
          lastSessionAt: new Date().toISOString(),
        },
      };
    }
    case 'REACT_TO_CONTRACT':
      return {
        ...state,
        futureContracts: state.futureContracts.map((contract) => {
          if (contract.id !== action.payload.id) return contract;
          const current = contract.socialReactions || [];
          const idx = current.findIndex((r) => r.emoji === action.payload.emoji);
          if (idx === -1) {
            return { ...contract, socialReactions: [...current, { emoji: action.payload.emoji, count: 1 }] };
          }
          const next = [...current];
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
          return { ...contract, socialReactions: next };
        }),
      };
    case 'SET_COLLECTIBLES':
      return { ...state, collectibles: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_COLLECTIBLE':
      return { ...state, collectibles: [action.payload, ...state.collectibles] };
    case 'SET_FRIEND_ROOMS':
      return { ...state, friendRooms: Array.isArray(action.payload) ? action.payload : defaultFriendRooms };
    case 'SET_ROOM_CONDITION':
      return {
        ...state,
        roomCondition:
          action.payload === 'steady' || action.payload === 'thriving' || action.payload === 'cracked'
            ? action.payload
            : 'steady',
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addJournalEntry: (title: string, content: string, mood?: string) => JournalEntry;
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChat: () => void;
  completeOnboarding: (name: string) => void;
  isPro: () => boolean;
  canSendAIMessage: () => boolean;
  getRemainingMessages: () => number;
  upgradeToPro: (period: SubscriptionPeriod) => void;
  addDailyCheckIn: (mood: MoodType, note: string) => void;
  getTodaysCheckIn: () => DailyCheckIn | null;
  completeSuggestedAction: (id: string) => void;
  addFutureContract: (contract: Omit<FutureContract, 'id' | 'createdAt' | 'status'>) => FutureContract;
  submitContractProof: (id: string, proofText: string, proofFileName?: string) => void;
  refreshContractStatuses: () => void;
  markContractFailed: (id: string) => void;
  markContractAccountabilitySent: (id: string) => void;
  recordFocusSession: (minutes: number, completed: boolean) => void;
  reactToContract: (id: string, emoji: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadPersistedData();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      persistData();
    }
  }, [state.journalEntries, state.chatMessages, state.suggestedActions, state.isOnboarded, state.user, state.dailyCheckIns, state.streakData, state.cachedInsight, state.rewards, state.futureContracts, state.focusGame, state.collectibles, state.friendRooms, state.roomCondition]);

  const loadPersistedData = async () => {
    try {
      const [entries, messages, actions, onboarded, user, checkIns, streakData, cachedInsight, rewards, futureContracts, focusGame, collectibles, friendRooms, roomCondition] = await Promise.all([
        AsyncStorage.getItem('north_journal_entries'),
        AsyncStorage.getItem('north_chat_messages'),
        AsyncStorage.getItem('north_suggested_actions'),
        AsyncStorage.getItem('north_is_onboarded'),
        AsyncStorage.getItem('north_user'),
        AsyncStorage.getItem('north_daily_checkins'),
        AsyncStorage.getItem('north_streak_data'),
        AsyncStorage.getItem('north_cached_insight'),
        AsyncStorage.getItem('north_rewards'),
        AsyncStorage.getItem('north_future_contracts'),
        AsyncStorage.getItem('north_focus_game'),
        AsyncStorage.getItem('north_collectibles'),
        AsyncStorage.getItem('north_friend_rooms'),
        AsyncStorage.getItem('north_room_condition'),
      ]);

      if (entries) dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: JSON.parse(entries) });
      if (messages) dispatch({ type: 'SET_CHAT_MESSAGES', payload: JSON.parse(messages) });
      if (actions) dispatch({ type: 'SET_SUGGESTED_ACTIONS', payload: JSON.parse(actions) });
      if (onboarded === 'true') dispatch({ type: 'SET_ONBOARDED', payload: true });
      if (user) dispatch({ type: 'SET_USER', payload: JSON.parse(user) });
      if (checkIns) dispatch({ type: 'SET_DAILY_CHECKINS', payload: JSON.parse(checkIns) });
      if (streakData) dispatch({ type: 'SET_STREAK_DATA', payload: JSON.parse(streakData) });
      if (cachedInsight) dispatch({ type: 'SET_CACHED_INSIGHT', payload: JSON.parse(cachedInsight) });
      if (rewards) dispatch({ type: 'SET_REWARDS', payload: JSON.parse(rewards) });
      if (futureContracts) dispatch({ type: 'SET_FUTURE_CONTRACTS', payload: JSON.parse(futureContracts) });
      if (focusGame) dispatch({ type: 'SET_FOCUS_GAME', payload: JSON.parse(focusGame) });
      if (collectibles) {
        const parsed = JSON.parse(collectibles);
        dispatch({ type: 'SET_COLLECTIBLES', payload: Array.isArray(parsed) ? parsed : [] });
      } else {
        dispatch({ type: 'SET_COLLECTIBLES', payload: [] });
      }
      if (friendRooms) {
        const parsed = JSON.parse(friendRooms);
        const migrated =
          Array.isArray(parsed)
            ? parsed.map((room) => {
                if (room?.id === 'friend-1') return { ...room, name: 'Orbit Buddy' };
                if (room?.id === 'friend-2') return { ...room, name: 'Pixel Crew' };
                return room;
              })
            : defaultFriendRooms;
        dispatch({
          type: 'SET_FRIEND_ROOMS',
          payload: Array.isArray(migrated) && migrated.length > 0 ? migrated : defaultFriendRooms,
        });
      } else {
        dispatch({ type: 'SET_FRIEND_ROOMS', payload: defaultFriendRooms });
      }
      if (roomCondition) {
        const parsed = JSON.parse(roomCondition);
        dispatch({
          type: 'SET_ROOM_CONDITION',
          payload: parsed === 'steady' || parsed === 'thriving' || parsed === 'cracked' ? parsed : 'steady',
        });
      } else {
        dispatch({ type: 'SET_ROOM_CONDITION', payload: 'steady' });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const persistData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('north_journal_entries', JSON.stringify(state.journalEntries)),
        AsyncStorage.setItem('north_chat_messages', JSON.stringify(state.chatMessages)),
        AsyncStorage.setItem('north_suggested_actions', JSON.stringify(state.suggestedActions)),
        AsyncStorage.setItem('north_is_onboarded', state.isOnboarded.toString()),
        state.user
          ? AsyncStorage.setItem('north_user', JSON.stringify(state.user))
          : AsyncStorage.removeItem('north_user'),
        AsyncStorage.setItem('north_daily_checkins', JSON.stringify(state.dailyCheckIns)),
        AsyncStorage.setItem('north_streak_data', JSON.stringify(state.streakData)),
        state.cachedInsight
          ? AsyncStorage.setItem('north_cached_insight', JSON.stringify(state.cachedInsight))
          : AsyncStorage.removeItem('north_cached_insight'),
        AsyncStorage.setItem('north_rewards', JSON.stringify(state.rewards)),
        AsyncStorage.setItem('north_future_contracts', JSON.stringify(state.futureContracts)),
        AsyncStorage.setItem('north_focus_game', JSON.stringify(state.focusGame)),
        AsyncStorage.setItem('north_collectibles', JSON.stringify(state.collectibles ?? [])),
        AsyncStorage.setItem('north_friend_rooms', JSON.stringify(state.friendRooms ?? defaultFriendRooms)),
        AsyncStorage.setItem('north_room_condition', JSON.stringify(state.roomCondition ?? 'steady')),
      ]);
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  };

  const addJournalEntry = (title: string, content: string, mood?: string): JournalEntry => {
    const entry: JournalEntry = {
      id: Crypto.randomUUID(),
      title,
      content,
      mood: mood as any,
      tags: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: content.split(/\s+/).filter(Boolean).length,
      source: 'north',
    };
    dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: entry });
    awardRewards(8);
    return entry;
  };

  const updateJournalEntry = (entry: JournalEntry) => {
    const updated = {
      ...entry,
      updatedAt: new Date().toISOString(),
      wordCount: entry.content.split(/\s+/).filter(Boolean).length,
    };
    dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: updated });
  };

  const deleteJournalEntry = (id: string) => {
    dispatch({ type: 'DELETE_JOURNAL_ENTRY', payload: id });
  };

  const addChatMessage = (role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: Crypto.randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
  };

  const clearChat = () => {
    dispatch({ type: 'CLEAR_CHAT_MESSAGES' });
  };

  const completeOnboarding = (name: string) => {
    const user: User = {
      id: Crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      preferences: {
        notifications: true,
        haptics: true,
        theme: 'light',
      },
      subscription: {
        tier: 'free',
      },
      usage: {
        aiMessagesUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      },
    };
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_ONBOARDED', payload: true });
  };

  const checkAndResetDailyUsage = () => {
    if (!state.user) return;
    const today = new Date().toISOString().split('T')[0];
    if (state.user.usage?.lastResetDate !== today) {
      dispatch({ type: 'RESET_DAILY_USAGE' });
    }
  };

  useEffect(() => {
    if (state.user && !state.isLoading) {
      checkAndResetDailyUsage();
    }
  }, [state.user?.id, state.isLoading]);

  // Migrate existing users missing subscription/usage fields
  useEffect(() => {
    if (state.user && !state.isLoading && !state.user.subscription) {
      dispatch({
        type: 'SET_USER',
        payload: {
          ...state.user,
          subscription: { tier: 'free' },
          usage: {
            aiMessagesUsedToday: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          },
        },
      });
    }
  }, [state.user?.id, state.isLoading]);

  // Sync RevenueCat pro status on app launch
  useEffect(() => {
    if (state.user && !state.isLoading) {
      const syncProStatus = async () => {
        const ready = await initPurchases();
        if (ready) {
          const proStatus = await checkProStatus();
          if (proStatus && state.user?.subscription?.tier !== 'pro') {
            dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: 'pro' } });
          }
        }
      };
      syncProStatus();
    }
  }, [state.user?.id, state.isLoading]);

  const isPro = (): boolean => {
    return state.user?.subscription?.tier === 'pro';
  };

  const canSendAIMessage = (): boolean => {
    if (isPro()) return true;
    if (!state.user?.usage) return true;
    return state.user.usage.aiMessagesUsedToday < FREE_TIER_LIMITS.aiMessagesPerDay;
  };

  const getRemainingMessages = (): number => {
    if (isPro()) return Infinity;
    if (!state.user?.usage) return FREE_TIER_LIMITS.aiMessagesPerDay;
    return Math.max(0, FREE_TIER_LIMITS.aiMessagesPerDay - state.user.usage.aiMessagesUsedToday);
  };

  const upgradeToPro = (period: SubscriptionPeriod) => {
    dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: 'pro', period } });
  };

  const addDailyCheckIn = (mood: MoodType, note: string) => {
    const checkIn: DailyCheckIn = {
      id: Crypto.randomUUID(),
      mood,
      note,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_DAILY_CHECKIN', payload: checkIn });

    // Also create a mini journal entry
    const moodLabel = mood.charAt(0).toUpperCase() + mood.slice(1);
    addJournalEntry(
      `Check-in: ${moodLabel}`,
      note || `Feeling ${mood} today.`,
      mood
    );
  };

  const getTodaysCheckIn = (): DailyCheckIn | null => {
    return state.dailyCheckIns.find((c) => isToday(new Date(c.createdAt))) || null;
  };

  const awardRewards = (xpGained: number) => {
    const totalXp = state.rewards.xp + xpGained;
    const nextLevel = Math.max(1, Math.floor(totalXp / 120) + 1);
    const nextHearts = state.rewards.hearts + Math.max(1, Math.floor(xpGained / 8));

    const unlocked = new Set(state.rewards.unlockedCompanions);
    if (nextLevel >= 2) unlocked.add('Bunny');
    if (nextLevel >= 4) unlocked.add('Fox');
    if (nextLevel >= 6) unlocked.add('Star Bear');

    dispatch({
      type: 'SET_REWARDS',
      payload: {
        ...state.rewards,
        xp: totalXp,
        level: nextLevel,
        hearts: nextHearts,
        unlockedCompanions: Array.from(unlocked),
      },
    });
  };

  const dropCollectible = (luckBoost: number = 0) => {
    const roll = Math.random() + luckBoost;
    const rarity = roll > 1.25 ? 'legendary' : roll > 0.85 ? 'rare' : 'common';
    const pool =
      rarity === 'legendary'
        ? [{ name: 'Aurora Window', emoji: '🪟' }, { name: 'Golden Loom', emoji: '🧵' }]
        : rarity === 'rare'
          ? [{ name: 'Cozy Lamp', emoji: '🛋️' }, { name: 'Mint Plant', emoji: '🪴' }]
          : [{ name: 'Wood Shelf', emoji: '🪵' }, { name: 'Wall Sticker', emoji: '⭐' }];

    const pick = pool[Math.floor(Math.random() * pool.length)];
    dispatch({
      type: 'ADD_COLLECTIBLE',
      payload: {
        id: Crypto.randomUUID(),
        name: pick.name,
        emoji: pick.emoji,
        rarity,
        unlockedAt: new Date().toISOString(),
      },
    });
  };

  const completeSuggestedAction = (id: string) => {
    const action = state.suggestedActions.find((a) => a.id === id);
    if (!action || action.isCompleted) return;
    dispatch({ type: 'COMPLETE_ACTION', payload: id });
    awardRewards(18);
  };

  const recordFocusSession = (minutes: number, completed: boolean) => {
    dispatch({ type: 'RECORD_FOCUS_SESSION', payload: { minutes, completed } });
    if (completed) {
      awardRewards(Math.max(10, Math.floor(minutes * 0.9)));
    }
  };

  const addFutureContract = (
    contract: Omit<FutureContract, 'id' | 'createdAt' | 'status'>
  ): FutureContract => {
    const created: FutureContract = {
      ...contract,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'active',
      socialReactions: contract.sharedToCircle ? [{ emoji: '🔥', count: 2 }, { emoji: '👏', count: 1 }] : [],
      accountabilityPings: 0,
    };
    dispatch({ type: 'ADD_FUTURE_CONTRACT', payload: created });
    if (state.roomCondition === 'cracked') {
      dispatch({ type: 'SET_ROOM_CONDITION', payload: 'steady' });
    }
    awardRewards(24);
    return created;
  };

  const submitContractProof = (id: string, proofText: string, proofFileName?: string) => {
    const contract = state.futureContracts.find((c) => c.id === id);
    if (!contract) return;
    dispatch({
      type: 'UPDATE_FUTURE_CONTRACT',
      payload: {
        ...contract,
        status: 'completed',
        proofText,
        proofFileName,
        proofSubmittedAt: new Date().toISOString(),
      },
    });
    awardRewards(40);
    dropCollectible(0.25);
    dispatch({ type: 'SET_ROOM_CONDITION', payload: 'thriving' });
  };

  const markContractFailed = (id: string) => {
    const contract = state.futureContracts.find((c) => c.id === id);
    if (!contract) return;
    dispatch({
      type: 'UPDATE_FUTURE_CONTRACT',
      payload: { ...contract, status: 'failed' },
    });
    dispatch({ type: 'SET_ROOM_CONDITION', payload: 'cracked' });
  };

  const markContractAccountabilitySent = (id: string) => {
    const contract = state.futureContracts.find((c) => c.id === id);
    if (!contract) return;
    dispatch({
      type: 'UPDATE_FUTURE_CONTRACT',
      payload: {
        ...contract,
        accountabilitySentAt: new Date().toISOString(),
        accountabilityPings: (contract.accountabilityPings || 0) + 1,
      },
    });
  };

  const reactToContract = (id: string, emoji: string) => {
    dispatch({ type: 'REACT_TO_CONTRACT', payload: { id, emoji } });
  };

  const refreshContractStatuses = () => {
    const now = Date.now();
    state.futureContracts.forEach((contract) => {
      if (contract.status !== 'active') return;
      const unlockAt = new Date(contract.unlockAt).getTime();
      if (unlockAt <= now) {
        dispatch({
          type: 'UPDATE_FUTURE_CONTRACT',
          payload: { ...contract, status: 'awaiting_proof' },
        });
      }
    });
  };

  useEffect(() => {
    if (state.isLoading) return;
    refreshContractStatuses();
    const timer = setInterval(refreshContractStatuses, 60 * 1000);
    return () => clearInterval(timer);
  }, [state.isLoading, state.futureContracts.length]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addChatMessage,
        clearChat,
        completeOnboarding,
        isPro,
        canSendAIMessage,
        getRemainingMessages,
        upgradeToPro,
        addDailyCheckIn,
        getTodaysCheckIn,
        completeSuggestedAction,
        addFutureContract,
        submitContractProof,
        refreshContractStatuses,
        markContractFailed,
        markContractAccountabilitySent,
        recordFocusSession,
        reactToContract,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
