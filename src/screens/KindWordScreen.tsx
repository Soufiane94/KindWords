// Shown when the user taps a notification: the exact quote that was sent
// (never a new random one), with the same save/share actions as Home, plus
// a way to pause reminders for a while or hide this one quote for good.
//
// If the lock screen was set to hide notification text, Android already
// keeps it hidden there — this screen only ever opens after the phone is
// unlocked and the app is in front of the user, so it's always safe to show
// the full quote here.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import SnoozeMenu from '../components/SnoozeMenu';
import WorldBackground from '../components/WorldBackground';
import { getQuoteById } from '../services/quotes';
import {
  getFavoriteIds,
  toggleFavorite,
  hideQuoteForever,
  setSnoozeUntil,
  getCircumstances,
  getNotificationSettings,
  getEvents,
} from '../services/storage';
import { shareViewAsImage } from '../services/share';
import {
  rescheduleAllNotifications,
  computeSnoozeUntil,
  describeSnoozeDuration,
  SnoozeDuration,
} from '../services/notifications';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'KindWord'>;

export default function KindWordScreen({ route, navigation }: Props) {
  const { quoteId } = route.params;
  const quote = useMemo(() => getQuoteById(quoteId), [quoteId]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const cardRef = useRef<View>(null);
  const { world } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  useEffect(() => {
    if (!quote) return;
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(quote.id)));
  }, [quote]);

  async function handleToggleFavorite() {
    if (!quote) return;
    const nowFavorite = await toggleFavorite(quote.id);
    setIsFavorite(nowFavorite);
  }

  async function handleShare() {
    try {
      await shareViewAsImage(cardRef);
    } catch {
      Alert.alert("Couldn't share that", 'Please try again in a moment.');
    }
  }

  async function reschedule() {
    const [circumstances, settings, events] = await Promise.all([
      getCircumstances(),
      getNotificationSettings(),
      getEvents(),
    ]);
    await rescheduleAllNotifications(settings, circumstances, events).catch(() => {
      // Non-fatal: the snooze/hide choice is still saved either way.
    });
  }

  async function handleSnooze(duration: SnoozeDuration) {
    setMenuVisible(false);
    await setSnoozeUntil(computeSnoozeUntil(duration));
    await reschedule();
    Alert.alert('Done', describeSnoozeDuration(duration));
  }

  async function handleHideQuote() {
    if (!quote) return;
    setMenuVisible(false);
    await hideQuoteForever(quote.id);
    Alert.alert('Got it', "We won't send that one again.");
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kind word</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {quote ? (
        <>
          <View style={styles.content}>
            <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
              <QuoteCard quote={quote} />
            </View>
            <QuoteActions
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onShare={handleShare}
              onSnooze={() => setMenuVisible(true)}
            />
          </View>

          <SnoozeMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            onSnooze={handleSnooze}
            onHideQuote={handleHideQuote}
          />
        </>
      ) : (
        <View style={styles.content}>
          <Text style={styles.missingText}>This kind word isn't available anymore.</Text>
        </View>
      )}
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
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    closeButton: {
      padding: 6,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    cardWrapper: {
      width: '100%',
      backgroundColor: colors.background,
    },
    missingText: {
      fontSize: 15,
      color: colors.mutedText,
      textAlign: 'center',
    },
  });
}
