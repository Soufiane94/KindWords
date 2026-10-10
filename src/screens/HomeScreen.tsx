// Main screen: shows one quote matched to the user's circumstances, with a
// button to see another one and actions to save, send to someone, or say
// "not for me". Phase 7 adds the optional daily check-in at the top and a
// gentle "Not today" at the bottom to pause reminders until tomorrow.

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import CheckInPrompt from '../components/CheckInPrompt';
import WorldBackground from '../components/WorldBackground';
import { getRandomQuote, loadQuotePrefs, Quote, QuotePrefs } from '../services/quotes';
import {
  getActiveSnoozeUntil,
  getCheckInEnabled,
  getCircumstances,
  getFavoriteIds,
  getNotificationSettings,
  getQuoteLanguage,
  getTodayCheckIn,
  markNotForMe,
  setSnoozeUntil,
  setTodayCheckIn,
  toggleFavorite,
  TodayCheckIn,
} from '../services/storage';
import { computeSnoozeUntil, describePausedUntil, rescheduleAllNotifications } from '../services/notifications';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import type { Language } from '../data/languages';
import type { CheckInMood } from '../data/checkIn';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

// How long the little "Got it" line stays after "Not for me".
const THANKS_VISIBLE_MS = 4000;

export default function HomeScreen() {
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [quoteLanguage, setQuoteLanguage] = useState<Language>('en');
  const [prefs, setPrefs] = useState<QuotePrefs>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkInEnabled, setCheckInEnabled] = useState(false);
  const [checkIn, setCheckIn] = useState<TodayCheckIn | null>(null);
  const [remindersOn, setRemindersOn] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);
  const [showNotForMeThanks, setShowNotForMeThanks] = useState(false);
  const quoteRef = useRef<Quote | null>(null);
  const thanksTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { world } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  // The focus reload below reads the current quote through this, so it
  // doesn't need `quote` as a dependency (and re-run on every new quote).
  useEffect(() => {
    quoteRef.current = quote;
  }, [quote]);

  // Reloaded every time Home comes into view, so changes made on other
  // tabs (circumstances, quote language, reminders) show up here too.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getCircumstances(),
        getQuoteLanguage(),
        loadQuotePrefs(),
        getFavoriteIds(),
        getCheckInEnabled(),
        getTodayCheckIn(),
        getNotificationSettings(),
        getActiveSnoozeUntil(),
      ]).then(([ids, language, loadedPrefs, favoriteIds, enabled, todayCheckIn, settings, snooze]) => {
        if (!active) return;
        setCircumstances(ids);
        setQuoteLanguage(language);
        setPrefs(loadedPrefs);
        setCheckInEnabled(enabled);
        setCheckIn(todayCheckIn);
        setRemindersOn(settings.enabled);
        setPausedUntil(snooze);

        // Keep the quote on screen unless the quote language changed (or it
        // was marked "not for me" elsewhere) — then pick a fresh one.
        const current = quoteRef.current;
        const keep =
          current && current.language === language && !loadedPrefs.hiddenIds?.includes(current.id);
        const next = keep ? current : getRandomQuote(ids, language, loadedPrefs);
        setQuote(next);
        setIsFavorite(favoriteIds.includes(next.id));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => () => clearTimeout(thanksTimer.current), []);

  function showQuote(next: Quote) {
    setQuote(next);
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(next.id)));
  }

  function showAnotherQuote() {
    showQuote(getRandomQuote(circumstances, quoteLanguage, { ...prefs, avoidIds: quote ? [quote.id] : [] }));
  }

  async function handleToggleFavorite() {
    if (!quote) return;
    const nowFavorite = await toggleFavorite(quote.id);
    setIsFavorite(nowFavorite);
  }

  function handleSend() {
    if (quote) navigation.navigate('SendKindWord', { quoteId: quote.id });
  }

  async function handleNotForMe() {
    if (!quote) return;
    await markNotForMe(quote);
    const nextPrefs = await loadQuotePrefs();
    setPrefs(nextPrefs);
    showQuote(getRandomQuote(circumstances, quoteLanguage, { ...nextPrefs, avoidIds: [quote.id] }));

    setShowNotForMeThanks(true);
    clearTimeout(thanksTimer.current);
    thanksTimer.current = setTimeout(() => setShowNotForMeThanks(false), THANKS_VISIBLE_MS);

    // So that quote isn't still waiting in an upcoming notification or on
    // the widget.
    rescheduleAllNotifications().catch(() => {});
    refreshKindWordWidget();
  }

  async function handleCheckIn(mood: CheckInMood) {
    await setTodayCheckIn(mood);
    setCheckIn({ mood });
    const nextPrefs = { ...prefs, checkInMood: mood };
    setPrefs(nextPrefs);
    showQuote(getRandomQuote(circumstances, quoteLanguage, { ...nextPrefs, avoidIds: quote ? [quote.id] : [] }));
    // Today's remaining kind words can fit the answer too.
    rescheduleAllNotifications().catch(() => {});
  }

  async function handleCheckInNotNow() {
    await setTodayCheckIn(null);
    setCheckIn({ mood: null });
  }

  async function handleNotToday() {
    const until = computeSnoozeUntil('tomorrow');
    await setSnoozeUntil(until);
    setPausedUntil(until);
    rescheduleAllNotifications().catch(() => {});
  }

  async function handleResume() {
    await setSnoozeUntil(null);
    setPausedUntil(null);
    rescheduleAllNotifications().catch(() => {});
  }

  // Ask until it's answered or skipped for today; once answered, keep a
  // small line showing the answer so it can be changed.
  const showCheckIn = checkInEnabled && (checkIn === null || checkIn.mood !== null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        {showCheckIn && (
          <CheckInPrompt mood={checkIn?.mood ?? null} onAnswer={handleCheckIn} onNotNow={handleCheckInNotNow} />
        )}
        <Text style={styles.heading}>{t('home.heading')}</Text>
        {quote ? (
          <>
            <QuoteCard quote={quote} />
            <QuoteActions
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onSend={handleSend}
              onNotForMe={handleNotForMe}
            />
            {showNotForMeThanks && <Text style={styles.thanks}>{t('home.notForMeThanks')}</Text>}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={showAnotherQuote}>
          <Text style={styles.buttonText}>{t('home.anotherKindWord')}</Text>
        </Pressable>

        {remindersOn &&
          (pausedUntil ? (
            <View style={styles.pauseRow}>
              <Text style={styles.pauseText}>{describePausedUntil(pausedUntil)}</Text>
              <Pressable onPress={handleResume} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.pauseLink}>{t('home.resume')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleNotToday} style={styles.pauseRow} accessibilityRole="button">
              <Text style={styles.pauseLink}>{t('home.notToday')}</Text>
            </Pressable>
          ))}
      </View>
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
    // Grows to fill the screen so short content stays centered, but can
    // still scroll when the check-in and a long quote don't fit.
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    heading: {
      fontSize: 16,
      color: colors.mutedText,
      marginBottom: 20,
      letterSpacing: 0.5,
      ...headingFont(world),
    },
    thanks: {
      marginTop: 8,
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    footer: {
      padding: 24,
      paddingTop: 8,
    },
    button: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
    pauseRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 14,
    },
    pauseText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginRight: 8,
    },
    pauseLink: {
      fontSize: 13,
      color: colors.secondaryText,
      textDecorationLine: 'underline',
    },
  });
}
