// "Privacy and your data" (9D): a short, plain page about what Kindwords
// keeps and why it stays on the phone, a link to the full privacy policy,
// and "Delete all my data". Since 9E it also exports everything to a file
// and imports it back: a backup without accounts.

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WorldBackground from '../components/WorldBackground';
import { deleteAllData, restoreBackupData } from '../services/storage';
import { clearBackupFiles, exportData, pickBackup, PickedBackup } from '../services/backup';
import { clearAllNotifications, rescheduleAllNotifications } from '../services/notifications';
import { dateToISO } from '../services/dates';
import { refreshKindWordWidget } from '../widget/widgetTaskHandler';
import { PRIVACY_POLICY_URL } from '../data/links';
import i18n, { detectDeviceLanguage, useUiLanguage } from '../i18n';
import { formatDateDisplay } from '../i18n/dateNames';
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
  // Stops a second tap from starting anything while one action is running.
  const [busy, setBusy] = useState(false);
  const { world, setWorldId, setPlainFont, resetTheme } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  async function handleExport() {
    setBusy(true);
    try {
      await exportData();
    } catch {
      Alert.alert(t('privacy.exportErrorTitle'), t('common.shareErrorMessage'));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      const picked = await pickBackup();
      if (picked === 'invalid') {
        Alert.alert(t('privacy.importInvalidTitle'), t('privacy.importInvalidMessage'));
      } else if (picked !== 'canceled') {
        confirmImport(picked);
      }
    } catch {
      Alert.alert(t('privacy.importInvalidTitle'), t('privacy.importInvalidMessage'));
    } finally {
      setBusy(false);
    }
  }

  // Says what's in the file before anything changes.
  function confirmImport({ data, exportedAt }: PickedBackup) {
    const counts = { notes: data.notes.length, events: data.events.length, favorites: data.favorites.length };
    const message = exportedAt
      ? t('privacy.importConfirmMessage', { ...counts, date: formatDateDisplay(dateToISO(exportedAt), language) })
      : t('privacy.importConfirmMessageNoDate', counts);
    Alert.alert(t('privacy.importConfirmTitle'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('privacy.importConfirmButton'), onPress: () => importBackup(data) },
    ]);
  }

  async function importBackup(data: PickedBackup['data']) {
    await restoreBackupData(data);
    // The app takes on the file's look and languages straight away.
    if (data.worldId) await setWorldId(data.worldId);
    if (data.plainFont !== undefined) await setPlainFont(data.plainFont);
    if (data.uiLanguage) await i18n.changeLanguage(data.uiLanguage);
    refreshKindWordWidget();
    // Never asks for the notification permission from here (only Settings'
    // Save does), so on a new phone, with reminders on in the file, the
    // user is told where to allow them.
    const result = await rescheduleAllNotifications().catch(() => null);
    const needsPermission = result?.status === 'permission_denied';
    Alert.alert(
      t('privacy.importDoneTitle'),
      needsPermission
        ? `${t('privacy.importDoneMessage')} ${t('privacy.importPermissionNote')}`
        : t('privacy.importDoneMessage')
    );
  }

  function handleDeleteAll() {
    Alert.alert(t('privacy.deleteConfirmTitle'), t('privacy.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('privacy.deleteConfirmButton'), style: 'destructive', onPress: deleteEverything },
    ]);
  }

  async function deleteEverything() {
    setBusy(true);
    // Notifications first, so none still waiting can show a note's text.
    await clearAllNotifications().catch(() => {});
    await deleteAllData();
    clearBackupFiles();
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
        <Text style={styles.body}>{t('privacy.exportHelp')}</Text>
        <Pressable
          style={[styles.dataButton, busy && styles.disabled]}
          onPress={handleExport}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.dataButtonText}>{t('privacy.exportButton')}</Text>
        </Pressable>
        <Pressable
          style={[styles.dataButton, busy && styles.disabled]}
          onPress={handleImport}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.dataButtonText}>{t('privacy.importButton')}</Text>
        </Pressable>

        <Text style={[styles.body, styles.deleteHelp]}>{t('privacy.deleteHelp')}</Text>
        <Pressable
          style={[styles.deleteButton, busy && styles.disabled]}
          onPress={handleDeleteAll}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
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
    dataButton: {
      borderWidth: 1.5,
      borderColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    dataButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
    deleteHelp: {
      marginTop: 28,
    },
    // Outlined in the danger color rather than filled, so it never looks
    // like the screen's main action.
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
