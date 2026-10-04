// A calm, pretty card for displaying a single quote.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Quote } from '../services/quotes';

type Props = {
  quote: Quote;
};

export default function QuoteCard({ quote }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.quoteMark}>“</Text>
      <Text style={styles.text}>{quote.text}</Text>
      {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 48,
    color: '#D8C9A3',
    lineHeight: 48,
    marginBottom: 4,
  },
  text: {
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    color: '#3A3A3A',
    fontWeight: '500',
  },
  author: {
    marginTop: 16,
    fontSize: 14,
    color: '#8A8A8A',
  },
});
