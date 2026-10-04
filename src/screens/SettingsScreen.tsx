// Simple settings screen for Phase 1. Lets the user see and change which
// circumstances they picked during onboarding. Notification settings will
// be added here in Phase 2.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CIRCUMSTANCES } from '../data/circumstances';
import { getCircumstances, setCircumstances } from '../services/storage';
import CircumstanceChip from '../components/CircumstanceChip';

export default function SettingsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCircumstances().then(setSelected);
    }, [])
  );

  async function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    const safeNext = next.length > 0 ? next : ['other'];
    setSelected(safeNext);
    await setCircumstances(safeNext);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Update which circumstances best describe you. This changes which kind
          words show up on your home screen.
        </Text>

        <View style={styles.chipRow}>
          {CIRCUMSTANCES.map((c) => (
            <CircumstanceChip
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              selected={selected.includes(c.id)}
              onPress={() => toggle(c.id)}
            />
          ))}
        </View>

        <Text style={styles.note}>
          More settings, like reminders and quiet hours, are coming in a future
          update.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EC',
  },
  content: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A3A3A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6A6A6A',
    marginBottom: 20,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  note: {
    marginTop: 28,
    fontSize: 13,
    color: '#9A9A9A',
    textAlign: 'center',
  },
});
