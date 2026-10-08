// Settings screen: circumstances (from Phase 1) plus notification
// preferences (Phase 2) — frequency, quiet hours, and lock-screen visibility.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CIRCUMSTANCES } from '../data/circumstances';
import {
  getCircumstances,
  setCircumstances,
  getNotificationSettings,
  setNotificationSettings,
  getEvents,
  NotificationSettings,
  Frequency,
  LockScreenVisibility,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import CircumstanceChip from '../components/CircumstanceChip';
import SegmentedControl from '../components/SegmentedControl';
import TimeRow from '../components/TimeRow';

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'three_per_week', label: '3x a week' },
  { value: 'custom', label: 'Custom' },
];

const VISIBILITY_OPTIONS: { value: LockScreenVisibility; label: string }[] = [
  { value: 'private', label: 'Hide on lock screen' },
  { value: 'public', label: 'Show on lock screen' },
];

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saved'; scheduledCount: number; skippedTimes: string[] }
  | { kind: 'permission_denied' };

type Props = {
  // Like an Angular @Output(): SettingsScreen doesn't know what happens
  // after reset, it just tells the parent (RootNavigator) that it should.
  onResetOnboarding: () => void;
};

export default function SettingsScreen({ onResetOnboarding }: Props) {
  const [selectedCircumstances, setSelectedCircumstances] = useState<string[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });

  useFocusEffect(
    useCallback(() => {
      getCircumstances().then(setSelectedCircumstances);
      getNotificationSettings().then(setSettings);
      setSaveStatus({ kind: 'idle' });
    }, [])
  );

  async function toggleCircumstance(id: string) {
    const next = selectedCircumstances.includes(id)
      ? selectedCircumstances.filter((x) => x !== id)
      : [...selectedCircumstances, id];
    const safeNext = next.length > 0 ? next : ['other'];
    setSelectedCircumstances(safeNext);
    await setCircumstances(safeNext);
  }

  function updateSettings(patch: Partial<NotificationSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function updateTimeAt(index: number, time: string) {
    setSettings((prev) => {
      const times = [...prev.times];
      times[index] = time;
      return { ...prev, times };
    });
  }

  function addCustomTime() {
    setSettings((prev) => ({ ...prev, times: [...prev.times, '12:00'] }));
  }

  function removeCustomTime(index: number) {
    setSettings((prev) => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    const [circumstances, events] = await Promise.all([getCircumstances(), getEvents()]);
    await setNotificationSettings(settings);
    const result = await rescheduleAllNotifications(settings, circumstances, events);

    if (settings.enabled && result.scheduledCount === 0 && result.skippedTimes.length === 0) {
      setSaveStatus({ kind: 'permission_denied' });
      updateSettings({ enabled: false });
      await setNotificationSettings({ ...settings, enabled: false });
      return;
    }
    setSaveStatus({
      kind: 'saved',
      scheduledCount: result.scheduledCount,
      skippedTimes: result.skippedTimes,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>Your circumstances</Text>
        <Text style={styles.subtitle}>
          This changes which kind words show up around the app.
        </Text>
        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              selected={selectedCircumstances.includes(c.id)}
              onPress={() => toggleCircumstance(c.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Kind word reminders</Text>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => updateSettings({ enabled })}
            trackColor={{ true: '#C9A94F' }}
          />
        </View>

        {settings.enabled && (
          <>
            <Text style={styles.label}>How often</Text>
            <SegmentedControl
              options={FREQUENCY_OPTIONS}
              value={settings.frequency}
              onChange={(frequency) => updateSettings({ frequency })}
            />

            {(settings.frequency === 'daily' || settings.frequency === 'three_per_week') && (
              <TimeRow
                label={settings.frequency === 'daily' ? 'Notification time' : 'Time (Mon/Wed/Fri)'}
                time={settings.times[0] ?? '09:00'}
                onChange={(time) => updateTimeAt(0, time)}
              />
            )}

            {settings.frequency === 'custom' && (
              <>
                {settings.times.map((time, index) => (
                  <View key={index} style={styles.customTimeRow}>
                    <View style={styles.customTimeField}>
                      <TimeRow
                        label={`Time ${index + 1}`}
                        time={time}
                        onChange={(t) => updateTimeAt(index, t)}
                      />
                    </View>
                    {settings.times.length > 1 && (
                      <Pressable onPress={() => removeCustomTime(index)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                {settings.times.length < 5 && (
                  <Pressable onPress={addCustomTime} style={styles.addTimeButton}>
                    <Text style={styles.addTimeButtonText}>+ Add another time</Text>
                  </Pressable>
                )}
              </>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>Quiet hours</Text>
            <Text style={styles.subtitle}>
              We won't schedule reminders inside this window.
            </Text>
            <TimeRow
              label="Starts"
              time={settings.quietHoursStart}
              onChange={(time) => updateSettings({ quietHoursStart: time })}
            />
            <TimeRow
              label="Ends"
              time={settings.quietHoursEnd}
              onChange={(time) => updateSettings({ quietHoursEnd: time })}
            />

            <Text style={[styles.label, { marginTop: 20 }]}>Lock screen</Text>
            <SegmentedControl
              options={VISIBILITY_OPTIONS}
              value={settings.lockScreenVisibility}
              onChange={(lockScreenVisibility) => updateSettings({ lockScreenVisibility })}
            />
          </>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>

        {saveStatus.kind === 'saved' && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {saveStatus.scheduledCount > 0
                ? `Saved. Scheduled ${saveStatus.scheduledCount} reminder${saveStatus.scheduledCount === 1 ? '' : 's'}.`
                : 'Saved. Reminders are turned off.'}
            </Text>
            {saveStatus.skippedTimes.length > 0 && (
              <Text style={styles.statusWarning}>
                Skipped {saveStatus.skippedTimes.join(', ')} — inside your quiet hours.
              </Text>
            )}
          </View>
        )}

        {saveStatus.kind === 'permission_denied' && (
          <View style={styles.statusBox}>
            <Text style={styles.statusWarning}>
              Notifications are turned off for Kindwords in your phone's settings. Please
              allow them there, then try saving again.
            </Text>
          </View>
        )}

        <Pressable onPress={onResetOnboarding} style={styles.resetLink}>
          <Text style={styles.resetLinkText}>Redo welcome setup</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EC',
  },
  content: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A3A3A',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3A3A3A',
  },
  subtitle: {
    fontSize: 13,
    color: '#6A6A6A',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8DFC8',
    marginVertical: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3A',
    marginBottom: 8,
  },
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customTimeField: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 8,
    padding: 8,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#B5563C',
  },
  addTimeButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addTimeButtonText: {
    color: '#8A6D1F',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#C9A94F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBox: {
    marginTop: 16,
  },
  statusText: {
    fontSize: 13,
    color: '#5A7A4A',
    textAlign: 'center',
  },
  statusWarning: {
    fontSize: 13,
    color: '#B5563C',
    textAlign: 'center',
    marginTop: 4,
  },
  resetLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  resetLinkText: {
    fontSize: 13,
    color: '#9A9A9A',
    textDecorationLine: 'underline',
  },
});
