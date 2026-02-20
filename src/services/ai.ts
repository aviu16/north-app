import { Config, SYSTEM_PROMPT } from '../constants/config';
import { ChatMessage, JournalEntry } from '../types';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExecutionStep {
  title: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ExecutionPlan {
  focus: string;
  risk: string;
  firstWin: string;
  thisWeek: ExecutionStep[];
}

const buildUserContext = (entries: JournalEntry[]): string => {
  if (entries.length === 0) return '';

  const recentEntries = entries.slice(0, 20);
  let context = '\n\n--- USER JOURNAL CONTEXT ---\n';

  recentEntries.forEach((entry) => {
    context += `\n[${entry.createdAt}] ${entry.mood ? `Mood: ${entry.mood}` : ''}\n`;
    context += `Title: ${entry.title}\n`;
    context += `${entry.content.slice(0, 500)}\n`;
    context += '---\n';
  });

  return context;
};

const parseJsonFromModel = (raw: string): any => {
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model did not return valid JSON');
  }
};

export const sendMessage = async (
  messages: ChatMessage[],
  journalEntries: JournalEntry[] = [],
  options?: { tone?: 'supportive' | 'assertive' }
): Promise<string> => {
  const contextPrompt = buildUserContext(journalEntries);
  const tonePrompt =
    options?.tone === 'assertive'
      ? '\n\nTone override: be highly direct and challenge avoidance immediately.'
      : '\n\nTone override: be direct but emotionally softer.';
  const systemPrompt = SYSTEM_PROMPT + tonePrompt + contextPrompt;

  const claudeMessages: ClaudeMessage[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    const response = await fetch(Config.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Config.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Config.CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
};

export const generateExecutionPlan = async (
  goal: string,
  entries: JournalEntry[],
  tone: 'supportive' | 'assertive' = 'assertive'
): Promise<ExecutionPlan> => {
  const contextPrompt = buildUserContext(entries);

  const response = await fetch(Config.CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Config.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: Config.CLAUDE_MODEL,
      max_tokens: 900,
      system: `${SYSTEM_PROMPT}

You are now North's Execution Engine.
Your job is to convert the user's goal into a concrete, no-excuses 7-day plan.
Tone: ${tone === 'assertive' ? 'assertive and challenging' : 'supportive and practical'}.

Return only JSON in this schema:
{
  "focus": "single sentence priority",
  "risk": "main failure mode",
  "firstWin": "task for today that can be done in < 20 minutes",
  "thisWeek": [
    { "title": "...", "rationale": "...", "effort": "low|medium|high" }
  ]
}

Rules:
- 4 to 6 steps in thisWeek.
- Steps must be specific and measurable.
- No generic advice.

${contextPrompt}`,
      messages: [
        {
          role: 'user',
          content: `Build my execution plan for this goal: ${goal}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? '{}';
  const parsed = parseJsonFromModel(rawText);

  const steps = Array.isArray(parsed?.thisWeek) ? parsed.thisWeek : [];
  return {
    focus: String(parsed?.focus || 'Ship one meaningful step today.'),
    risk: String(parsed?.risk || 'Overplanning without execution.'),
    firstWin: String(parsed?.firstWin || 'Complete one 15-minute action.'),
    thisWeek: steps.slice(0, 6).map((step: any) => ({
      title: String(step?.title || 'Action step'),
      rationale: String(step?.rationale || 'Moves the goal forward.'),
      effort: step?.effort === 'high' || step?.effort === 'medium' ? step.effort : 'low',
    })),
  };
};

export const generateSuggestedActions = async (
  entries: JournalEntry[]
): Promise<string> => {
  const contextPrompt = buildUserContext(entries);

  try {
    const response = await fetch(Config.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Config.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Config.CLAUDE_MODEL,
        max_tokens: 512,
        system: `You are North's Action Engine. Based on the user's journal entries, generate 1-3 specific, actionable steps for today. Be direct. Reference their actual entries.

Format as JSON array:
[{"title": "...", "description": "...", "category": "action|reflection|habit|goal"}]

${contextPrompt}`,
        messages: [
          {
            role: 'user',
            content: 'What should I focus on today?',
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Action generation error:', error);
    throw error;
  }
};

export const analyzePatterns = async (
  entries: JournalEntry[]
): Promise<string> => {
  const contextPrompt = buildUserContext(entries);

  try {
    const response = await fetch(Config.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Config.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Config.CLAUDE_MODEL,
        max_tokens: 1024,
        system: `You are North's Pattern Analyzer. Analyze the user's journal entries and identify:
1. Recurring themes
2. Contradictions between what they say and do
3. Areas of growth
4. Areas of stagnation
5. Action gaps (things written about but never acted on)

Be honest but constructive. Use their own words.

Format as JSON:
[{"type": "recurring_theme|contradiction|growth|stagnation|action_gap", "title": "...", "description": "...", "severity": "low|medium|high"}]

${contextPrompt}`,
        messages: [
          {
            role: 'user',
            content: 'Analyze my patterns.',
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Pattern analysis error:', error);
    throw error;
  }
};

export const generateInsight = async (
  entries: JournalEntry[]
): Promise<string> => {
  if (entries.length === 0) {
    return "Start journaling and I'll share insights about your patterns and progress.";
  }

  const contextPrompt = buildUserContext(entries);

  try {
    const response = await fetch(Config.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Config.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Config.CLAUDE_MODEL,
        max_tokens: 256,
        system: `You are North. Give a single, concise insight (1-2 sentences) based on the user's recent journal entries. Be observant and specific. No fluff.

${contextPrompt}`,
        messages: [
          {
            role: 'user',
            content: 'Give me one insight.',
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Insight generation error:', error);
    return "I'm having trouble connecting right now. Try again in a moment.";
  }
};
