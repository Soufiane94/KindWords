// Shows every quote the user has saved from Home, with the same save/share
// actions so they can unsave or share straight from here too.

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import WorldBackground from '../components/WorldBackground';
import { getQuoteById, Quote } from '../services/quotes';
import { getFavoriteIds, toggleFavorite } from '../services/storage';
import { shareViewAsImage } from '../services/share';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

type ItemProps = {
  quote: Quote;
  onRemoved: () => void;
  styles: ReturnType<typeof createStyles>;
};

function FavoriteItem({ quote, onRemoved, styles }: ItemProps) {
  const cardRef = useRef<View>(null);

  async function handleUnfavorite() {
    await toggleFavorite(quote.id);
    onRemoved();
  }

  async function handleShare() {
    try {
      await shareViewAsImage(cardRef);
    } catch {
      Alert.alert("Couldn't share that", 'Please try again in a moment.');
    }
  }

  return (
    <View style={styles.item}>
      <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
        <QuoteCard quote={quote} />
      </View>
      <QuoteActions isFavorite onToggleFavorite={handleUnfavorite} onShare={handleShare} />
    </View>
  );
}

export default function FavoritesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const { world } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  const load = useCallback(() => {
    getFavoriteIds().then((ids) => {
      const found = ids
        .map(getQuoteById)
        .filter((q): q is Quote => q !== undefined);
      // Newest saved first.
      setQuotes(found.reverse());
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Kind words you've saved to come back to.</Text>

        {quotes.length === 0 ? (
          <Text style={styles.emptyText}>
            No favorites yet. Tap the heart under a quote on Home to save it here.
          </Text>
        ) : (
          quotes.map((quote) => (
            <FavoriteItem key={quote.id} quote={quote} onRemoved={load} styles={styles} />
          ))
        )}
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
      ...headingFont(world),
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
      marginBottom: 20,
      lineHeight: 19,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedText,
      marginTop: 12,
      lineHeight: 20,
    },
    item: {
      marginBottom: 28,
    },
    cardWrapper: {
      width: '100%',
      backgroundColor: colors.background,
    },
  });
}
