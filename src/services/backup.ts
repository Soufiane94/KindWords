// "Export my data" and "Import" (9E): a backup without accounts. Export puts
// everything worth keeping into one small file and hands it to the phone's
// share menu, so the user picks where it goes (their email, a cloud drive,
// a message to themselves). Import reads such a file back in. The file is
// plain JSON, so it stays readable whatever happens to the app.

import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { DEFAULT_NOTIFICATION_SETTINGS, readBackupData } from './storage';
import type { BackupData, CalendarEvent, NotificationSettings, PersonalNote, QuoteFeedback } from './storage';
import { todayISO } from './dates';
import { NOTE_KINDS, NoteKind } from '../data/noteKinds';
import { isSupportedLanguage } from '../data/languages';
import i18n from '../i18n';

// Bump when the file's shape changes in a way older versions can't read.
const FORMAT_VERSION = 1;
const FILE_PREFIX = 'kindwords-backup-';

type BackupFile = {
  app: 'kindwords';
  version: number;
  exportedAt: string;
  data: BackupData;
};

export async function exportData(): Promise<void> {
  // An older copy may still be in the cache from a previous export.
  clearBackupFiles();
  const backup: BackupFile = {
    app: 'kindwords',
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: await readBackupData(),
  };
  const file = new File(Paths.cache, `${FILE_PREFIX}${todayISO()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: i18n.t('privacy.exportDialogTitle'),
  });
}

export type PickedBackup = { data: BackupData; exportedAt: Date | null };

// Lets the user pick a backup file. Any kind of file can be picked (cloud
// drives and email apps don't always label JSON as JSON), and anything that
// isn't a Kindwords backup comes back as 'invalid'.
export async function pickBackup(): Promise<PickedBackup | 'canceled' | 'invalid'> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return 'canceled';
  // The picker hands over its own copy in the cache, deleted once read.
  const picked = new File(result.assets[0].uri);
  try {
    return parseBackup(await picked.text()) ?? 'invalid';
  } catch {
    return 'invalid';
  } finally {
    if (picked.exists) picked.delete();
  }
}

// Removes exported files left in the cache: the share menu may still be
// reading one right after an export, so they're cleared the next time
// instead, and by "Delete all my data". (Pictures that were shared are
// cleared by react-native-view-shot itself whenever the app starts or
// closes.)
export function clearBackupFiles(): void {
  try {
    for (const item of new Directory(Paths.cache).list()) {
      if (item instanceof File && item.name.startsWith(FILE_PREFIX)) item.delete();
    }
  } catch {
    // Non-fatal: the system clears the cache by itself when space runs low.
  }
}

// Reading a file that may have been edited by hand, or isn't ours at all:
// only what has the right shape is kept.
type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isDay(value: unknown): value is string {
  return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: unknown): value is string {
  return isString(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function toEvent(value: unknown): CalendarEvent | null {
  if (!isObject(value) || !isString(value.id) || !isString(value.title)) return null;
  if (!isString(value.type) || !isDay(value.date)) return null;
  return {
    id: value.id,
    title: value.title,
    type: value.type,
    date: value.date,
    time: isTime(value.time) ? value.time : undefined,
    repeatsYearly: value.repeatsYearly === true ? true : undefined,
  };
}

function toNote(value: unknown): PersonalNote | null {
  if (!isObject(value) || !isString(value.id) || !isString(value.text) || !isDay(value.createdOn)) return null;
  const kind = NOTE_KINDS.find((k) => k.id === value.kind)?.id;
  if (!kind) return null;
  return {
    id: value.id,
    kind: kind as NoteKind,
    text: value.text,
    from: isString(value.from) ? value.from : undefined,
    to: isString(value.to) ? value.to : undefined,
    deliverOn: isDay(value.deliverOn) ? value.deliverOn : undefined,
    repeatsYearly: value.repeatsYearly === true ? true : undefined,
    createdOn: value.createdOn,
  };
}

function toCounts(value: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!isObject(value)) return counts;
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) counts[key] = Math.round(count);
  }
  return counts;
}

function toFeedback(value: unknown): QuoteFeedback {
  return isObject(value) ? { moods: toCounts(value.moods), tags: toCounts(value.tags) } : { moods: {}, tags: {} };
}

// Each setting that's missing or unusable falls back to its default.
function toSettings(value: unknown): NotificationSettings | undefined {
  if (!isObject(value)) return undefined;
  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS };
  if (typeof value.enabled === 'boolean') settings.enabled = value.enabled;
  if (value.frequency === 'daily' || value.frequency === 'three_per_week' || value.frequency === 'custom') {
    settings.frequency = value.frequency;
  }
  if (Array.isArray(value.times) && value.times.length > 0 && value.times.every(isTime)) {
    settings.times = value.times as string[];
  }
  if (isTime(value.quietHoursStart)) settings.quietHoursStart = value.quietHoursStart;
  if (isTime(value.quietHoursEnd)) settings.quietHoursEnd = value.quietHoursEnd;
  if (value.lockScreenVisibility === 'public' || value.lockScreenVisibility === 'private') {
    settings.lockScreenVisibility = value.lockScreenVisibility;
  }
  if (typeof value.gentlePacing === 'boolean') settings.gentlePacing = value.gentlePacing;
  return settings;
}

// Turns a file's text back into backup data, or null if it isn't a
// Kindwords backup this version can read.
export function parseBackup(text: string): PickedBackup | null {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(file) || file.app !== 'kindwords' || !isObject(file.data)) return null;
  if (typeof file.version !== 'number' || file.version > FORMAT_VERSION) return null;

  const data = file.data;
  const circumstances = stringList(data.circumstances);
  const exportedAt = isString(file.exportedAt) ? new Date(file.exportedAt) : null;
  return {
    exportedAt: exportedAt && !Number.isNaN(exportedAt.getTime()) ? exportedAt : null,
    data: {
      notes: Array.isArray(data.notes) ? data.notes.map(toNote).filter((n): n is PersonalNote => n !== null) : [],
      events: Array.isArray(data.events)
        ? data.events.map(toEvent).filter((e): e is CalendarEvent => e !== null)
        : [],
      favorites: stringList(data.favorites),
      hiddenQuotes: stringList(data.hiddenQuotes),
      quoteFeedback: toFeedback(data.quoteFeedback),
      circumstances: circumstances.length > 0 ? circumstances : undefined,
      notificationSettings: toSettings(data.notificationSettings),
      dailyWorld: typeof data.dailyWorld === 'boolean' ? data.dailyWorld : undefined,
      plainFont: typeof data.plainFont === 'boolean' ? data.plainFont : undefined,
      uiLanguage: isSupportedLanguage(data.uiLanguage) ? data.uiLanguage : undefined,
      quoteLanguage: isSupportedLanguage(data.quoteLanguage) ? data.quoteLanguage : undefined,
      checkInEnabled: typeof data.checkInEnabled === 'boolean' ? data.checkInEnabled : undefined,
    },
  };
}
