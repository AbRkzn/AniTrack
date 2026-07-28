import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { Platform } from 'react-native';

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 22 }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.light.primary,
        tabBarInactiveTintColor: colors.light.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.light.surface,
          borderTopColor: colors.light.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...typography.tab,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: () => <TabIcon icon="🏠" />,
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: () => <TabIcon icon="🌱" />,
        }}
      />
      <Tabs.Screen
        name="harvests"
        options={{
          title: 'Harvests',
          tabBarIcon: () => <TabIcon icon="🌾" />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: () => <TabIcon icon="💰" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <TabIcon icon="⚙️" />,
        }}
      />
    </Tabs>
  );
}
