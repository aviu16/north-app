import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ size = 'sm' }) => (
  <View style={[styles.badge, size === 'md' && styles.badgeMd]}>
    <Text style={[styles.star, size === 'md' && styles.starMd]}>⭐</Text>
    <Text style={[styles.text, size === 'md' && styles.textMd]}>PRO</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6E3',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(196, 162, 101, 0.3)',
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  star: {
    fontSize: 10,
  },
  starMd: {
    fontSize: 13,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.tertiaryDark,
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: 12,
  },
});
