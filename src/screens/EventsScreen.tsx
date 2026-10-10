// Calendar screen: add/edit/delete events (exams, appointments, grief days,
// etc.) and get a kind word scheduled the day before and the day after each
// one, picked to fit the event's type. Each event shows exactly when its
// kind words will arrive, so it's never a guess whether one is coming.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { EVENT_TYPES, EventTypeOption } from '../data/eventTypes';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getNotificationSettings,
  getActiveSnoozeUntil,
  CalendarEvent,
  NotificationSettings,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import { EVENT_REMINDER_TIME, isWithinQuietHours, planEventReminders } from '../services/reminderPlan';
import { dateToISO } from '../services/dates';
import CircumstanceChip from '../components/CircumstanceChip';
import DateRow from '../components/DateRow';
import Hint from '../components/Hint';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatDateDisplay, formatTimeDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

function eventTypeFor(typeId: string): EventTypeOption {
  return EVENT_TYPES.find((opt) => opt.id === typeId) ?? EVENT_TYPES.find((opt) => opt.id === 'other')!;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(EVENT_TYPES[0].id);
  const [date, setDate] = useState(dateToISO(new Date()));
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  // Settings and any snooze are loaded too, to work out each event's
  // reminder dates the same way the scheduler does.
  const loadEvents = useCallback(() => {
    Promise.all([getEvents(), getNotificationSettings(), getActiveSnoozeUntil()]).then(
      ([loaded, loadedSettings, snooze]) => {
        const sorted = [...loaded].sort((a, b) => (a.date < b.date ? -1 : 1));
        setEvents(sorted);
        setSettings(loadedSettings);
        setSnoozeUntil(snooze);
      }
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  function openAddModal() {
    setEditingId(null);
    setTitle('');
    setType(EVENT_TYPES[0].id);
    setDate(dateToISO(new Date()));
    setModalVisible(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingId(event.id);
    setTitle(event.title);
    setType(event.type);
    setDate(event.date);
    setModalVisible(true);
  }

  async function reschedule() {
    await rescheduleAllNotifications().catch(() => {
      // Non-fatal: the event is still saved even if scheduling fails.
    });
  }

  // Event reminders always arrive at the same time, so if quiet hours
  // cover it, none of them can be sent — worth saying once, up top.
  const remindersBlockedByQuietHours =
    settings !== null &&
    isWithinQuietHours(EVENT_REMINDER_TIME, settings.quietHoursStart, settings.quietHoursEnd);

  // "Kind words on Fri, Oct 10 & Sun, Oct 12 at 9:00 AM", or a note that
  // there's nothing left to send. Nothing at all when reminders can't be
  // sent anyway (the hints at the top explain why).
  function describeReminders(event: CalendarEvent): string | null {
    if (!settings?.enabled || remindersBlockedByQuietHours) return null;
    const reminders = planEventReminders(event, settings, new Date(), snoozeUntil);
    if (reminders.length === 0) return t('events.noRemindersLeft');
    return t('events.reminderDates', {
      dates: reminders.map((reminder) => formatDateDisplay(dateToISO(reminder.date), language)).join(' & '),
      time: formatTimeDisplay(EVENT_REMINDER_TIME, language),
    });
  }

  async function handleSave() {
    const trimmed = title.trim();
    // `saving` stops a quick double tap from adding the same event twice.
    if (!trimmed || saving) return;
    setSaving(true);

    if (editingId) {
      await updateEvent({ id: editingId, title: trimmed, type, date });
    } else {
      await createEvent({ title: trimmed, type, date });
    }
    await reschedule();
    setModalVisible(false);
    setSaving(false);
    loadEvents();
  }

  function handleDelete() {
    if (!editingId) return;
    Alert.alert(t('events.deleteConfirmTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('events.deleteButton'),
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(editingId);
          await reschedule();
          setModalVisible(false);
          loadEvents();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('events.title')}</Text>
        <Text style={styles.subtitle}>{t('events.subtitle')}</Text>

        {settings && !settings.enabled && <Hint text={t('events.remindersOffHint')} />}
        {settings?.enabled && remindersBlockedByQuietHours && (
          <Hint text={t('events.quietHoursHint', { time: formatTimeDisplay(EVENT_REMINDER_TIME, language) })} />
        )}

        {events.length === 0 ? (
          <Text style={styles.emptyText}>{t('events.emptyText')}</Text>
        ) : (
          events.map((event) => {
            const { id, emoji } = eventTypeFor(event.type);
            const reminders = describeReminders(event);
            return (
              <Pressable
                key={event.id}
                style={styles.eventRow}
                onPress={() => openEditModal(event)}
              >
                <Text style={styles.eventEmoji}>{emoji}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {t(`eventTypes.${id}`)} · {formatDateDisplay(event.date, language)}
                  </Text>
                  {reminders && <Text style={styles.eventReminders}>{reminders}</Text>}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>{t('events.addEvent')}</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <WorldBackground />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.modalHeader}>
              <Text style={styles.title}>{editingId ? t('events.editEventTitle') : t('events.newEventTitle')}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>{t('events.whatIsIt')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('events.titlePlaceholder')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={[styles.label, { marginTop: 20 }]}>{t('events.typeLabel')}</Text>
            <View style={styles.chipRow}>
              {EVENT_TYPES.map((opt) => (
                <CircumstanceChip
                  key={opt.id}
                  label={t(`eventTypes.${opt.id}`)}
                  emoji={opt.emoji}
                  selected={type === opt.id}
                  onPress={() => setType(opt.id)}
                />
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>{t('events.dateLabel')}</Text>
            <DateRow label={t('events.eventDateLabel')} date={date} onChange={setDate} />

            <Pressable
              style={[styles.saveButton, (!title.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim() || saving}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </Pressable>

            {editingId && (
              <Pressable onPress={handleDelete} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>{t('events.deleteEventLink')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    content: {
      padding: 24,
      paddingTop: 32,
      paddingBottom: 48,
    },
    title: {
      fontSize: 24,
      color: colors.primaryText,
      ...headingFont(world),
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
      marginBottom: 20,
      lineHeight: 19,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedText,
      marginTop: 12,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    eventEmoji: {
      fontSize: 22,
      marginRight: 14,
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
    },
    eventMeta: {
      fontSize: 13,
      color: colors.mutedText,
      marginTop: 2,
    },
    eventReminders: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },
    footer: {
      padding: 24,
    },
    addButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    addButtonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.primaryText,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 28,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
    deleteLink: {
      marginTop: 20,
      alignItems: 'center',
    },
    deleteLinkText: {
      fontSize: 13,
      color: colors.danger,
      textDecorationLine: 'underline',
    },
  });
}
