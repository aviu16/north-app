import { useMemo } from 'react';
import { startOfDay, startOfWeek, isAfter, isSameDay, subDays } from 'date-fns';
import { useApp } from '../context/AppContext';

export function useStreak() {
  const { state } = useApp();

  return useMemo(() => {
    const entries = state.journalEntries;
    const today = startOfDay(new Date());

    // Get unique entry dates (just the day, no duplication)
    const entryDates = new Set<string>();
    entries.forEach((e) => {
      entryDates.add(startOfDay(new Date(e.createdAt)).toISOString());
    });

    const sortedDates = Array.from(entryDates)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    // Current streak: count consecutive days backward from today
    let currentStreak = 0;
    let checkDate = today;

    // Allow today or yesterday as start
    if (sortedDates.length > 0) {
      const mostRecent = startOfDay(sortedDates[0]);
      if (isSameDay(mostRecent, today) || isSameDay(mostRecent, subDays(today, 1))) {
        checkDate = mostRecent;
      } else {
        // Streak broken
        return {
          streak: { current: 0, longest: 0, today: false },
          weeklyProgress: computeWeekly(entries),
        };
      }
    }

    for (const date of sortedDates) {
      if (isSameDay(date, checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (isAfter(checkDate, date)) {
        break;
      }
    }

    // Longest streak
    let longest = 0;
    let tempStreak = 0;
    let tempCheck: Date | null = null;

    for (const date of sortedDates) {
      if (!tempCheck) {
        tempStreak = 1;
        tempCheck = subDays(date, 1);
      } else if (isSameDay(date, tempCheck)) {
        tempStreak++;
        tempCheck = subDays(tempCheck, 1);
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
        tempCheck = subDays(date, 1);
      }
    }
    longest = Math.max(longest, tempStreak);

    const hasEntryToday = sortedDates.some((d) => isSameDay(d, today));

    return {
      streak: { current: currentStreak, longest, today: hasEntryToday },
      weeklyProgress: computeWeekly(entries),
    };
  }, [state.journalEntries]);
}

function computeWeekly(entries: { createdAt: string }[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const uniqueDays = new Set<string>();

  entries.forEach((e) => {
    const date = startOfDay(new Date(e.createdAt));
    if (isAfter(date, subDays(weekStart, 1))) {
      uniqueDays.add(date.toISOString());
    }
  });

  const entriesThisWeek = uniqueDays.size;
  const goal = 5;

  return {
    entriesThisWeek,
    goal,
    progress: Math.min(entriesThisWeek / goal, 1),
  };
}
