// The welcome a new user goes through, in three steps (9O):
// 1. which circumstances feel like theirs right now (Phase 1), so kind
//    words can fit their life; no world to choose, a new one comes by
//    itself each day (9M);
// 2. when Wafi should send kind words: the same reminder settings as in
//    Settings, suggested on for someone who has never set them;
// 3. a hello from Wafi, the pup, in the middle of the screen.
// Circumstances are saved on leaving step 1 and reminders on leaving step
// 2, so the first kind words can be planned (and step 3 can say when the
// first one comes). The welcome only counts as done after step 3.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CIRCUMSTANCES } from '../data/circumstances';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getWelcomeNotificationSettings,
  NotificationSettings,
  setCircumstances,
  setNotificationSettings,
  setOnboardingDone,
  tidyNotificationSettings,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import CircumstanceChip from '../components/CircumstanceChip';
import ReminderSettingsForm from '../components/ReminderSettingsForm';
import MascotWelcome from '../components/MascotWelcome';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatMomentDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { bodyFont, headingFont } from '../theme/fontStyle';

type Props = {
  onDone: () => void;
};

type Step = 1 | 2 | 3;
const STEPS: Step[] = [1, 2, 3];

export default function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // When the first kind word is planned for, once step 2 has saved.
  const [firstAt, setFirstAt] = useState<number | null>(null);
  // Stops a second tap while step 2 saves (the permission prompt can take
  // a while).
  const [saving, setSaving] = useState(false);
  const { world } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  useEffect(() => {
    getWelcomeNotificationSettings().then(setSettings);
  }, []);

  function goBack() {
    setStep((current) => (current === 3 ? 2 : 1));
  }

  // Android's back button goes back a step, rather than leaving the app.
  useEffect(() => {
    if (step === 1) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep((current) => (current === 3 ? 2 : 1));
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCircumstancesContinue() {
    // Default to "other" so we can still always find a matching quote.
    const chosen = selected.length > 0 ? selected : ['other'];
    await setCircumstances(chosen);
    setStep(2);
  }

  // Saves the reminders and plans the first kind words. With reminders on,
  // this is where the phone asks for permission to send notifications: the
  // user has just chosen to get them, so it never comes unasked.
  async function handleRemindersContinue() {
    if (saving) return;
    setSaving(true);
    try {
      const cleaned = tidyNotificationSettings(settings);
      setSettings(cleaned);
      await setNotificationSettings(cleaned);
      const result = await rescheduleAllNotifications({ askPermission: true });
      if (result.status === 'permission_denied') {
        // Reminders go off, and the step says why; the next "Continue"
        // moves on without them.
        const off = { ...cleaned, enabled: false };
        setSettings(off);
        await setNotificationSettings(off);
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      setFirstAt(result.status === 'scheduled' ? result.nextAt : null);
      setStep(3);
    } catch {
      // Whatever went wrong, the welcome never gets stuck here: the app
      // plans kind words again once it's done, and Settings can fix the rest.
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  async function handleStart() {
    await setOnboardingDone(true);
    onDone();
  }

  // The world's background and the step header stay put from one step to
  // the next; only what's under them changes. Each step sits in its own
  // slot below, so it starts fresh (scrolled to the top) when it comes in.
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        {step > 1 && (
          <Pressable
            onPress={goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.back')}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹ {t('onboarding.back')}</Text>
          </Pressable>
        )}
        <View style={styles.dots} accessible accessibilityLabel={t('onboarding.step', { step, total: STEPS.length })}>
          {STEPS.map((n) => (
            <View key={n} style={[styles.dot, n === step && styles.dotCurrent]} />
          ))}
        </View>
      </View>

      {step === 1 && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              {t('onboarding.title')}
            </Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

            <View style={styles.chipRow}>
              {CIRCUMSTANCES.map((c) => (
                <CircumstanceChip
                  key={c.id}
                  label={t(`circumstances.${c.id}`)}
                  emoji={c.emoji}
                  selected={selected.includes(c.id)}
                  onPress={() => toggle(c.id)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.button} onPress={handleCircumstancesContinue} accessibilityRole="button">
              <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
            </Pressable>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              {t('onboarding.remindersTitle')}
            </Text>
            <Text style={styles.subtitle}>{t('onboarding.remindersSubtitle')}</Text>

            <ReminderSettingsForm settings={settings} onChange={setSettings} />

            {permissionDenied && <Text style={styles.warning}>{t('onboarding.permissionDenied')}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.button, saving && styles.buttonBusy]}
              onPress={handleRemindersContinue}
              accessibilityRole="button"
              accessibilityState={{ busy: saving }}
            >
              <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
            </Pressable>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <ScrollView contentContainerStyle={styles.welcomeContent}>
            <MascotWelcome>
              <View style={styles.card}>
                <Text style={styles.cardTitle} accessibilityRole="header">
                  {t('onboarding.welcomeTitle')}
                </Text>
                <Text style={styles.cardText}>{t('onboarding.welcomeBody')}</Text>
              </View>
            </MascotWelcome>
            <Text style={styles.welcomeNote}>
              {firstAt
                ? t('onboarding.welcomeFirst', { when: formatMomentDisplay(new Date(firstAt), language) })
                : t('onboarding.welcomeHome')}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.button} onPress={handleStart} accessibilityRole="button">
              <Text style={styles.buttonText}>{t('onboarding.start')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function createStyles(world: World) {
  const { colors, card } = world;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // The step dots stay centered; "Back" sits on their left.
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    backButton: {
      position: 'absolute',
      left: 16,
      top: 8,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    backText: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.divider,
    },
    dotCurrent: {
      width: 22,
      backgroundColor: colors.accent,
    },
    content: {
      padding: 24,
      paddingTop: 20,
    },
    title: {
      fontSize: 26,
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
      ...headingFont(world),
    },
    subtitle: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 22,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    warning: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 19,
    },
    // Grows to fill the screen, so Wafi and the card sit in the middle,
    // and scrolls when large text doesn't fit.
    welcomeContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    // Drawn like the quote card (QuoteCard), with room at the top for
    // Wafi's paws.
    card: {
      backgroundColor: colors.card,
      borderRadius: card.borderRadius,
      borderWidth: card.borderWidth,
      borderColor: card.borderColor,
      paddingTop: 40,
      paddingBottom: 32,
      paddingHorizontal: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: card.shadowOpacity,
      shadowRadius: 12,
      elevation: card.elevation,
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 24,
      color: colors.primaryText,
      textAlign: 'center',
      marginBottom: 12,
      ...headingFont(world),
    },
    cardText: {
      fontSize: 18,
      lineHeight: 27,
      textAlign: 'center',
      color: colors.primaryText,
      fontWeight: world.fonts.body ? undefined : '500',
      ...bodyFont(world),
    },
    welcomeNote: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 22,
    },
    footer: {
      padding: 24,
    },
    button: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    buttonBusy: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
  });
}
