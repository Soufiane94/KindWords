// The welcome's reminders step (9O): reminders are suggested on to someone
// who has never set them, anyone else finds their own settings, and custom
// times are tidied before saving (like in Settings).

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getWelcomeNotificationSettings,
  setNotificationSettings,
  tidyNotificationSettings,
} from '../src/services/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => AsyncStorage.clear());

test('someone who has never set reminders finds them suggested on, with the usual defaults', async () => {
  expect(await getWelcomeNotificationSettings()).toEqual({ ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true });
});

test('after "Redo welcome setup", saved reminders stay as they were, even turned off', async () => {
  const saved = { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: false, times: ['20:30'] };
  await setNotificationSettings(saved);
  expect(await getWelcomeNotificationSettings()).toEqual(saved);
});

test('custom times lose their duplicates and come in order; daily keeps its list', () => {
  const custom = { ...DEFAULT_NOTIFICATION_SETTINGS, frequency: 'custom' as const, times: ['18:00', '08:30', '18:00'] };
  expect(tidyNotificationSettings(custom).times).toEqual(['08:30', '18:00']);
  const daily = { ...DEFAULT_NOTIFICATION_SETTINGS, times: ['18:00', '08:30'] };
  expect(tidyNotificationSettings(daily)).toBe(daily);
});
