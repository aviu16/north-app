import { useApp } from '../context/AppContext';

export function useSubscription() {
  const { state, isPro, canSendAIMessage, getRemainingMessages, upgradeToPro } = useApp();

  return {
    tier: state.user?.subscription?.tier ?? 'free',
    isPro: isPro(),
    canSendAIMessage: canSendAIMessage(),
    remainingMessages: getRemainingMessages(),
    upgradeToPro,
    usage: state.user?.usage,
    subscription: state.user?.subscription,
  };
}
