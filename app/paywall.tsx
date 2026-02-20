import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../src/constants/theme';
import { Button } from '../src/components/ui';
import { usePurchases } from '../src/hooks/usePurchases';
import { useSubscription } from '../src/hooks/useSubscription';
import { PRICING } from '../src/types';
import { hapticSuccess } from '../src/utils/helpers';
import { PurchasesPackage } from 'react-native-purchases';

const features = [
  { label: 'Journal entries', free: 'Unlimited', pro: 'Unlimited' },
  { label: 'AI messages', free: '10 / day', pro: 'Unlimited' },
  { label: 'Pattern analysis', free: '\u2014', pro: '\u2713' },
  { label: 'Notion integration', free: '\u2713', pro: '\u2713' },
  { label: 'All integrations', free: '\u2014', pro: '\u2713' },
  { label: 'Priority support', free: '\u2014', pro: '\u2713' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { upgradeToPro } = useSubscription();
  const { offerings, purchase, restore, loading, error, initialized } = usePurchases();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  // Find monthly and yearly packages from RevenueCat offerings
  const monthlyPkg = offerings.find(
    (p) => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly'
  );
  const yearlyPkg = offerings.find(
    (p) => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
  );

  // Use real prices from RevenueCat if available, otherwise fallback to local pricing
  const monthlyPrice = monthlyPkg?.product?.priceString || `$${PRICING.monthly}`;
  const yearlyPrice = yearlyPkg?.product?.priceString || `$${PRICING.yearly}`;
  const yearlyMonthly = yearlyPkg?.product?.price
    ? `$${(yearlyPkg.product.price / 12).toFixed(2)}`
    : `$${(PRICING.yearly / 12).toFixed(2)}`;

  const packages: { label: string; price: string; sub?: string; pkg?: PurchasesPackage; period: 'monthly' | 'yearly' }[] = [
    { label: 'Monthly', price: `${monthlyPrice}/mo`, pkg: monthlyPkg, period: 'monthly' },
    { label: 'Yearly', price: `${yearlyPrice}/yr`, sub: `${yearlyMonthly}/mo`, pkg: yearlyPkg, period: 'yearly' },
  ];

  const handleSubscribe = async () => {
    const selected = packages[selectedIndex];
    setPurchasing(true);

    if (selected.pkg && initialized) {
      // Real purchase through RevenueCat
      const success = await purchase(selected.pkg);
      if (success) {
        hapticSuccess();
        router.back();
      }
    } else {
      // Fallback: local upgrade (dev/offline mode)
      hapticSuccess();
      upgradeToPro(selected.period);
      router.back();
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    if (initialized) {
      setPurchasing(true);
      const success = await restore();
      setPurchasing(false);
      if (success) {
        hapticSuccess();
        Alert.alert('Restored!', 'Your Pro subscription has been restored.');
        router.back();
      } else if (!error) {
        Alert.alert('No Purchases', 'No previous purchases were found.');
      }
    } else {
      Alert.alert('Unavailable', 'Purchase restoration is not available in this build.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>{'\u2715'}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🧭</Text>
          <Text style={styles.heroTitle}>Unlock North Pro</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited AI guidance, pattern analysis, and all integrations.
          </Text>
        </View>

        {/* Feature Comparison */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableFeature]}>Feature</Text>
            <Text style={styles.tableHeaderText}>Free</Text>
            <Text style={[styles.tableHeaderText, styles.proHeader]}>Pro</Text>
          </View>
          {features.map((feature, index) => (
            <View
              key={feature.label}
              style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.tableFeature]}>{feature.label}</Text>
              <Text style={styles.tableCell}>{feature.free}</Text>
              <Text style={[styles.tableCell, styles.proCellText]}>{feature.pro}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selector */}
        {loading && !purchasing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map((pkg, index) => (
              <TouchableOpacity
                key={pkg.label}
                style={[styles.plan, selectedIndex === index && styles.planSelected]}
                onPress={() => setSelectedIndex(index)}
              >
                {index === 1 && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Save 33%</Text>
                  </View>
                )}
                <Text style={[styles.planTitle, selectedIndex === index && styles.planTitleSelected]}>
                  {pkg.label}
                </Text>
                <Text style={[styles.planPrice, selectedIndex === index && styles.planPriceSelected]}>
                  {pkg.price}
                </Text>
                {pkg.sub && (
                  <Text style={[styles.planSub, selectedIndex === index && styles.planSubSelected]}>
                    {pkg.sub}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Error */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
          onPress={handleSubscribe}
          disabled={purchasing || (loading && !purchasing)}
          activeOpacity={0.8}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaButtonText}>Start North Pro</Text>
          )}
        </TouchableOpacity>

        {/* Fine Print */}
        <View style={styles.finePrint}>
          <Text style={styles.finePrintText}>
            Cancel anytime. No questions asked.
          </Text>
          <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: Spacing.xl,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['3xl'],
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Inter_700Bold',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
    fontFamily: 'Inter_400Regular',
  },
  table: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundTertiary,
  },
  tableHeaderText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  proHeader: {
    color: Colors.primary,
  },
  tableFeature: {
    flex: 2,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tableRowAlt: {
    backgroundColor: Colors.backgroundTertiary,
  },
  tableCell: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  proCellText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  plans: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  plan: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  planSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  planTitle: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  planTitleSelected: {
    color: Colors.textPrimary,
  },
  planPrice: {
    ...Typography.headlineMedium,
    color: Colors.textSecondary,
    fontFamily: 'Inter_700Bold',
  },
  planPriceSelected: {
    color: Colors.primary,
  },
  planSub: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: 'Inter_400Regular',
  },
  planSubSelected: {
    color: Colors.primaryDark,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  saveBadgeText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontFamily: 'Inter_400Regular',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  finePrint: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  finePrintText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  restoreText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
