import { JournalEntry, MoodType, MoodLabels, DailyCheckIn } from '../types';
import { isToday, isYesterday, format } from 'date-fns';

export function getSmartGreeting(
  name: string,
  entries: JournalEntry[],
  checkIns: DailyCheckIn[]
): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (entries.length === 0) {
    return `${timeGreeting}, ${name}`;
  }

  // Check if already checked in today
  const todaysCheckIn = checkIns.find((c) => isToday(new Date(c.createdAt)));
  if (todaysCheckIn) {
    return `Welcome back, ${name}`;
  }

  // Reference yesterday's mood
  const yesterdayEntries = entries.filter((e) => isYesterday(new Date(e.createdAt)));
  if (yesterdayEntries.length > 0 && yesterdayEntries[0].mood) {
    const mood = yesterdayEntries[0].mood;
    if (mood === 'terrible' || mood === 'low') {
      return `${timeGreeting}, ${name}. Yesterday was tough. How are you holding up?`;
    }
    if (mood === 'amazing') {
      return `${timeGreeting}, ${name}. Yesterday was a great day. Let's keep that going.`;
    }
  }

  // Nudge if no entry today
  const todayEntries = entries.filter((e) => isToday(new Date(e.createdAt)));
  if (todayEntries.length === 0 && entries.length >= 3) {
    return `${timeGreeting}, ${name}. You haven't checked in today.`;
  }

  return `${timeGreeting}, ${name}`;
}
