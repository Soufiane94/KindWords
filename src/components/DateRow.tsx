// A row with a label and a tappable date value. Tapping opens the device's
// native date picker. Works with plain "YYYY-MM-DD" strings so the rest of
// the app never has to deal with Date objects directly.

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { WEEKDAYS_SHORT, MONTHS_SHORT } from '../i18n/dateNames';
import type { Palette } from '../data/worlds';
import type { Language } from '../data/languages';

type Props = {
  label: string;
  date: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
};

function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Formatted by hand from our own name tables rather than
// Date#toLocaleDateString — see src/i18n/dateNames.ts for why.
export function formatDateDisplay(iso: string, language: Language): string {
  const date = isoToDate(iso);
  const weekday = WEEKDAYS_SHORT[language][date.getDay()];
  const month = MONTHS_SHORT[language][date.getMonth()];
  const day = date.getDate();
  // English keeps "Mon, Jan 5"; French, Spanish, and Darija read better
  // day-first, the order each language actually uses for a short date like this.
  return language === 'en' ? `${weekday}, ${month} ${day}` : `${weekday} ${day} ${month}`;
}

export default function DateRow({ label, date, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { colors } = useTheme();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(dateToISO(selectedDate));
    }
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{formatDateDisplay(date, language)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker value={isoToDate(date)} mode="date" onChange={handleChange} />
      )}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    label: {
      fontSize: 15,
      color: colors.primaryText,
      flex: 1,
    },
    dateButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.chipSelectedBackground,
    },
    dateText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
    },
  });
}
