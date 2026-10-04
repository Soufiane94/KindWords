// Main screen: shows one quote matched to the user's circumstances,
// with a button to see another one.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuoteCard from '../components/QuoteCard';
import { getRandomQuote, Quote } from '../services/quotes';
import { getCircumstances } from '../services/storage';

export default function HomeScreen() {
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    getCircumstances().then((ids) => {
      setCircumstances(ids);
      setQuote(getRandomQuote(ids));
    });
  }, []);

  const showAnotherQuote = useCallback(() => {
    setQuote((current) => getRandomQuote(circumstances, current?.id));
  }, [circumstances]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>A kind word for you</Text>
        {quote ? <QuoteCard quote={quote} /> : null}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={showAnotherQuote}>
          <Text style={styles.buttonText}>Another kind word</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 16,
    color: '#8A8A8A',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: '#C9A94F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
