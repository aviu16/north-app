import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/theme';
import { useApp } from '../src/context/AppContext';
import { hapticMedium, hapticSuccess } from '../src/utils/helpers';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [step, setStep] = useState<'hero' | 'name'>('hero');
  const [name, setName] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const { completeOnboarding } = useApp();
  const router = useRouter();

  // Hero animations
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;
  const compassAnim = useRef(new Animated.Value(0)).current;
  const compassScale = useRef(new Animated.Value(0.6)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const featuresSlide = useRef(new Animated.Value(20)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(20)).current;

  // Breathing pulse
  const breathe = useRef(new Animated.Value(1)).current;

  // Name screen
  const nameAnim = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (step === 'hero') {
      // Background circles fade in
      Animated.parallel([
        Animated.timing(bgCircle1, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(bgCircle2, { toValue: 1, duration: 1400, delay: 200, useNativeDriver: true }),
      ]).start();

      // Main content sequence
      Animated.sequence([
        // Compass
        Animated.parallel([
          Animated.timing(compassAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.spring(compassScale, { toValue: 1, damping: 12, stiffness: 100, mass: 1, useNativeDriver: true }),
        ]),
        // Title
        Animated.parallel([
          Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(titleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        // Subtitle
        Animated.timing(subtitleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        // Features
        Animated.parallel([
          Animated.timing(featuresAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(featuresSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        // Buttons
        Animated.parallel([
          Animated.timing(buttonsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(buttonsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();

      // Breathing
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, { toValue: 1.06, duration: 3000, useNativeDriver: true }),
          Animated.timing(breathe, { toValue: 1, duration: 3000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [step]);

  useEffect(() => {
    if (step === 'name') {
      nameAnim.setValue(0);
      nameSlide.setValue(30);
      Animated.parallel([
        Animated.timing(nameAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(nameSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  const handleSignUp = () => {
    hapticMedium();
    setIsReturning(false);
    setStep('name');
  };

  const handleSignIn = async () => {
    hapticMedium();
    setIsReturning(true);
    await AsyncStorage.setItem('north_returning_user', 'true');
    setStep('name');
  };

  const handleComplete = () => {
    if (name.trim().length === 0) return;
    hapticSuccess();
    completeOnboarding(name.trim());
    router.replace('/(tabs)');
  };

  // ─── NAME INPUT SCREEN ─────────────────────────
  if (step === 'name') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('hero')} activeOpacity={0.6}>
            <Text style={styles.backArrow}>{'‹'}</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.nameContent,
              { opacity: nameAnim, transform: [{ translateY: nameSlide }] },
            ]}
          >
            <View style={styles.nameEmojiWrap}>
              <Text style={styles.nameEmoji}>👋</Text>
            </View>

            <Text style={styles.nameTitle}>
              {isReturning ? 'Welcome back!' : 'Nice to meet you.'}
            </Text>
            <Text style={styles.nameSubtitle}>
              {isReturning
                ? 'Remind me — what\'s your name?'
                : 'What should I call you?'}
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Your first name"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleComplete}
                autoCapitalize="words"
                selectionColor={Colors.primary}
              />
              <View style={[styles.inputLine, name.length > 0 && styles.inputLineActive]} />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, name.trim().length === 0 && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={name.trim().length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isReturning ? 'Welcome back' : 'Let\'s begin'}
              </Text>
              <Text style={styles.buttonArrow}>{'→'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── HERO SCREEN ─────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background circles */}
      <Animated.View style={[styles.bgCircle1, { opacity: bgCircle1 }]} />
      <Animated.View style={[styles.bgCircle2, { opacity: bgCircle2 }]} />

      <View style={styles.heroContent}>
        {/* Compass with glow ring */}
        <Animated.View
          style={[
            styles.compassContainer,
            {
              opacity: compassAnim,
              transform: [{ scale: Animated.multiply(compassScale, breathe) }],
            },
          ]}
        >
          <View style={styles.compassGlow} />
          <View style={styles.compassRing}>
            <Text style={styles.compassEmoji}>🧭</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleSlide }] }}>
          <Text style={styles.heroTitle}>Find your</Text>
          <Text style={styles.heroTitleAccent}>true north.</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.heroSubtitle, { opacity: subtitleAnim }]}>
          An AI life guide that reads your journals,{'\n'}
          connects your notes, and gives you the{'\n'}
          honest advice you actually need.
        </Animated.Text>

        {/* Feature row */}
        <Animated.View
          style={[
            styles.featureRow,
            { opacity: featuresAnim, transform: [{ translateY: featuresSlide }] },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Journal freely</Text>
          </View>
          <View style={styles.featureSep} />
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Spot patterns</Text>
          </View>
          <View style={styles.featureSep} />
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Get unstuck</Text>
          </View>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          { opacity: buttonsAnim, transform: [{ translateY: buttonsSlide }] },
        ]}
      >
        {/* Sign Up */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
          <Text style={styles.buttonArrow}>{'→'}</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legalText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  flex: {
    flex: 1,
  },

  // ─── Background decoration ─────────────
  bgCircle1: {
    position: 'absolute',
    top: -height * 0.12,
    right: -width * 0.25,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(107, 143, 113, 0.06)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -height * 0.08,
    left: -width * 0.2,
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(196, 162, 101, 0.05)',
  },

  // ─── Hero content ─────────────
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  compassGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(107, 143, 113, 0.08)',
  },
  compassRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(107, 143, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B8F71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  compassEmoji: {
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  featureSep: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 14,
  },

  // ─── Buttons ─────────────
  buttonsContainer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6B8F71',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  buttonArrow: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  legalText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },

  // ─── Name screen ─────────────
  backButton: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 36,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 36,
  },
  nameContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  nameEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(196, 162, 101, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196, 162, 101, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  nameEmoji: {
    fontSize: 34,
  },
  nameTitle: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  nameSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    lineHeight: 22,
    marginBottom: 36,
  },
  inputContainer: {
    marginBottom: 36,
  },
  nameInput: {
    fontSize: 26,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inputLine: {
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1,
  },
  inputLineActive: {
    backgroundColor: Colors.primary,
  },
});
