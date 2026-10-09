// A row with a label and a tappable date value. Tapping opens the device's
// native date picker. Works with plain "YYYY-MM-DD" strings so the rest of
// the app never has to deal with Date objects directly.

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

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

export function formatDateDisplay(iso: string): string {
  return isoToDate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DateRow({ label, date, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { colors } = useTheme();
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
        <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
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
