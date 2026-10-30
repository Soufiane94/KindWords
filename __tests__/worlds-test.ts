// A new look each day: nobody picks a world. The first look at the app on a
// new day brings a new one, and turning "A new look each day" off keeps the
// calm Simple world.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorldId, pickTodaysWorld, setDailyWorld } from '../src/services/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({ now: new Date(2026, 9, 28, 10, 0), doNotFake: ['nextTick', 'setImmediate'] });
});

afterEach(() => jest.useRealTimers());

test('the first look picks a world, and it stays all day', async () => {
  const first = await pickTodaysWorld();
  expect(first.isNew).toBe(true);
  expect(first.worldId).not.toBe('simple');

  jest.setSystemTime(new Date(2026, 9, 28, 23, 59));
  expect(await pickTodaysWorld()).toEqual({ worldId: first.worldId, isNew: false });
  // The widget shows the same one.
  expect(await getWorldId()).toBe(first.worldId);
});

test('each new day brings a different world, never Simple', async () => {
  let previous = (await pickTodaysWorld()).worldId;
  for (let n = 1; n <= 30; n++) {
    // Just after midnight: a new calendar day, not 24 hours later.
    jest.setSystemTime(new Date(2026, 9, 28 + n, 0, 5));
    const { worldId, isNew } = await pickTodaysWorld();
    expect(isNew).toBe(true);
    expect(worldId).not.toBe(previous);
    expect(worldId).not.toBe('simple');
    previous = worldId;
  }
});

test('turned off, Simple stays every day; turned back on, a world comes at once', async () => {
  await pickTodaysWorld();
  await setDailyWorld(false);
  expect(await pickTodaysWorld()).toEqual({ worldId: 'simple', isNew: false });
  expect(await getWorldId()).toBe('simple');

  jest.setSystemTime(new Date(2026, 9, 29, 8, 0));
  expect((await pickTodaysWorld()).worldId).toBe('simple');

  await setDailyWorld(true);
  const back = await pickTodaysWorld();
  expect(back.isNew).toBe(true);
  expect(back.worldId).not.toBe('simple');
});

test('a world chosen back when worlds were picked gives way to a world of the day', async () => {
  await AsyncStorage.setItem('kindwords:theme', 'ocean');
  const today = await pickTodaysWorld();
  expect(today.isNew).toBe(true);
  expect(today.worldId).not.toBe('ocean');
});
