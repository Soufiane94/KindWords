// Settings screen: circumstances (Phase 1), appearance (Phase 4/5C),
// languages (Phase 6), notification preferences (Phase 2) — frequency,
// quiet hours, lock-screen visibility, gentle pacing — and personal
// touches (Phase 7): the daily check-in and undoing "not for me".

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import { LANGUAGE_OPTIONS, Language } from '../data/languages';
import i18n, { useUiLanguage } from '../i18n';
import {
  getCircumstances,
  setCircumstances,
  getNotificationSettings,
  setNotificationSettings,
  getUiLanguage,
  setUiLanguage,
  getQuoteLanguage,
  setQuoteLanguage,
  getCheckInEnabled,
  setCheckInEnabled,
  clearTodayCheckIn,
  forgetNotForMe,
  NotificationSettings,
  Frequency,
  LockScreenVisibility,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/storage';
import { describePausedUntil, rescheduleAllNotifications, RescheduleResult } from '../services/notifications';
import { regularTimes } from '../services/reminderPlan';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import CircumstanceChip from '../components/CircumstanceChip';
import SegmentedControl from '../components/SegmentedControl';
import TimeRow from '../components/TimeRow';
import WorldBackground from '../components/WorldBackground';
import { useTheme, WORLD_OPTIONS, WorldId } from '../theme/ThemeContext';
import { formatMomentDisplay, formatTimeDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

const FREQUENCY_VALUES: Frequency[] = ['daily', 'three_per_week', 'custom'];
const VISIBILITY_VALUES: LockScreenVisibility[] = ['private', 'public'];

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saved'; lines: string[]; skippedTimes: string[] }
  | { kind: 'permission_denied' };

type Props = {
  // Like an Angular @Output(): SettingsScreen doesn't know what happens
  // after reset, it just tells the parent (RootNavigator) that it should.
  onResetOnboarding: () => void;
};

export default function SettingsScreen({ onResetOnboarding }: Props) {
  const [selectedCircumstances, setSelectedCircumstances] = useState<string[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [uiLanguage, setUiLanguageState] = useState<Language>('en');
  const [quoteLanguage, setQuoteLanguageState] = useState<Language>('en');
  const [checkInEnabled, setCheckInEnabledState] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const { world, colors, worldId, setWorldId } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  const FREQUENCY_OPTIONS = FREQUENCY_VALUES.map((value) => ({
    value,
    label: t(`settings.frequency.${value}`),
  }));
  const VISIBILITY_OPTIONS = VISIBILITY_VALUES.map((value) => ({
    value,
    label: t(`settings.visibility.${value}`),
  }));

  useFocusEffect(
    useCallback(() => {
      getCircumstances().then(setSelectedCircumstances);
      getNotificationSettings().then(setSettings);
      getUiLanguage().then(setUiLanguageState);
      getQuoteLanguage().then(setQuoteLanguageState);
      getCheckInEnabled().then(setCheckInEnabledState);
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

  // The home screen widget shows the world's colors and the chosen
  // languages, so it's redrawn whenever one of those changes.
  function handleWorldChange(id: WorldId) {
    setWorldId(id);
    refreshKindWordWidget();
  }

  async function handleUiLanguageChange(next: Language) {
    setUiLanguageState(next);
    await setUiLanguage(next);
    await i18n.changeLanguage(next);
    refreshKindWordWidget();
  }

  async function handleQuoteLanguageChange(next: Language) {
    setQuoteLanguageState(next);
    await setQuoteLanguage(next);
    refreshKindWordWidget();
  }

  async function handleCheckInToggle(enabled: boolean) {
    setCheckInEnabledState(enabled);
    await setCheckInEnabled(enabled);
    // Turning it off also forgets today's answer, so it stops shaping
    // which kind words get picked straight away.
    if (!enabled) await clearTodayCheckIn();
  }

  function handleForgetNotForMe() {
    Alert.alert(t('settings.forgetNotForMeConfirmTitle'), t('settings.forgetNotForMeConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.forgetNotForMeButton'),
        onPress: async () => {
          await forgetNotForMe();
          rescheduleAllNotifications().catch(() => {});
          Alert.alert(t('settings.forgetNotForMeDone'));
        },
      },
    ]);
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

  // A plain-language summary of what saving set up ("A kind word every day
  // at 9:00 AM", the next one, any event reminders...) rather than one raw
  // count that mixed repeating and one-off reminders together.
  function describeSchedule(
    saved: NotificationSettings,
    result: Extract<RescheduleResult, { status: 'scheduled' }>
  ): string[] {
    const lines: string[] = [];
    const sentTimes = regularTimes(saved)
      .filter((time) => !result.skippedTimes.includes(time))
      .map((time) => formatTimeDisplay(time, language));

    if (sentTimes.length === 0) {
      lines.push(t('settings.summaryNoTimes'));
    } else if (saved.frequency === 'daily') {
      lines.push(t('settings.summaryDaily', { time: sentTimes[0] }));
    } else if (saved.frequency === 'three_per_week') {
      lines.push(t('settings.summaryThreePerWeek', { time: sentTimes[0] }));
    } else {
      lines.push(t('settings.summaryCustom', { times: sentTimes.join(', ') }));
    }

    if (result.pausedUntil) lines.push(describePausedUntil(result.pausedUntil));
    if (result.eventReminderCount > 0) {
      lines.push(
        t(result.eventReminderCount === 1 ? 'settings.eventRemindersOne' : 'settings.eventRemindersOther', {
          count: result.eventReminderCount,
        })
      );
    }
    if (result.futureNoteCount > 0) {
      lines.push(
        t(result.futureNoteCount === 1 ? 'settings.futureNotesOne' : 'settings.futureNotesOther', {
          count: result.futureNoteCount,
        })
      );
    }
    if (result.nextAt) {
      lines.push(t('settings.nextAt', { when: formatMomentDisplay(new Date(result.nextAt), language) }));
    }
    return lines;
  }

  async function handleSave() {
    // Duplicate custom times would just send two kind words at once, so the
    // list is tidied (and put in order) before saving. "Daily" and "3x a
    // week" only use the first time, so their list is left as it is.
    const cleaned: NotificationSettings =
      settings.frequency === 'custom' ? { ...settings, times: [...new Set(settings.times)].sort() } : settings;
    setSettings(cleaned);
    await setNotificationSettings(cleaned);

    const result = await rescheduleAllNotifications({ askPermission: true });

    if (result.status === 'permission_denied') {
      setSaveStatus({ kind: 'permission_denied' });
      updateSettings({ enabled: false });
      await setNotificationSettings({ ...cleaned, enabled: false });
      return;
    }
    if (result.status === 'off') {
      setSaveStatus({ kind: 'saved', lines: [t('settings.savedOff')], skippedTimes: [] });
      return;
    }
    setSaveStatus({
      kind: 'saved',
      lines: describeSchedule(cleaned, result),
      skippedTimes: result.skippedTimes.map((time) => formatTimeDisplay(time, language)),
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <Text style={styles.sectionTitle}>{t('settings.circumstancesTitle')}</Text>
        <Text style={styles.subtitle}>{t('settings.circumstancesSubtitle')}</Text>
        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={t(`circumstances.${c.id}`)}
              emoji={c.emoji}
              selected={selectedCircumstances.includes(c.id)}
              onPress={() => toggleCircumstance(c.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('settings.appearanceTitle')}</Text>
        <Text style={styles.subtitle}>{t('settings.appearanceSubtitle')}</Text>
        <View style={styles.chipRow}>
          {WORLD_OPTIONS.map((w) => (
            <CircumstanceChip
              key={w.id}
              label={t(`worlds.${w.id}`)}
              emoji={w.emoji}
              selected={worldId === w.id}
              onPress={() => handleWorldChange(w.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('settings.languageTitle')}</Text>
        <Text style={styles.label}>{t('settings.uiLanguageLabel')}</Text>
        <Text style={styles.subtitle}>{t('settings.uiLanguageSubtitle')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((l) => (
            <CircumstanceChip
              key={l.id}
              label={l.label}
              emoji={l.emoji}
              selected={uiLanguage === l.id}
              onPress={() => handleUiLanguageChange(l.id)}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>{t('settings.quoteLanguageLabel')}</Text>
        <Text style={styles.subtitle}>{t('settings.quoteLanguageSubtitle')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((l) => (
            <CircumstanceChip
              key={l.id}
              label={l.label}
              emoji={l.emoji}
              selected={quoteLanguage === l.id}
              onPress={() => handleQuoteLanguageChange(l.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('settings.personalTitle')}</Text>
        <View style={[styles.rowBetween, { marginTop: 12, marginBottom: 0 }]}>
          <Text style={styles.toggleLabel}>{t('settings.checkInLabel')}</Text>
          <Switch
            value={checkInEnabled}
            onValueChange={handleCheckInToggle}
            trackColor={{ true: colors.accent }}
          />
        </View>
        <Text style={styles.subtitle}>{t('settings.checkInSubtitle')}</Text>
        <Pressable onPress={handleForgetNotForMe} style={styles.inlineLink}>
          <Text style={styles.inlineLinkText}>{t('settings.forgetNotForMe')}</Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>{t('settings.remindersTitle')}</Text>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => updateSettings({ enabled })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        {settings.enabled && (
          <>
            <Text style={styles.label}>{t('settings.howOften')}</Text>
            <SegmentedControl
              options={FREQUENCY_OPTIONS}
              value={settings.frequency}
              onChange={(frequency) => updateSettings({ frequency })}
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
                      <Pressable onPress={() => removeCustomTime(index)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                {settings.times.length < 5 && (
                  <Pressable onPress={addCustomTime} style={styles.addTimeButton}>
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
              onChange={(time) => updateSettings({ quietHoursStart: time })}
            />
            <TimeRow
              label={t('settings.quietHoursEnds')}
              time={settings.quietHoursEnd}
              onChange={(time) => updateSettings({ quietHoursEnd: time })}
            />

            <View style={[styles.rowBetween, { marginTop: 20, marginBottom: 0 }]}>
              <Text style={styles.toggleLabel}>{t('settings.gentlePacingLabel')}</Text>
              <Switch
                value={settings.gentlePacing}
                onValueChange={(gentlePacing) => updateSettings({ gentlePacing })}
                trackColor={{ true: colors.accent }}
              />
            </View>
            <Text style={styles.subtitle}>{t('settings.gentlePacingSubtitle')}</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>{t('settings.lockScreen')}</Text>
            <SegmentedControl
              options={VISIBILITY_OPTIONS}
              value={settings.lockScreenVisibility}
              onChange={(lockScreenVisibility) => updateSettings({ lockScreenVisibility })}
            />
          </>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>

        {saveStatus.kind === 'saved' && (
          <View style={styles.statusBox}>
            {saveStatus.lines.map((line) => (
              <Text key={line} style={styles.statusText}>
                {line}
              </Text>
            ))}
            {saveStatus.skippedTimes.length > 0 && (
              <Text style={styles.statusWarning}>
                {t('settings.skippedTimes', { times: saveStatus.skippedTimes.join(', ') })}
              </Text>
            )}
          </View>
        )}

        {saveStatus.kind === 'permission_denied' && (
          <View style={styles.statusBox}>
            <Text style={styles.statusWarning}>{t('settings.permissionDenied')}</Text>
          </View>
        )}

        <Pressable onPress={onResetOnboarding} style={styles.resetLink}>
          <Text style={styles.resetLinkText}>{t('settings.resetOnboarding')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(world: World) {
  const { colors } = world;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
      paddingTop: 32,
      paddingBottom: 48,
    },
    title: {
      fontSize: 24,
      color: colors.primaryText,
      marginBottom: 20,
      ...headingFont(world),
    },
    sectionTitle: {
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
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
      backgroundColor: colors.divider,
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
      color: colors.primaryText,
      marginBottom: 8,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginRight: 12,
    },
    inlineLink: {
      alignSelf: 'flex-start',
    },
    inlineLinkText: {
      fontSize: 13,
      color: colors.secondaryText,
      textDecorationLine: 'underline',
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
    saveButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 28,
    },
    saveButtonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
    statusBox: {
      marginTop: 16,
    },
    statusText: {
      fontSize: 13,
      color: colors.success,
      textAlign: 'center',
      marginTop: 2,
    },
    statusWarning: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
      marginTop: 4,
    },
    resetLink: {
      marginTop: 32,
      alignItems: 'center',
    },
    resetLinkText: {
      fontSize: 13,
      color: colors.mutedText,
      textDecorationLine: 'underline',
    },
  });
}
