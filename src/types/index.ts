export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  period?: SubscriptionPeriod;
  startedAt?: string;
  expiresAt?: string;
}

export interface UsageTracker {
  aiMessagesUsedToday: number;
  lastResetDate: string;
}

export const FREE_TIER_LIMITS = {
  aiMessagesPerDay: 10,
};

export const PRICING = {
  monthly: 9.99,
  yearly: 79.99,
};

export interface User {
  id: string;
  name: string;
  createdAt: string;
  preferences: UserPreferences;
  subscription: SubscriptionInfo;
  usage: UsageTracker;
}

export interface UserPreferences {
  notifications: boolean;
  haptics: boolean;
  theme: 'light';
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: MoodType;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  source: SourceType;
}

export type MoodType = 'amazing' | 'good' | 'neutral' | 'low' | 'terrible';

export const MoodEmoji: Record<MoodType, string> = {
  amazing: '✨',
  good: '😊',
  neutral: '😐',
  low: '😔',
  terrible: '💔',
};

export const MoodLabels: Record<MoodType, string> = {
  amazing: 'Amazing',
  good: 'Good',
  neutral: 'Neutral',
  low: 'Low',
  terrible: 'Rough',
};

export const MoodColors: Record<MoodType, string> = {
  amazing: '#C4A265',
  good: '#6B8F71',
  neutral: '#9B8EC4',
  low: '#D4856A',
  terrible: '#B86D52',
};

export type SourceType = 'north' | 'notion' | 'gmail' | 'apple_notes' | 'obsidian';

export const SourceLabels: Record<SourceType, string> = {
  north: 'North',
  notion: 'Notion',
  gmail: 'Gmail',
  apple_notes: 'Notes',
  obsidian: 'Obsidian',
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  type: SourceType;
  name: string;
  isConnected: boolean;
  lastSynced?: string;
  itemCount?: number;
  status: 'connected' | 'disconnected' | 'syncing' | 'coming_soon';
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  category: 'action' | 'reflection' | 'habit' | 'goal';
  isCompleted: boolean;
  createdAt: string;
}

export interface InsightPattern {
  id: string;
  type: 'recurring_theme' | 'contradiction' | 'growth' | 'stagnation' | 'action_gap';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface DailyCheckIn {
  id: string;
  mood: MoodType;
  note: string;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string;
  weeklyGoal: number;
  entriesThisWeek: number;
  milestones: number[];
}

export interface CachedInsight {
  text: string;
  generatedAt: string;
  expiresAt: string;
}

export interface RewardState {
  xp: number;
  level: number;
  hearts: number;
  unlockedCompanions: string[];
  currentCompanion: string;
  lastRewardedDate?: string;
}

export interface AccountabilityContact {
  id: string;
  name: string;
  channel: 'sms' | 'email';
  value: string;
}

export type FutureContractStatus = 'active' | 'awaiting_proof' | 'completed' | 'failed';

export interface FutureContract {
  id: string;
  promise: string;
  createdAt: string;
  deadlineAt: string;
  unlockAt: string;
  voiceUri?: string;
  voiceDurationMs?: number;
  status: FutureContractStatus;
  proofText?: string;
  proofFileName?: string;
  proofSubmittedAt?: string;
  accountabilityContacts: AccountabilityContact[];
  accountabilitySentAt?: string;
  sharedToCircle?: boolean;
  socialReactions?: { emoji: string; count: number }[];
  accountabilityPings?: number;
}

export interface FocusGameState {
  mascotName: string;
  worldName: string;
  starsBuilt: number;
  workshopLevel: number;
  successfulSessions: number;
  failedSessions: number;
  currentFocusStreak: number;
  longestFocusStreak: number;
  totalFocusedMinutes: number;
  lastSessionAt?: string;
}

export interface SocialCircle {
  id: string;
  name: string;
  memberCount: number;
  weeklyKeeps: number;
}

export type CollectibleRarity = 'common' | 'rare' | 'legendary';

export interface Collectible {
  id: string;
  name: string;
  emoji: string;
  rarity: CollectibleRarity;
  unlockedAt: string;
}

export interface FriendRoom {
  id: string;
  name: string;
  mascot: string;
  level: number;
  theme: string;
  lastUpdate: string;
  reactionSummary: string;
}

export type RoomCondition = 'thriving' | 'steady' | 'cracked';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
  content?: string;
}
