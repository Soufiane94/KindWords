// The "Wafi kind word reminders" part of Settings (Phase 2 on), which is
// also the second step of the welcome (9O): on or off, how often and when,
// quiet hours, gentle pacing and the lock screen. It only edits the
// settings it's given; saving them, and asking for notification
// permission, is up to the screen showing it.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import SegmentedControl from './SegmentedControl';
import TimeRow from './TimeRow';
import { useTheme } from '../theme/ThemeContext';
import { headingFont } from '../theme/fontStyle';
import type { World } from '../data/worlds';
import type { Frequency, LockScreenVisibility, NotificationSettings } from '../services/storage';

const FREQUENCY_VALUES: Frequency[] = ['daily', 'three_per_week', 'custom'];
const VISIBILITY_VALUES: LockScreenVisibility[] = ['private', 'public'];

type Props = {
  settings: NotificationSettings;
  // Works like a useState setter: gets a function from the current
  // settings to the new ones, so quick changes in a row never undo each
  // other.
  onChange: (update: (current: NotificationSettings) => NotificationSettings) => void;
};

export default function ReminderSettingsForm({ settings, onChange }: Props) {
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  const frequencyOptions = FREQUENCY_VALUES.map((value) => ({
    value,
    label: t(`settings.frequency.${value}`),
  }));
  const visibilityOptions = VISIBILITY_VALUES.map((value) => ({
    value,
    label: t(`settings.visibility.${value}`),
  }));

  function update(patch: Partial<NotificationSettings>) {
    onChange((current) => ({ ...current, ...patch }));
  }

  function updateTimeAt(index: number, time: string) {
    onChange((current) => {
      const times = [...current.times];
      times[index] = time;
      return { ...current, times };
    });
  }

  function addCustomTime() {
    onChange((current) => ({ ...current, times: [...current.times, '12:00'] }));
  }

  function removeCustomTime(index: number) {
    onChange((current) => ({ ...current, times: current.times.filter((_, i) => i !== index) }));
  }

  return (
    <>
      <View style={styles.rowBetween}>
        {/* Can shrink and wrap, so large text never pushes the switch off screen. */}
        <Text style={[styles.sectionTitle, styles.rowTitle]} accessibilityRole="header">
          {t('settings.remindersTitle')}
        </Text>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => update({ enabled })}
          trackColor={{ true: colors.accent }}
          accessibilityLabel={t('settings.remindersTitle')}
        />
      </View>

      {settings.enabled && (
        <>
          <Text style={styles.label}>{t('settings.howOften')}</Text>
          <SegmentedControl
            options={frequencyOptions}
            value={settings.frequency}
            onChange={(frequency) => update({ frequency })}
          />

          {(settings.frequency === 'daily' || settings.frequency === 'three_per_week') && (
            <TimeRow
              label={t(settings.frequency === 'daily' ? 'settings.notificationTime' : 'settings.timeMonWedFri')}
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
                      label={t('settings.timeNumbered', { number: index + 1 })}
                      time={time}
                      onChange={(newTime) => updateTimeAt(index, newTime)}
                    />
                  </View>
                  {settings.times.length > 1 && (
                    <Pressable
                      onPress={() => removeCustomTime(index)}
                      style={styles.removeButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('settings.removeTime', { number: index + 1 })}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {settings.times.length < 5 && (
                <Pressable onPress={addCustomTime} style={styles.addTimeButton} accessibilityRole="button">
                  <Text style={styles.addTimeButtonText}>{t('settings.addAnotherTime')}</Text>
                </Pressable>
              )}
            </>
          )}

          <Text style={[styles.label, { marginTop: 20 }]}>{t('settings.quietHours')}</Text>
          <Text style={styles.subtitle}>{t('settings.quietHoursSubtitle')}</Text>
          <TimeRow
            label={t('settings.quietHoursStarts')}
            time={settings.quietHoursStart}
            onChange={(time) => update({ quietHoursStart: time })}
          />
          <TimeRow
            label={t('settings.quietHoursEnds')}
            time={settings.quietHoursEnd}
            onChange={(time) => update({ quietHoursEnd: time })}
          />

          <View style={[styles.rowBetween, { marginTop: 20, marginBottom: 0 }]}>
            <Text style={styles.toggleLabel}>{t('settings.gentlePacingLabel')}</Text>
            <Switch
              value={settings.gentlePacing}
              onValueChange={(gentlePacing) => update({ gentlePacing })}
              trackColor={{ true: colors.accent }}
              accessibilityLabel={t('settings.gentlePacingLabel')}
            />
          </View>
          <Text style={styles.subtitle}>{t('settings.gentlePacingSubtitle')}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>{t('settings.lockScreen')}</Text>
          <SegmentedControl
            options={visibilityOptions}
            value={settings.lockScreenVisibility}
            onChange={(lockScreenVisibility) => update({ lockScreenVisibility })}
          />
        </>
      )}
    </>
  );
}

function createStyles(world: World) {
  const { colors } = world;
  return StyleSheet.create({
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    rowTitle: {
      flex: 1,
      marginRight: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
      marginBottom: 12,
      lineHeight: 19,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginRight: 12,
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
      color: colors.danger,
    },
    addTimeButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    addTimeButtonText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
