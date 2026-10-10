// Shows every quote the user has saved from Home, with the same save/send
// actions so they can unsave one or send it to someone straight from here.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import QuoteCard from '../components/QuoteCard';
import QuoteActions from '../components/QuoteActions';
import WorldBackground from '../components/WorldBackground';
import { getQuoteById, Quote } from '../services/quotes';
import { getFavoriteIds, toggleFavorite } from '../services/storage';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type ItemProps = {
  quote: Quote;
  onRemoved: () => void;
  styles: ReturnType<typeof createStyles>;
};

function FavoriteItem({ quote, onRemoved, styles }: ItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function handleUnfavorite() {
    await toggleFavorite(quote.id);
    onRemoved();
  }

  return (
    <View style={styles.item}>
      <QuoteCard quote={quote} />
      <QuoteActions
        isFavorite
        onToggleFavorite={handleUnfavorite}
        onSend={() => navigation.navigate('SendKindWord', { quoteId: quote.id })}
      />
    </View>
  );
}

export default function FavoritesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const { world } = useTheme();
  const { t } = useTranslation();
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
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.subtitle}>{t('favorites.subtitle')}</Text>

        {quotes.length === 0 ? (
          <Text style={styles.emptyText}>{t('favorites.emptyText')}</Text>
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
  });
}
