// The scheduler itself (src/services/notifications.ts), with
// expo-notifications replaced by a recorder: what gets lined up, and how
// delivered kind words count as seen at the next rebuild (9F).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import quotesData from '../src/data/quotes.json';
import { rescheduleAllNotifications } from '../src/services/notifications';
import { getSeenQuoteIds, setCircumstances, setNotificationSettings, setQuoteLanguage, DEFAULT_NOTIFICATION_SETTINGS } from '../src/services/storage';
import type { Quote } from '../src/services/quotes';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  dismissAllNotificationsAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1, PRIVATE: 0 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const STUDENT_POOL = (quotesData as Quote[]).filter((q) => q.language === 'en' && q.circumstances.includes('student'));

// The quote ids lined up by the last reschedule, soonest first.
function plannedQuoteIds(): string[] {
  return schedule.mock.calls
    .map(([request]) => request)
    .sort((a, b) => a.trigger.date.getTime() - b.trigger.date.getTime())
    .map((request) => request.content.data.quoteId);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  schedule.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 10, 8, 0), doNotFake: ['nextTick', 'setImmediate'] });
  await setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true, gentlePacing: false });
  await setCircumstances(['student']);
  await setQuoteLanguage('en');
});

afterEach(() => jest.useRealTimers());

test('a plan goes through every quote that fits before repeating one', async () => {
  const result = await rescheduleAllNotifications();
  expect(result.status).toBe('scheduled');
  const ids = plannedQuoteIds();
  expect(ids).toHaveLength(50);
  const firstRound = ids.slice(0, STUDENT_POOL.length);
  expect(new Set(firstRound).size).toBe(STUDENT_POOL.length);
});

test('kind words whose time has come count as seen at the next rebuild', async () => {
  await rescheduleAllNotifications();
  const firstThree = plannedQuoteIds().slice(0, 3); // Oct 10, 11 and 12, at 9:00
  expect(await getSeenQuoteIds()).toEqual([]);

  // Three days later, those three have been delivered.
  jest.setSystemTime(new Date(2026, 9, 12, 20, 0));
  schedule.mockClear();
  await rescheduleAllNotifications();

  expect(await getSeenQuoteIds()).toEqual(firstThree);
  // ...so the new plan keeps them for last.
  const next = plannedQuoteIds().slice(0, STUDENT_POOL.length - 3);
  expect(next.filter((id) => firstThree.includes(id))).toEqual([]);
});

test('reminders turned off: nothing is lined up', async () => {
  await setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, enabled: false });
  expect((await rescheduleAllNotifications()).status).toBe('off');
  expect(schedule).not.toHaveBeenCalled();
});
