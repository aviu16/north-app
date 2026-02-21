# North — AI Life Guide App

A personal AI companion that helps you navigate daily life through guided check-ins, reflections, and actionable insights. Built with Expo SDK 54 and powered by AI.

## Features

- **Daily Check-In** — guided emotional and productivity check-in flow
- **AI Insights** — personalized life guidance powered by Anthropic API
- **Streaks & Engagement** — daily streak tracking with animations and rewards
- **Notion Integration** — sync your reflections and insights to Notion via OAuth
- **Onboarding Flow** — beautiful multi-step onboarding experience
- **Freemium Model** — paywall with RevenueCat integration

## Tech Stack

- **React Native / Expo SDK 54** — cross-platform mobile framework
- **Expo Router v4** — file-based navigation
- **TypeScript** — type-safe development
- **Anthropic API** — intelligent life guidance
- **Expo SecureStore** — encrypted credential storage
- **Notion API** — OAuth-based journal sync
- **RevenueCat** — subscription management
- **React Native Reanimated** — fluid animations

## Architecture

```
north/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home / daily view
│   │   ├── guide.tsx             # AI guidance screen
│   │   └── connections.tsx       # Notion & integrations
│   ├── onboarding.tsx            # First-time user flow
│   └── paywall.tsx               # Subscription screen
├── src/
│   ├── components/               # Reusable UI components
│   │   └── DailyCheckIn.tsx      # Check-in flow component
│   ├── constants/                # Theme, prompts
│   ├── context/                  # React Context (AppContext)
│   ├── hooks/                    # Custom hooks (useInsight)
│   ├── services/                 # API integrations
│   │   ├── ai.ts                 # AI service
│   │   ├── notion.ts             # Notion OAuth + sync
│   │   └── purchases.ts         # RevenueCat service
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper functions
└── assets/                       # Icons, splash, fonts
```

## Setup

1. Clone the repo
2. `npm install --legacy-peer-deps`
3. Create `src/constants/config.ts` with your API keys:
   ```ts
   export const CONFIG = {
     AI_API_KEY: 'your-api-key',
     NOTION_CLIENT_ID: 'your-notion-client-id',
     NOTION_CLIENT_SECRET: 'your-notion-client-secret',
     REVENUECAT_API_KEY_IOS: 'your-revenuecat-key',
     REVENUECAT_API_KEY_ANDROID: 'your-revenuecat-key',
   };
   ```
4. `npx expo start`

## License

MIT
