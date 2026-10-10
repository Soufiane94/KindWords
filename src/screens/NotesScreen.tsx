// Personal notes (Phase 7): a note to yourself, a letter to future-you, or
// a message from someone you love. Notes to yourself and loved ones'
// messages are slipped in among the regular kind words now and then; a
// note to future-you arrives once, on the day you pick, and joins the
// others after that. Everything stays on the phone.

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { NOTE_KINDS, NoteKind } from '../data/noteKinds';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNotificationSettings,
  PersonalNote,
} from '../services/storage';
import { rescheduleAllNotifications } from '../services/notifications';
import { addDays, dateToISO, todayISO } from '../services/dates';
import CircumstanceChip from '../components/CircumstanceChip';
import DateRow from '../components/DateRow';
import Hint from '../components/Hint';
import WorldBackground from '../components/WorldBackground';
import { useTheme } from '../theme/ThemeContext';
import { useUiLanguage } from '../i18n';
import { formatDateDisplay } from '../i18n/dateNames';
import type { World } from '../data/worlds';
import { headingFont } from '../theme/fontStyle';

// A letter to future-you defaults to a month from now.
function defaultDeliveryDate(): string {
  return dateToISO(addDays(new Date(), 30));
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [remindersOn, setRemindersOn] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PersonalNote | null>(null);
  const [kind, setKind] = useState<NoteKind>('self');
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [deliverOn, setDeliverOn] = useState(defaultDeliveryDate());
  const [saving, setSaving] = useState(false);
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const language = useUiLanguage();
  const styles = useMemo(() => createStyles(world), [world]);

  const loadNotes = useCallback(() => {
    Promise.all([getNotes(), getNotificationSettings()]).then(([loaded, settings]) => {
      // Newest first.
      setNotes([...loaded].reverse());
      setRemindersOn(settings.enabled);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  function openAddModal() {
    setEditing(null);
    setKind('self');
    setText('');
    setFrom('');
    setDeliverOn(defaultDeliveryDate());
    setModalVisible(true);
  }

  function openEditModal(note: PersonalNote) {
    setEditing(note);
    setKind(note.kind);
    setText(note.text);
    setFrom(note.from ?? '');
    setDeliverOn(note.deliverOn ?? defaultDeliveryDate());
    setModalVisible(true);
  }

  async function reschedule() {
    await rescheduleAllNotifications().catch(() => {
      // Non-fatal: the note is still saved even if scheduling fails.
    });
  }

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);

    // Only keep the fields that belong to this kind of note.
    const data = {
      kind,
      text: trimmed,
      from: kind === 'loved_one' ? from.trim() || undefined : undefined,
      deliverOn: kind === 'future' ? deliverOn : undefined,
    };
    if (editing) {
      await updateNote({ ...editing, ...data });
    } else {
      await createNote(data);
    }
    await reschedule();
    setModalVisible(false);
    setSaving(false);
    loadNotes();
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
  // to future-you, when it arrives (or arrived).
  function describeNote(note: PersonalNote): string {
    const emoji = NOTE_KINDS.find((k) => k.id === note.kind)?.emoji ?? '';
    if (note.kind === 'loved_one') {
      return `${emoji} ${t('notes.metaLovedOne', { name: note.from || t('notes.someoneWhoLovesYou') })}`;
    }
    if (note.kind === 'future' && note.deliverOn) {
      const date = formatDateDisplay(note.deliverOn, language);
      const key = note.deliverOn > todayISO() ? 'notes.metaFuture' : 'notes.metaFutureArrived';
      return `${emoji} ${t(key, { date })}`;
    }
    return `${emoji} ${t('notes.kinds.self')}`;
  }

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

            <Text style={[styles.label, { marginTop: 20 }]}>
              {kind === 'loved_one' ? t('notes.textLabelLovedOne') : t('notes.textLabel')}
            </Text>
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

            <Pressable
              style={[styles.saveButton, (!text.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!text.trim() || saving}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </Pressable>

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
