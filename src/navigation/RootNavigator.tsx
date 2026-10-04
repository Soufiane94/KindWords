// Decides what the user sees first: onboarding (if they haven't done it yet)
// or the main app (Home + Settings tabs).

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getOnboardingDone } from '../services/storage';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    getOnboardingDone().then((done) => {
      setOnboardingDone(done);
      setLoading(false);
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
        <MainTabs />
      ) : (
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      )}
    </NavigationContainer>
  );
}
