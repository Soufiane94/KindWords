// A row with a label and a tappable date value. Tapping opens the device's
// native date picker. Works with plain "YYYY-MM-DD" strings so the rest of
// the app never has to deal with Date objects directly.

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatDateDisplay } from '../i18n/dateNames';
import { dateToISO, isoToDate } from '../services/dates';
import type { Palette } from '../data/worlds';

type Props = {
  label: string;
  date: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  // Earliest pickable day, e.g. tomorrow for a note to future-you.
  minimumDate?: string; // "YYYY-MM-DD"
};

export default function DateRow({ label, date, onChange, minimumDate }: Props) {
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
        <DateTimePicker
          value={isoToDate(date)}
          mode="date"
          onChange={handleChange}
          minimumDate={minimumDate ? isoToDate(minimumDate) : undefined}
        />
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
