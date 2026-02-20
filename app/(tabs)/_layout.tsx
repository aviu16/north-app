import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '../../src/constants/theme';

function TabPill({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabPill, focused && styles.tabPillActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabPill emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          tabBarIcon: ({ focused }) => <TabPill emoji="🎙️" label="Contracts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabPill emoji="👤" label="Profile" focused={focused} />,
        }}
      />

      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="guide" options={{ href: null }} />
      <Tabs.Screen name="connections" options={{ href: null }} />
      <Tabs.Screen name="focus" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F1F34',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 92 : 70,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.sm,
  },
  tabPill: {
    minWidth: 84,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabPillActive: {
    backgroundColor: '#1F3F67',
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    color: '#9FB4D3',
    fontFamily: 'Inter_600SemiBold',
  },
  tabLabelActive: {
    color: '#F3F8FF',
  },
});
