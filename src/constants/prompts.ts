import { MoodType } from '../types';

interface JournalPrompt {
  emoji: string;
  text: string;
  category: 'reflection' | 'gratitude' | 'challenge' | 'action' | 'growth';
}

const allPrompts: JournalPrompt[] = [
  { emoji: '🪞', text: 'What\'s one thing you\'re avoiding right now?', category: 'reflection' },
  { emoji: '🔥', text: 'What would you do if you weren\'t afraid?', category: 'challenge' },
  { emoji: '💬', text: 'How are you really doing — not the polite answer?', category: 'reflection' },
  { emoji: '🌱', text: 'What\'s something small that made today better?', category: 'gratitude' },
  { emoji: '🎯', text: 'What\'s one thing you want to be true by next month?', category: 'action' },
  { emoji: '⚡', text: 'What drained your energy today?', category: 'reflection' },
  { emoji: '🧩', text: 'What pattern do you keep repeating?', category: 'growth' },
  { emoji: '🙏', text: 'Who deserves a thank you that you haven\'t given?', category: 'gratitude' },
  { emoji: '🚀', text: 'What would your ideal tomorrow look like?', category: 'action' },
  { emoji: '💡', text: 'What did you learn about yourself this week?', category: 'growth' },
  { emoji: '🌊', text: 'What are you holding onto that you need to let go of?', category: 'challenge' },
  { emoji: '✨', text: 'What are you most proud of recently?', category: 'gratitude' },
];

const moodPromptMap: Record<MoodType, JournalPrompt['category'][]> = {
  amazing: ['gratitude', 'action', 'growth'],
  good: ['gratitude', 'reflection', 'action'],
  neutral: ['reflection', 'action', 'challenge'],
  low: ['reflection', 'gratitude', 'growth'],
  terrible: ['reflection', 'challenge', 'gratitude'],
};

export function getPrompts(recentMood?: MoodType, count: number = 3): JournalPrompt[] {
  let pool = [...allPrompts];

  if (recentMood) {
    const preferred = moodPromptMap[recentMood];
    pool.sort((a, b) => {
      const aIdx = preferred.indexOf(a.category);
      const bIdx = preferred.indexOf(b.category);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  } else {
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  return pool.slice(0, count);
}
