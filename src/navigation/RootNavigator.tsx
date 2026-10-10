// Decides what the user sees first: onboarding (if they haven't done it yet)
// or the main app (Home, Favorites, Notes, Events, and Settings tabs).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NotesScreen from '../screens/NotesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventsScreen from '../screens/EventsScreen';
import KindWordScreen from '../screens/KindWordScreen';
import SendKindWordScreen from '../screens/SendKindWordScreen';
import { getOnboardingDone, setOnboardingDone } from '../services/storage';
import {
  rescheduleAllNotifications,
  extractNotificationTarget,
  NotificationTarget,
} from '../services/notifications';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
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
  Notes: { active: 'mail', inactive: 'mail-outline' },
  Events: { active: 'calendar', inactive: 'calendar-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

// Opening the app rebuilds the notification plan (fresh quotes, and gentle
// pacing starts counting over), but coming back to the app many times an
// hour doesn't need to redo it each time.
const REFRESH_EVERY_MS = 60 * 60 * 1000;

type MainTabsProps = {
  onResetOnboarding: () => void;
};

function MainTabs({ onResetOnboarding }: MainTabsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: t('nav.favorites') }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ tabBarLabel: t('nav.notes') }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: t('nav.events') }} />
      <Tab.Screen name="Settings" options={{ tabBarLabel: t('nav.settings') }}>
        {() => <SettingsScreen onResetOnboarding={onResetOnboarding} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

type RootStackNavigatorProps = {
  onResetOnboarding: () => void;
};

// Wraps the tab bar in a stack so the Kind word detail screen (when a
// notification is tapped) and the Send screen can open full screen over
// whichever tab is active.
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
      <RootStack.Screen
        name="SendKindWord"
        component={SendKindWordScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<NotificationTarget | undefined>();
  const lastRefreshAt = useRef(0);
  const { colors } = useTheme();

  // Covers both a cold start (app launched by tapping a notification) and
  // a tap while already running — this hook handles both and dedupes
  // repeats of the same notification for us.
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const target = extractNotificationTarget(lastNotificationResponse);
    if (target) setPendingTarget(target);
  }, [lastNotificationResponse]);

  // Opens the screen a tapped notification leads to once both it and the
  // navigator are ready. Called from an effect (re-checked on every relevant
  // change, since the two can become ready in either order) and from
  // NavigationContainer's onReady below, which catches the one case the
  // effect can't: the container becoming ready without any further state
  // change afterwards to re-run the effect.
  function navigateToPendingTargetIfReady() {
    if (pendingTarget && onboardingDone && navigationRef.isReady()) {
      if (pendingTarget.screen === 'SendKindWord') {
        navigationRef.navigate('SendKindWord', pendingTarget.params);
      } else {
        navigationRef.navigate('KindWord', pendingTarget.params);
      }
      setPendingTarget(undefined);
    }
  }

  useEffect(navigateToPendingTargetIfReady, [pendingTarget, onboardingDone, loading]);

  // Refreshes scheduled notifications (new random quotes, latest settings)
  // and the home screen widget, so neither goes stale.
  const refreshIfStale = useCallback(() => {
    if (Date.now() - lastRefreshAt.current < REFRESH_EVERY_MS) return;
    lastRefreshAt.current = Date.now();
    rescheduleAllNotifications().catch(() => {
      // Non-fatal: the user can still use the app without reminders.
    });
    refreshKindWordWidget();
  }, []);

  useEffect(() => {
    getOnboardingDone().then((done) => {
      setOnboardingDoneState(done);
      setLoading(false);
    });
  }, []);

  // Every time the app opens or comes back to the front.
  useEffect(() => {
    if (!onboardingDone) return;
    refreshIfStale();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfStale();
    });
    return () => subscription.remove();
  }, [onboardingDone, refreshIfStale]);

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

  // Generalizes the old 'dusk'-only check so any dark-leaning world (Space,
  // say) gets react-navigation's dark chrome defaults too, before our own
  // color overrides below take over anyway.
  const base = colors.statusBarStyle === 'light' ? DarkTheme : DefaultTheme;
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
      onReady={navigateToPendingTargetIfReady}
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
