// Small wrapper around AsyncStorage for the settings this app needs so far.
// Keeping all storage keys and shapes in one place makes it easy to change
// how we persist things later without hunting through every screen.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_DONE: 'kindwords:onboardingDone',
  CIRCUMSTANCES: 'kindwords:circumstances',
  NOTIFICATION_SETTINGS: 'kindwords:notificationSettings',
};

export type Frequency = 'daily' | 'three_per_week' | 'custom';
export type LockScreenVisibility = 'public' | 'private';

export type NotificationSettings = {
  enabled: boolean;
  frequency: Frequency;
  // Times of day, each as "HH:mm" (24-hour, local time).
  // "daily" and "three_per_week" only ever use the first entry;
  // "custom" can hold several.
  times: string[];
  quietHoursStart: string; // "HH:mm"
  quietHoursEnd: string; // "HH:mm"
  lockScreenVisibility: LockScreenVisibility;
};

// Default to "private" on the lock screen: some kind words are about grief
// or illness, which isn't always something someone wants a stranger glancing
// at their phone to see.
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  frequency: 'daily',
  times: ['09:00'],
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  lockScreenVisibility: 'private',
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const value = await AsyncStorage.getItem(KEYS.NOTIFICATION_SETTINGS);
  if (!value) return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(value) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function setNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
}

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
