// "Privacy and your data" (9D): a short, plain page about what Kindwords
// keeps and why it stays on the phone, a link to the full privacy policy,
// and "Delete all my data".

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WorldBackground from '../components/WorldBackground';
import { deleteAllData } from '../services/storage';
import { clearAllNotifications } from '../services/notifications';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import { PRIVACY_POLICY_URL } from '../data/links';
import i18n, { detectDeviceLanguage } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'> & {
  // Called once everything is erased, so the app starts over at the
  // welcome screen.
  onDataDeleted: () => void;
};

// Each one is a short title and a sentence or two, in the locale files
// under "privacy.<key>Title" / "privacy.<key>Body".
const POINTS = ['stays', 'leaves', 'backup', 'notifications'] as const;

export default function PrivacyScreen({ navigation, onDataDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const { world, resetTheme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  function handleDeleteAll() {
    Alert.alert(t('privacy.deleteConfirmTitle'), t('privacy.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('privacy.deleteConfirmButton'), style: 'destructive', onPress: deleteEverything },
    ]);
  }

  async function deleteEverything() {
    setDeleting(true);
    // Notifications first, so none still waiting can show a note's text.
    await clearAllNotifications().catch(() => {});
    await deleteAllData();
    // What's on screen goes back to how a fresh install looks.
    resetTheme();
    await i18n.changeLanguage(detectDeviceLanguage());
    refreshKindWordWidget();
    Alert.alert(t('privacy.deletedTitle'), t('privacy.deletedMessage'));
    onDataDeleted();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('privacy.title')}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.closeButton}
          hitSlop={8}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {POINTS.map((key) => (
          <View key={key} style={styles.point}>
            <Text style={styles.pointTitle} accessibilityRole="header">
              {t(`privacy.${key}Title`)}
            </Text>
            <Text style={styles.body}>{t(`privacy.${key}Body`)}</Text>
          </View>
        ))}

        <Pressable
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
          accessibilityRole="link"
          style={styles.policyLink}
        >
          <Text style={styles.linkText}>{t('privacy.policyLink')}</Text>
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('privacy.yourDataTitle')}
        </Text>
        <Text style={styles.body}>{t('privacy.deleteHelp')}</Text>
        <Pressable
          style={[styles.deleteButton, deleting && styles.disabled]}
          onPress={handleDeleteAll}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityState={{ disabled: deleting }}
        >
          <Text style={styles.deleteButtonText}>{t('privacy.deleteButton')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(world: World) {
  const { colors } = world;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    headerTitle: {
      flexShrink: 1,
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    closeButton: {
      padding: 6,
      marginLeft: 12,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    content: {
      padding: 24,
      paddingTop: 12,
      paddingBottom: 40,
    },
    point: {
      marginBottom: 18,
    },
    pointTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.secondaryText,
    },
    policyLink: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
    },
    linkText: {
      fontSize: 14,
      color: colors.primaryText,
      textDecorationLine: 'underline',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 24,
    },
    sectionTitle: {
      fontSize: 17,
      color: colors.primaryText,
      marginBottom: 8,
      ...headingFont(world),
    },
    // Outlined rather than filled, so it never looks like the screen's
    // main action.
    deleteButton: {
      borderWidth: 1.5,
      borderColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
