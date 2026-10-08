// Main screen: shows one quote matched to the user's circumstances,
// with a button to see another one, and actions to save or share it.

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import { getRandomQuote, Quote } from '../services/quotes';
import { getCircumstances, getFavoriteIds, toggleFavorite } from '../services/storage';
import { shareViewAsImage } from '../services/share';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/themes';

export default function HomeScreen() {
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const cardRef = useRef<View>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    getCircumstances().then((ids) => {
      setCircumstances(ids);
      setQuote(getRandomQuote(ids));
    });
  }, []);

  useEffect(() => {
    if (!quote) return;
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(quote.id)));
  }, [quote]);

  const showAnotherQuote = useCallback(() => {
    setQuote((current) => getRandomQuote(circumstances, current?.id));
  }, [circumstances]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>A kind word for you</Text>
        {quote ? (
          <>
            <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
              <QuoteCard quote={quote} />
            </View>
            <QuoteActions
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onShare={handleShare}
            />
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={showAnotherQuote}>
          <Text style={styles.buttonText}>Another kind word</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    heading: {
      fontSize: 16,
      color: colors.mutedText,
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    cardWrapper: {
      width: '100%',
      // Explicit background (not just inherited) so the captured share
      // image doesn't get black corners where the card's rounding shows
      // through a transparent view.
      backgroundColor: colors.background,
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
    buttonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
