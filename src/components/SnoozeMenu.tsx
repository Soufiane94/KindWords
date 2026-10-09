// A small bottom-sheet menu from the Kind word screen's "Snooze" button:
// pause reminders for a while, or hide this one quote for good. Kept
// separate from the screen so its layout doesn't clutter the quote card.

import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';
import type { SnoozeDuration } from '../services/notifications';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSnooze: (duration: SnoozeDuration) => void;
  onHideQuote: () => void;
};

const SNOOZE_VALUES: SnoozeDuration[] = ['hour', 'tomorrow', 'three_days'];

export default function SnoozeMenu({ visible, onClose, onSnooze, onHideQuote }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const SNOOZE_OPTIONS = SNOOZE_VALUES.map((value) => ({
    value,
    label: t(`snoozeMenu.${value === 'three_days' ? 'threeDays' : value}`),
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Swallows taps on blank space inside the sheet so only the dim
            overlay behind it closes the menu. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {SNOOZE_OPTIONS.map((option) => (
            <Pressable key={option.value} style={styles.row} onPress={() => onSnooze(option.value)}>
              <Text style={styles.rowText}>{option.label}</Text>
            </Pressable>
          ))}

          <View style={styles.divider} />

          <Pressable style={styles.row} onPress={onHideQuote}>
            <Text style={[styles.rowText, styles.dangerText]}>{t('snoozeMenu.dontShowAgain')}</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.row} onPress={onClose}>
            <Text style={[styles.rowText, styles.cancelText]}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 24,
    },
    row: {
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    rowText: {
      fontSize: 15,
      color: colors.primaryText,
      textAlign: 'center',
    },
    dangerText: {
      color: colors.danger,
    },
    cancelText: {
      color: colors.mutedText,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 24,
    },
  });
}
