// Decides what the user sees first: onboarding (if they haven't done it yet)
// or the main app (Home + Settings tabs).

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {
  getOnboardingDone,
  setOnboardingDone,
  getCircumstances,
  getNotificationSettings,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';

const Tab = createBottomTabNavigator();

type MainTabsProps = {
  onResetOnboarding: () => void;
};

function MainTabs({ onResetOnboarding }: MainTabsProps) {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onResetOnboarding={onResetOnboarding} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);

  useEffect(() => {
    getOnboardingDone().then(async (done) => {
      setOnboardingDoneState(done);
      setLoading(false);

      // Refresh scheduled notifications (new random quotes, latest settings)
      // every time the app opens, so reminders never go stale.
      if (done) {
        const [circumstances, settings] = await Promise.all([
          getCircumstances(),
          getNotificationSettings(),
        ]);
        rescheduleAllNotifications(settings, circumstances).catch(() => {
          // Non-fatal: the user can still use the app without reminders.
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C9A94F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
