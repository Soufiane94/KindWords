// Settings screen: appearance (Phase 4), circumstances (Phase 1), plus
// notification preferences (Phase 2) — frequency, quiet hours, and
// lock-screen visibility.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import { LANGUAGE_OPTIONS, Language } from '../data/languages';
import i18n from '../i18n';
import {
  getCircumstances,
  setCircumstances,
  getNotificationSettings,
  setNotificationSettings,
  getEvents,
  getUiLanguage,
  setUiLanguage,
  getQuoteLanguage,
  setQuoteLanguage,
  NotificationSettings,
  Frequency,
  LockScreenVisibility,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import CircumstanceChip from '../components/CircumstanceChip';
import SegmentedControl from '../components/SegmentedControl';
import TimeRow from '../components/TimeRow';
import WorldBackground from '../components/WorldBackground';
import { useTheme, WORLD_OPTIONS } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

const FREQUENCY_VALUES: Frequency[] = ['daily', 'three_per_week', 'custom'];
const VISIBILITY_VALUES: LockScreenVisibility[] = ['private', 'public'];

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
  const [uiLanguage, setUiLanguageState] = useState<Language>('en');
  const [quoteLanguage, setQuoteLanguageState] = useState<Language>('en');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const { world, colors, worldId, setWorldId } = useTheme();
  const { t } = useTranslation();
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

  async function handleUiLanguageChange(language: Language) {
    setUiLanguageState(language);
    await setUiLanguage(language);
    await i18n.changeLanguage(language);
  }

  async function handleQuoteLanguageChange(language: Language) {
    setQuoteLanguageState(language);
    await setQuoteLanguage(language);
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
    const result = await rescheduleAllNotifications(settings, circumstances, events, quoteLanguage);

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
              onPress={() => setWorldId(w.id)}
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

            <Text style={[styles.label, { marginTop: 20 }]}>{t('settings.lockScreen')}</Text>
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
            <Text style={styles.statusText}>
              {saveStatus.scheduledCount > 0
                ? t(saveStatus.scheduledCount === 1 ? 'settings.scheduledOne' : 'settings.scheduledOther', {
                    count: saveStatus.scheduledCount,
                  })
                : t('settings.savedOff')}
            </Text>
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
