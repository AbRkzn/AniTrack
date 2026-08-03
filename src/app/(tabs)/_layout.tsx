import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, ColorValue } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComponentProps } from 'react';
import { typography, borderRadius } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  crops: { active: 'leaf', inactive: 'leaf-outline' },
  harvests: { active: 'basket', inactive: 'basket-outline' },
  animals: { active: 'paw', inactive: 'paw-outline' },
  expenses: { active: 'wallet', inactive: 'wallet-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

function TabIcon({ route, focused, color }: { route: string; focused: boolean; color: ColorValue }) {
  const icons = TAB_ICONS[route];
  return <Ionicons name={focused ? icons.active : icons.inactive} size={23} color={color} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          overflow: 'hidden',
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          ...typography.tab,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon route="index" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color, focused }) => <TabIcon route="crops" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="harvests"
        options={{
          title: 'Harvests',
          tabBarIcon: ({ color, focused }) => <TabIcon route="harvests" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="animals"
        options={{
          title: 'Animals',
          tabBarIcon: ({ color, focused }) => <TabIcon route="animals" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, focused }) => <TabIcon route="expenses" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null,
          tabBarIcon: ({ color, focused }) => <TabIcon route="settings" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
