// Decides what the user sees first: onboarding (if they haven't done it yet)
// or the main app (Home, Favorites, Events, and Settings tabs).

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventsScreen from '../screens/EventsScreen';
import {
  getOnboardingDone,
  setOnboardingDone,
  getCircumstances,
  getNotificationSettings,
  getEvents,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

type MainTabsProps = {
  onResetOnboarding: () => void;
};

function MainTabs({ onResetOnboarding }: MainTabsProps) {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onResetOnboarding={onResetOnboarding} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const { colors, themeName } = useTheme();

  useEffect(() => {
    getOnboardingDone().then(async (done) => {
      setOnboardingDoneState(done);
      setLoading(false);

      // Refresh scheduled notifications (new random quotes, latest settings)
      // every time the app opens, so reminders never go stale.
      if (done) {
        const [circumstances, settings, events] = await Promise.all([
          getCircumstances(),
          getNotificationSettings(),
          getEvents(),
        ]);
        rescheduleAllNotifications(settings, circumstances, events).catch(() => {
          // Non-fatal: the user can still use the app without reminders.
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const base = themeName === 'dusk' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      text: colors.primaryText,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {onboardingDone ? (
        <MainTabs
          onResetOnboarding={async () => {
            await setOnboardingDone(false);
            setOnboardingDoneState(false);
          }}
        />
      ) : (
        <OnboardingScreen onDone={() => setOnboardingDoneState(true)} />
      )}
    </NavigationContainer>
  );
}
