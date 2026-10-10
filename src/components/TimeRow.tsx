// A row with a label and a tappable time value. Tapping opens the device's
// native time picker. Works with simple "HH:mm" strings so the rest of the
// app never has to deal with Date objects directly.

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatTimeDisplay } from '../i18n/dateNames';
import { atTime, timeOf } from '../services/dates';
import type { Palette } from '../data/worlds';

type Props = {
  label: string;
  time: string; // "HH:mm"
  onChange: (time: string) => void;
};

export default function TimeRow({ label, time, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { colors } = useTheme();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(timeOf(selectedDate));
    }
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.timeButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.timeText}>{formatTimeDisplay(time, language)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker value={atTime(new Date(), time)} mode="time" onChange={handleChange} />
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
    timeButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.chipSelectedBackground,
    },
    timeText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
    },
  });
}
