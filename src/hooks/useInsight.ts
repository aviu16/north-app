import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { generateInsight, generateSuggestedActions } from '../services/ai';
import { SuggestedAction, CachedInsight } from '../types';
import * as Crypto from 'expo-crypto';

export function useInsight() {
  const { state, dispatch } = useApp();

  const fetchInsight = useCallback(async () => {
    // Check cache
    if (state.cachedInsight) {
      const expires = new Date(state.cachedInsight.expiresAt);
      if (expires > new Date()) {
        return state.cachedInsight.text;
      }
    }

    if (state.journalEntries.length < 3) return null;

    try {
      const text = await generateInsight(state.journalEntries);
      const now = new Date();
      const insight: CachedInsight = {
        text,
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
      dispatch({ type: 'SET_CACHED_INSIGHT', payload: insight });
      return text;
    } catch {
      return null;
    }
  }, [state.cachedInsight, state.journalEntries.length]);

  const fetchSuggestedActions = useCallback(async () => {
    if (state.journalEntries.length < 2) return;

    try {
      const raw = await generateSuggestedActions(state.journalEntries);
      // Parse JSON from response (may be wrapped in markdown code block)
      const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr) as Array<{
        title: string;
        description: string;
        category: string;
      }>;

      const actions: SuggestedAction[] = parsed.map((item) => ({
        id: Crypto.randomUUID(),
        title: item.title,
        description: item.description,
        category: (item.category as SuggestedAction['category']) || 'action',
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }));

      dispatch({ type: 'SET_SUGGESTED_ACTIONS', payload: actions });
    } catch {
      // Silently fail — don't block UI
    }
  }, [state.journalEntries.length]);

  return {
    cachedInsight: state.cachedInsight,
    fetchInsight,
    fetchSuggestedActions,
  };
}
