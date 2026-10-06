// A row with a label and a tappable time value. Tapping opens the device's
// native time picker. Works with simple "HH:mm" strings so the rest of the
// app never has to deal with Date objects directly.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  label: string;
  time: string; // "HH:mm"
  onChange: (time: string) => void;
};

function hhmmToDate(hhmm: string): Date {
  const [hour, minute] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateToHHMM(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatDisplay(hhmm: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

export default function TimeRow({ label, time, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(dateToHHMM(selectedDate));
    }
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.timeButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.timeText}>{formatDisplay(time)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker value={hhmmToDate(time)} mode="time" onChange={handleChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    fontSize: 15,
    color: '#3A3A3A',
    flex: 1,
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F4E8C8',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A3A3A',
  },
});
