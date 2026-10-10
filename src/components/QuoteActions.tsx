// A small row of actions that go under a QuoteCard: save as a favorite,
// send to someone (Phase 8) or share as an image, "not for me", and snooze.
// Kept separate from QuoteCard itself so the card stays exactly what gets
// captured when sharing. Each action only shows up if its handler is
// passed, so every screen picks the ones that make sense there.

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import type { Palette } from '../data/worlds';

type Props = {
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onSend?: () => void;
  onShare?: () => void;
  onNotForMe?: () => void;
  onSnooze?: () => void;
};

export default function QuoteActions({
  isFavorite = false,
  onToggleFavorite,
  onSend,
  onShare,
  onNotForMe,
  onSnooze,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {onToggleFavorite && (
        <ActionButton
          icon={isFavorite ? 'heart' : 'heart-outline'}
          label={isFavorite ? t('quoteActions.saved') : t('quoteActions.save')}
          accessibilityLabel={isFavorite ? t('quoteActions.removeFromFavorites') : t('quoteActions.addToFavorites')}
          onPress={onToggleFavorite}
          selected={isFavorite}
        />
      )}
      {onSend && (
        <ActionButton
          icon="paper-plane-outline"
          label={t('quoteActions.send')}
          accessibilityLabel={t('quoteActions.sendAccessibility')}
          onPress={onSend}
        />
      )}
      {onShare && (
        <ActionButton
          icon="share-social-outline"
          label={t('quoteActions.share')}
          accessibilityLabel={t('quoteActions.shareAccessibility')}
          onPress={onShare}
        />
      )}
      {onNotForMe && (
        <ActionButton
          icon="thumbs-down-outline"
          label={t('quoteActions.notForMe')}
          accessibilityLabel={t('quoteActions.notForMeAccessibility')}
          onPress={onNotForMe}
        />
      )}
      {onSnooze && (
        <ActionButton
          icon="moon-outline"
          label={t('quoteActions.snooze')}
          accessibilityLabel={t('quoteActions.snoozeAccessibility')}
          onPress={onSnooze}
        />
      )}
    </View>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean; // only for toggles like the favorite heart
};

// An icon above a short label, so up to four fit side by side on a phone.
function ActionButton({ icon, label, accessibilityLabel, onPress, selected }: ActionButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected !== undefined ? { selected } : undefined}
    >
      <Ionicons name={icon} size={22} color={selected ? colors.accent : colors.mutedText} />
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    // Buttons share the row evenly, up to a comfortable width, so four
    // still fit on a narrow phone and two don't stretch too far apart.
    button: {
      flex: 1,
      maxWidth: 88,
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    label: {
      marginTop: 4,
      fontSize: 12,
      color: colors.secondaryText,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
