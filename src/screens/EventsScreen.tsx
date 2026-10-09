// Calendar screen: add/edit/delete events (exams, appointments, grief days,
// etc.) and get a kind word scheduled the day before and the day after each
// one, picked to fit the event's type.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { EVENT_TYPES } from '../data/eventTypes';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCircumstances,
  getNotificationSettings,
  CalendarEvent,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import CircumstanceChip from '../components/CircumstanceChip';
import DateRow, { dateToISO, formatDateDisplay } from '../components/DateRow';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

function labelFor(typeId: string): { label: string; emoji: string } {
  const match = EVENT_TYPES.find((t) => t.id === typeId);
  return match ?? { label: 'Other', emoji: '📌' };
}

export default function EventsScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(EVENT_TYPES[0].id);
  const [date, setDate] = useState(dateToISO(new Date()));
  const { world, colors } = useTheme();
  const styles = useMemo(() => createStyles(world), [world]);

  const loadEvents = useCallback(() => {
    getEvents().then((loaded) => {
      const sorted = [...loaded].sort((a, b) => (a.date < b.date ? -1 : 1));
      setEvents(sorted);
    });
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
    const [circumstances, settings, latestEvents] = await Promise.all([
      getCircumstances(),
      getNotificationSettings(),
      getEvents(),
    ]);
    await rescheduleAllNotifications(settings, circumstances, latestEvents).catch(() => {
      // Non-fatal: the event is still saved even if scheduling fails.
    });
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (editingId) {
      await updateEvent({ id: editingId, title: trimmed, type, date });
    } else {
      await createEvent({ title: trimmed, type, date });
    }
    await reschedule();
    setModalVisible(false);
    loadEvents();
  }

  function handleDelete() {
    if (!editingId) return;
    Alert.alert('Delete this event?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          Add a date that matters, and we'll send a kind word the day before and the day after.
        </Text>

        {events.length === 0 ? (
          <Text style={styles.emptyText}>No events yet.</Text>
        ) : (
          events.map((event) => {
            const { label, emoji } = labelFor(event.type);
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
                    {label} · {formatDateDisplay(event.date)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add event</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <WorldBackground />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.modalHeader}>
              <Text style={styles.title}>{editingId ? 'Edit event' : 'New event'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>What is it?</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Math final, Dad's checkup"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={[styles.label, { marginTop: 20 }]}>Type</Text>
            <View style={styles.chipRow}>
              {EVENT_TYPES.map((t) => (
                <CircumstanceChip
                  key={t.id}
                  label={t.label}
                  emoji={t.emoji}
                  selected={type === t.id}
                  onPress={() => setType(t.id)}
                />
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Date</Text>
            <DateRow label="Event date" date={date} onChange={setDate} />

            <Pressable
              style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>

            {editingId && (
              <Pressable onPress={handleDelete} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>Delete event</Text>
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
