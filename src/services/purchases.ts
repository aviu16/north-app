import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { Config } from '../constants/config';

let isInitialized = false;

export const initPurchases = async (): Promise<boolean> => {
  if (isInitialized) return true;

  const apiKey =
    Platform.OS === 'ios'
      ? Config.REVENUECAT_API_KEY_IOS
      : Config.REVENUECAT_API_KEY_ANDROID;

  if (!apiKey || apiKey.startsWith('your_')) {
    console.warn('RevenueCat: No API key configured. Running in offline mode.');
    return false;
  }

  try {
    Purchases.configure({ apiKey });
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('RevenueCat init error:', error);
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  try {
    if (!isInitialized) return null;
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('RevenueCat offerings error:', error);
    return null;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID] !== undefined;
    return { success: isPro, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false };
    }
    console.error('RevenueCat purchase error:', error);
    throw error;
  }
};

export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
}> => {
  try {
    if (!isInitialized) return { success: false };
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID] !== undefined;
    return { success: isPro, customerInfo };
  } catch (error) {
    console.error('RevenueCat restore error:', error);
    return { success: false };
  }
};

export const checkProStatus = async (): Promise<boolean> => {
  try {
    if (!isInitialized) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('RevenueCat status check error:', error);
    return false;
  }
};
