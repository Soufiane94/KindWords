// Personal notes (Phase 7): a note to yourself, a letter to future-you, or
// a message from someone you love. Notes to yourself and loved ones'
// messages are slipped in among the regular kind words now and then; a
// note to future-you arrives once, on the day you pick, and joins the
// others after that. Phase 8 adds a note for someone else's important day:
// that morning, the app reminds you to send it. Everything stays on the
// phone.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { NOTE_KINDS, NoteKind } from '../data/noteKinds';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNotificationSettings,
  NotificationSettings,
  PersonalNote,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import { EVENT_REMINDER_TIME, planForSomeoneNote } from '../services/reminderPlan';
import { addDays, dateToISO, todayISO } from '../services/dates';
import CircumstanceChip from '../components/CircumstanceChip';
import DateRow from '../components/DateRow';
import Hint from '../components/Hint';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatDateDisplay, formatMomentDisplay, formatTimeDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

// A letter to future-you (or a note for someone's day) defaults to a month
// from now.
function defaultDeliveryDate(): string {
  return dateToISO(addDays(new Date(), 30));
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PersonalNote | null>(null);
  const [kind, setKind] = useState<NoteKind>('self');
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [deliverOn, setDeliverOn] = useState(defaultDeliveryDate());
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  // The full settings are kept (not just on/off) to show when each note for
  // someone else will come up, worked out the same way the scheduler does.
  const loadNotes = useCallback(() => {
    Promise.all([getNotes(), getNotificationSettings()]).then(([loaded, loadedSettings]) => {
      // Newest first.
      setNotes([...loaded].reverse());
      setSettings(loadedSettings);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  // Until settings load, assume reminders are on so the hint doesn't flash.
  const remindersOn = settings?.enabled ?? true;

  function openAddModal() {
    setEditing(null);
    setKind('self');
    setText('');
    setFrom('');
    setTo('');
    setDeliverOn(defaultDeliveryDate());
    setModalVisible(true);
  }

  function openEditModal(note: PersonalNote) {
    setEditing(note);
    setKind(note.kind);
    setText(note.text);
    setFrom(note.from ?? '');
    setTo(note.to ?? '');
    setDeliverOn(note.deliverOn ?? defaultDeliveryDate());
    setModalVisible(true);
  }

  async function reschedule() {
    await rescheduleAllNotifications().catch(() => {
      // Non-fatal: the note is still saved even if scheduling fails.
    });
  }

  // Saves the note (new or edited) and returns its id, or null if there
  // was nothing to save.
  async function handleSave(): Promise<string | null> {
    const trimmed = text.trim();
    if (!trimmed || saving) return null;
    setSaving(true);

    // Only keep the fields that belong to this kind of note.
    const data = {
      kind,
      text: trimmed,
      from: kind === 'loved_one' ? from.trim() || undefined : undefined,
      to: kind === 'for_someone' ? to.trim() || undefined : undefined,
      deliverOn: kind === 'future' || kind === 'for_someone' ? deliverOn : undefined,
    };
    let id: string;
    if (editing) {
      await updateNote({ ...editing, ...data });
      id = editing.id;
    } else {
      id = (await createNote(data)).id;
    }
    await reschedule();
    setModalVisible(false);
    setSaving(false);
    loadNotes();
    return id;
  }

  // For a note for someone else whose day is already here (or when the user
  // would rather not wait). Saves first, so the Send screen opens with
  // exactly what's in the box.
  async function handleSendNow() {
    const id = await handleSave();
    if (id) navigation.navigate('SendKindWord', { noteId: id });
  }

  function handleDelete() {
    if (!editing) return;
    Alert.alert(t('notes.deleteConfirmTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('notes.deleteButton'),
        style: 'destructive',
        onPress: async () => {
          await deleteNote(editing.id);
          await reschedule();
          setModalVisible(false);
          loadNotes();
        },
      },
    ]);
  }

  // The small line under each note: who it's for or from, and for a letter
  // to future-you, when it arrives (or arrived). A note for someone else
  // shows when its reminder comes, or just its day once that has passed (or
  // while reminders are off).
  function describeNote(note: PersonalNote): string {
    const emoji = NOTE_KINDS.find((k) => k.id === note.kind)?.emoji ?? '';
    if (note.kind === 'loved_one') {
      return `${emoji} ${t('notes.metaLovedOne', { name: note.from || t('notes.someoneWhoLovesYou') })}`;
    }
    if (note.kind === 'for_someone') {
      const name = note.to || t('notes.someoneYouLove');
      const reminder = settings?.enabled ? planForSomeoneNote(note, settings, new Date()) : null;
      if (reminder) {
        return `${emoji} ${t('notes.metaForSomeone', { name, when: formatMomentDisplay(reminder, language) })}`;
      }
      const date = formatDateDisplay(note.deliverOn ?? note.createdOn, language);
      return `${emoji} ${t('notes.metaForSomeoneDay', { name, date })}`;
    }
    if (note.kind === 'future' && note.deliverOn) {
      const date = formatDateDisplay(note.deliverOn, language);
      const key = note.deliverOn > todayISO() ? 'notes.metaFuture' : 'notes.metaFutureArrived';
      return `${emoji} ${t(key, { date })}`;
    }
    return `${emoji} ${t('notes.kinds.self')}`;
  }

  // Worded for whoever the note is from or for.
  const textLabel =
    kind === 'loved_one'
      ? t('notes.textLabelLovedOne')
      : kind === 'for_someone'
        ? t('notes.textLabelForSomeone')
        : t('notes.textLabel');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('notes.title')}</Text>
        <Text style={styles.subtitle}>{t('notes.subtitle')}</Text>

        {!remindersOn && <Hint text={t('notes.remindersOffHint')} />}

        {notes.length === 0 ? (
          <Text style={styles.emptyText}>{t('notes.emptyText')}</Text>
        ) : (
          notes.map((note) => (
            <Pressable key={note.id} style={styles.noteCard} onPress={() => openEditModal(note)}>
              <Text style={styles.noteText} numberOfLines={4}>
                {note.text}
              </Text>
              <Text style={styles.noteMeta}>{describeNote(note)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>{t('notes.addNote')}</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <WorldBackground />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.title}>{editing ? t('notes.editNoteTitle') : t('notes.newNoteTitle')}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>{t('notes.kindLabel')}</Text>
            <View style={styles.chipRow}>
              {NOTE_KINDS.map((option) => (
                <CircumstanceChip
                  key={option.id}
                  label={t(`notes.kinds.${option.id}`)}
                  emoji={option.emoji}
                  selected={kind === option.id}
                  onPress={() => setKind(option.id)}
                />
              ))}
            </View>

            {kind === 'loved_one' && (
              <>
                <Text style={[styles.label, { marginTop: 20 }]}>{t('notes.fromLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={from}
                  onChangeText={setFrom}
                  placeholder={t('notes.fromPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                />
              </>
            )}

            {kind === 'for_someone' && (
              <>
                <Text style={[styles.label, { marginTop: 20 }]}>{t('notes.toLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={setTo}
                  placeholder={t('notes.toPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                />
              </>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>{textLabel}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={text}
              onChangeText={setText}
              placeholder={t(`notes.placeholders.${kind}`)}
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
            />

            {kind === 'future' && (
              <>
                <Text style={[styles.label, { marginTop: 20 }]}>{t('notes.deliverLabel')}</Text>
                <DateRow
                  label={t('notes.deliverDateLabel')}
                  date={deliverOn}
                  onChange={setDeliverOn}
                  minimumDate={dateToISO(addDays(new Date(), 1))}
                />
              </>
            )}

            {kind === 'for_someone' && (
              <>
                <Text style={[styles.label, { marginTop: 20 }]}>{t('notes.forSomeoneDayLabel')}</Text>
                <DateRow
                  label={t('notes.forSomeoneDateLabel')}
                  date={deliverOn}
                  onChange={setDeliverOn}
                  minimumDate={todayISO()}
                />
                <Text style={styles.helpText}>
                  {t('notes.forSomeoneHelp', { time: formatTimeDisplay(EVENT_REMINDER_TIME, language) })}
                </Text>
              </>
            )}

            <Pressable
              style={[styles.saveButton, (!text.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!text.trim() || saving}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </Pressable>

            {kind === 'for_someone' && (
              <Pressable
                style={[styles.sendNowButton, (!text.trim() || saving) && styles.saveButtonDisabled]}
                onPress={handleSendNow}
                disabled={!text.trim() || saving}
              >
                <Text style={styles.sendNowText}>{t('notes.sendNow')}</Text>
              </Pressable>
            )}

            {editing && (
              <Pressable onPress={handleDelete} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>{t('notes.deleteNoteLink')}</Text>
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
    noteCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    noteText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.primaryText,
    },
    noteMeta: {
      fontSize: 12,
      color: colors.mutedText,
      marginTop: 8,
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
    textArea: {
      minHeight: 120,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    helpText: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 19,
      marginTop: 4,
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
    // Outlined, so it reads as the second choice after Save.
    sendNowButton: {
      borderWidth: 1.5,
      borderColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    sendNowText: {
      color: colors.primaryText,
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
