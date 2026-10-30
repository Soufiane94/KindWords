// Shown when the user taps a notification: the exact quote that was sent
// (never a new random one) — or, since Phase 7, the personal note — with
// save/send actions like Home, "Not for me", and a way to pause reminders
// for a while. A personal note keeps a plain "Share" (as a picture) instead
// of "Send", since it's the user's own and not a kind word to pass on.
//
// If the lock screen was set to hide notification text, Android already
// keeps it hidden there — this screen only ever opens after the phone is
// unlocked and the app is in front of the user, so it's always safe to show
// the full text here.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import SnoozeMenu from '../components/SnoozeMenu';
import WorldBackground from '../components/WorldBackground';
import Mascot from '../components/Mascot';
import { useCardShare } from '../components/useCardShare';
import { getQuoteById } from '../services/quotes';
import {
  getFavoriteIds,
  getNotes,
  markNotForMe,
  PersonalNote,
  setSnoozeUntil,
  toggleFavorite,
} from '../services/storage';
import {
  rescheduleAllNotifications,
  computeSnoozeUntil,
  describeSnoozeDuration,
  noteTitle,
  SnoozeDuration,
} from '../services/notifications';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatDateDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'KindWord'>;

export default function KindWordScreen({ route, navigation }: Props) {
  const { quoteId, noteId } = route.params;
  const quote = useMemo(() => (quoteId ? getQuoteById(quoteId) : undefined), [quoteId]);
  const [note, setNote] = useState<PersonalNote | undefined>();
  const [noteLoaded, setNoteLoaded] = useState(!noteId);
  const [isFavorite, setIsFavorite] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { cardRef, capturing, share } = useCardShare();
  const { world } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  useEffect(() => {
    if (!quote) return;
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(quote.id)));
  }, [quote]);

  useEffect(() => {
    if (!noteId) return;
    getNotes().then((notes) => {
      setNote(notes.find((n) => n.id === noteId));
      setNoteLoaded(true);
    });
  }, [noteId]);

  // A note is signed by whoever it's from: the loved one, or "You" and the
  // day it was written.
  function noteAuthor(n: PersonalNote): string {
    if (n.kind === 'loved_one') return n.from || t('notes.someoneWhoLovesYou');
    return t('kindWord.fromYouOn', { date: formatDateDisplay(n.createdOn, language) });
  }

  async function handleToggleFavorite() {
    if (!quote) return;
    const nowFavorite = await toggleFavorite(quote.id);
    setIsFavorite(nowFavorite);
  }

  async function handleSnooze(duration: SnoozeDuration) {
    setMenuVisible(false);
    await setSnoozeUntil(computeSnoozeUntil(duration));
    await rescheduleAllNotifications().catch(() => {
      // Non-fatal: the snooze choice is still saved either way.
    });
    Alert.alert(t('kindWord.snoozeDoneTitle'), describeSnoozeDuration(duration));
  }

  async function handleNotForMe() {
    if (!quote) return;
    await markNotForMe(quote);
    rescheduleAllNotifications().catch(() => {});
    refreshKindWordWidget();
    Alert.alert(t('kindWord.notForMeTitle'), t('kindWord.notForMeMessage'), [
      { text: t('common.ok'), onPress: () => navigation.goBack() },
    ]);
  }

  const card = quote ?? (note ? { id: note.id, text: note.text, author: noteAuthor(note) } : undefined);
  // "A kind word from Wafi" (9O), but a note keeps the heading of its
  // notification ("A message from Mom"): it comes from the user or someone
  // they love, never from Wafi. Blank while the note loads.
  const title = noteId ? (note ? noteTitle(note) : '') : t('kindWord.headerTitle');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {card ? (
        <>
          {/* Scrolls when a long kind word and large text don't fit. */}
          <ScrollView contentContainerStyle={styles.content}>
            <Mascot kindWord={card}>
              <QuoteCard quote={card} />
            </Mascot>
            {quote ? (
              <QuoteActions
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
                onSend={() => navigation.navigate('SendKindWord', { quoteId: quote.id })}
                onNotForMe={handleNotForMe}
                onSnooze={() => setMenuVisible(true)}
              />
            ) : (
              <QuoteActions onShare={share} onSnooze={() => setMenuVisible(true)} />
            )}
          </ScrollView>

          {/* The picture a note's "Share" sends: the card framed in its
              world, like on the Send screen. Kept out of sight, since on
              this screen the card already sits in its world. */}
          {!quote && (
            <View
              style={styles.offscreen}
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <QuoteCard quote={card} framed ref={cardRef} capturing={capturing} />
            </View>
          )}

          <SnoozeMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onSnooze={handleSnooze} />
        </>
      ) : noteLoaded ? (
        <View style={styles.missing}>
          <Text style={styles.missingText}>{t('kindWord.missingText')}</Text>
        </View>
      ) : null}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    headerTitle: {
      flexShrink: 1,
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    closeButton: {
      padding: 6,
      marginLeft: 12,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    // Grows to fill the screen so a short kind word stays centered.
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    missing: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    missingText: {
      fontSize: 15,
      color: colors.mutedText,
      textAlign: 'center',
    },
    // Just past the screen's right edge: laid out like any other view, so
    // it can be captured, but never seen. As wide as the Send screen's
    // preview, so pictures come out the same size from both.
    offscreen: {
      position: 'absolute',
      top: 0,
      left: '100%',
      width: '100%',
      paddingHorizontal: 24,
    },
  });
}
