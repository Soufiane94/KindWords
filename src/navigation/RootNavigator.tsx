// Decides what the user sees first: onboarding (if they haven't done it yet)
// or the main app (Home, Favorites, Events, and Settings tabs).

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventsScreen from '../screens/EventsScreen';
import KindWordScreen from '../screens/KindWordScreen';
import {
  getOnboardingDone,
  setOnboardingDone,
  getCircumstances,
  getNotificationSettings,
  getEvents,
} from '../services/storage';
import { rescheduleAllNotifications, extractQuoteId } from '../services/notifications';
import { useTheme } from '../theme/ThemeContext';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Filled icon when a tab is active, outline when it isn't. Keyed by route
// name so one screenOptions function below can look up the right pair.
const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Favorites: { active: 'heart', inactive: 'heart-outline' },
  Events: { active: 'calendar', inactive: 'calendar-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

type MainTabsProps = {
  onResetOnboarding: () => void;
};

function MainTabs({ onResetOnboarding }: MainTabsProps) {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icon.active : icon.inactive} size={size} color={color} />;
        },
      })}
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

type RootStackNavigatorProps = {
  onResetOnboarding: () => void;
};

// Wraps the tab bar in a stack so the Kind word detail screen can open full
// screen over whichever tab is active, when a notification is tapped.
function RootStackNavigator({ onResetOnboarding }: RootStackNavigatorProps) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs">
        {() => <MainTabs onResetOnboarding={onResetOnboarding} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="KindWord"
        component={KindWordScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [pendingQuoteId, setPendingQuoteId] = useState<string | undefined>();
  const { colors, themeName } = useTheme();

  // Covers both a cold start (app launched by tapping a notification) and
  // a tap while already running — this hook handles both and dedupes
  // repeats of the same notification for us.
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const quoteId = extractQuoteId(lastNotificationResponse);
    if (quoteId) setPendingQuoteId(quoteId);
  }, [lastNotificationResponse]);

  // Navigates to the pending quote once both it and the navigator are
  // ready. Called from an effect (re-checked on every relevant change,
  // since the two can become ready in either order) and from
  // NavigationContainer's onReady below, which catches the one case the
  // effect can't: the container becoming ready without any further state
  // change afterwards to re-run the effect.
  function navigateToPendingQuoteIfReady() {
    if (pendingQuoteId && onboardingDone && navigationRef.isReady()) {
      navigationRef.navigate('KindWord', { quoteId: pendingQuoteId });
      setPendingQuoteId(undefined);
    }
  }

  useEffect(navigateToPendingQuoteIfReady, [pendingQuoteId, onboardingDone, loading]);

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
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={navigateToPendingQuoteIfReady}
    >
      {onboardingDone ? (
        <RootStackNavigator
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
