// Main screen: shows one quote matched to the user's circumstances,
// with a button to see another one, and actions to save or share it.

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import WorldBackground from '../components/WorldBackground';
import { getRandomQuote, Quote } from '../services/quotes';
import { getCircumstances, getFavoriteIds, getHiddenQuoteIds, getQuoteLanguage, toggleFavorite } from '../services/storage';
import { shareViewAsImage } from '../services/share';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import type { Language } from '../data/languages';
import { headingFont } from '../theme/fontStyle';

export default function HomeScreen() {
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [quoteLanguage, setQuoteLanguage] = useState<Language>('en');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const cardRef = useRef<View>(null);
  const { world } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  useEffect(() => {
    Promise.all([getCircumstances(), getHiddenQuoteIds(), getQuoteLanguage()]).then(
      ([ids, hidden, language]) => {
        setCircumstances(ids);
        setHiddenIds(hidden);
        setQuoteLanguage(language);
        setQuote(getRandomQuote(ids, language, undefined, hidden));
      }
    );
  }, []);

  useEffect(() => {
    if (!quote) return;
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(quote.id)));
  }, [quote]);

  const showAnotherQuote = useCallback(() => {
    setQuote((current) => getRandomQuote(circumstances, quoteLanguage, current?.id, hiddenIds));
  }, [circumstances, quoteLanguage, hiddenIds]);

  async function handleToggleFavorite() {
    if (!quote) return;
    const nowFavorite = await toggleFavorite(quote.id);
    setIsFavorite(nowFavorite);
  }

  async function handleShare() {
    try {
      await shareViewAsImage(cardRef);
    } catch {
      Alert.alert(t('common.shareErrorTitle'), t('common.shareErrorMessage'));
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.content}>
        <Text style={styles.heading}>{t('home.heading')}</Text>
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
          <Text style={styles.buttonText}>{t('home.anotherKindWord')}</Text>
        </Pressable>
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
      ...headingFont(world),
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
      ...headingFont(world),
    },
  });
}
