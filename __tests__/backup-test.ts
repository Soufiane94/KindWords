// "Export my data" / "Import" (9E) and "Delete all my data" (9D): reading a
// backup file safely, importing without ever losing what's on the phone,
// and erasing only Kindwords' own keys.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseBackup } from '../src/services/backup';
import {
  BackupData,
  deleteAllData,
  getEvents,
  getFavoriteIds,
  getNotes,
  getNotificationSettings,
  getOnboardingDone,
  getQuoteFeedback,
  restoreBackupData,
} from '../src/services/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
// The file, picker and share modules are native; parsing and restoring
// don't use them.
jest.mock('expo-file-system', () => ({ File: class {}, Directory: class {}, Paths: {} }));
jest.mock('expo-document-picker', () => ({}));
jest.mock('expo-sharing', () => ({}));

const NOTE = { id: 'n1', kind: 'self', text: 'You did well today.', createdOn: '2026-10-01' };
const EVENT = { id: 'e1', title: 'Exam', type: 'exam', date: '2026-10-20', time: '14:00' };

function file(data: Record<string, unknown>, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ app: 'kindwords', version: 1, exportedAt: '2026-10-10T08:00:00.000Z', data, ...extra });
}

beforeEach(() => AsyncStorage.clear());

describe('reading a backup file', () => {
  test("anything that isn't a Kindwords backup is refused", () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"hello": "world"}')).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'other', version: 1, data: {} }))).toBeNull();
    expect(parseBackup(file({}, { version: 99 }))).toBeNull();
  });

  test('a full backup comes back as it was', () => {
    const data = {
      notes: [NOTE],
      events: [EVENT],
      favorites: ['q1'],
      hiddenQuotes: ['q2'],
      quoteFeedback: { moods: { gentle: 1 }, tags: { exam: 2 } },
      circumstances: ['student'],
      worldId: 'nature',
      plainFont: true,
      uiLanguage: 'fr',
      quoteLanguage: 'es',
      checkInEnabled: false,
    };
    const parsed = parseBackup(file(data))!;
    expect(parsed.exportedAt?.toISOString()).toBe('2026-10-10T08:00:00.000Z');
    expect(parsed.data).toMatchObject(data);
  });

  test('only the parts with the right shape are kept', () => {
    const parsed = parseBackup(
      file({
        notes: [NOTE, { id: 'n2', kind: 'diary', text: 'x', createdOn: '2026-10-01' }, 'junk'],
        events: [EVENT, { id: 'e2', title: 'No date', type: 'exam' }, { ...EVENT, id: 'e3', time: '25:99' }],
        quoteFeedback: { moods: { gentle: -1, comfort: 2 }, tags: 'junk' },
        worldId: 'mars',
        uiLanguage: 'klingon',
        notificationSettings: { enabled: true, times: ['nine'], quietHoursStart: '23:00' },
      })
    )!;
    expect(parsed.data.notes.map((n) => n.id)).toEqual(['n1']);
    expect(parsed.data.events.map((e) => [e.id, e.time])).toEqual([
      ['e1', '14:00'],
      ['e3', undefined],
    ]);
    expect(parsed.data.quoteFeedback).toEqual({ moods: { comfort: 2 }, tags: {} });
    expect(parsed.data.worldId).toBeUndefined();
    expect(parsed.data.uiLanguage).toBeUndefined();
    // Usable settings are kept, the rest fall back to the defaults.
    expect(parsed.data.notificationSettings).toMatchObject({ enabled: true, times: ['09:00'], quietHoursStart: '23:00' });
  });
});

describe('importing', () => {
  // No settings in it: the merge is what these tests are about.
  const backup: BackupData = {
    notes: [{ ...NOTE, kind: 'self', text: 'An older copy' }, { ...NOTE, kind: 'self', id: 'n2' }],
    events: [EVENT],
    favorites: ['q1', 'q2'],
    hiddenQuotes: [],
    quoteFeedback: { moods: { gentle: 1 }, tags: {} },
  };

  test("adds what's in the file, keeps what's on the phone, and never doubles", async () => {
    await AsyncStorage.setItem('kindwords:notes', JSON.stringify([NOTE]));
    await AsyncStorage.setItem('kindwords:favorites', JSON.stringify(['q1']));
    await AsyncStorage.setItem('kindwords:quoteFeedback', JSON.stringify({ moods: { gentle: 3 }, tags: {} }));

    await restoreBackupData(backup);
    await restoreBackupData(backup);

    const notes = await getNotes();
    expect(notes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(notes[0].text).toBe(NOTE.text); // the phone's own copy stays
    expect(await getFavoriteIds()).toEqual(['q1', 'q2']);
    expect((await getEvents()).map((e) => e.id)).toEqual(['e1']);
    expect((await getQuoteFeedback()).moods.gentle).toBe(3);
    expect(await getOnboardingDone()).toBe(true);
  });

  test("the file's settings replace the phone's; missing ones are left alone", async () => {
    const settings = { ...(await getNotificationSettings()), enabled: true, times: ['08:30'] };
    await restoreBackupData({ ...backup, notificationSettings: settings, worldId: 'ocean' });
    expect(await getNotificationSettings()).toMatchObject({ enabled: true, times: ['08:30'] });
    expect(await AsyncStorage.getItem('kindwords:theme')).toBe('ocean');
    expect(await AsyncStorage.getItem('kindwords:uiLanguage')).toBeNull();
  });
});

describe('deleting everything', () => {
  test("erases every Kindwords key, and nothing else", async () => {
    await AsyncStorage.multiSet([
      ['kindwords:notes', '[]'],
      ['kindwords:seenQuotes', '[]'],
      ['someOtherLibrary:cache', 'keep me'],
    ]);
    await deleteAllData();
    expect(await AsyncStorage.getAllKeys()).toEqual(['someOtherLibrary:cache']);
  });
});
