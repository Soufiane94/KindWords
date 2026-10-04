// Small wrapper around AsyncStorage for the settings this app needs so far.
// Keeping all storage keys and shapes in one place makes it easy to change
// how we persist things later without hunting through every screen.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_DONE: 'kindwords:onboardingDone',
  CIRCUMSTANCES: 'kindwords:circumstances',
};

export async function getOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return value === 'true';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
}

export async function getCircumstances(): Promise<string[]> {
  const value = await AsyncStorage.getItem(KEYS.CIRCUMSTANCES);
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

export async function setCircumstances(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CIRCUMSTANCES, JSON.stringify(ids));
}
