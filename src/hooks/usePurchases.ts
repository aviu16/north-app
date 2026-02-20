import { useState, useEffect, useCallback } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import {
  initPurchases,
  getOfferings,
  purchasePackage as purchasePkg,
  restorePurchases as restorePkg,
  checkProStatus,
} from '../services/purchases';
import { useApp } from '../context/AppContext';

interface UsePurchasesReturn {
  offerings: PurchasesPackage[];
  isPro: boolean;
  loading: boolean;
  error: string | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  initialized: boolean;
}

export function usePurchases(): UsePurchasesReturn {
  const { state, dispatch } = useApp();
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isPro = state.user?.subscription?.tier === 'pro';

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const ready = await initPurchases();
        setInitialized(ready);

        if (ready) {
          // Check current pro status from RevenueCat
          const proStatus = await checkProStatus();
          if (proStatus && !isPro) {
            dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: 'pro' } });
          }

          // Fetch offerings
          const result = await getOfferings();
          if (result?.current?.availablePackages) {
            setOfferings(result.current.availablePackages);
          }
        }
      } catch (err) {
        setError('Failed to load subscription info');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      setError(null);
      setLoading(true);
      try {
        const result = await purchasePkg(pkg);
        if (result.success) {
          dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: 'pro' } });
          return true;
        }
        return false;
      } catch (err: any) {
        setError(err.message || 'Purchase failed. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const restore = useCallback(async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const result = await restorePkg();
      if (result.success) {
        dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: 'pro' } });
        return true;
      }
      setError('No previous purchases found.');
      return false;
    } catch (err: any) {
      setError(err.message || 'Restore failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    offerings,
    isPro,
    loading,
    error,
    purchase,
    restore,
    initialized,
  };
}
