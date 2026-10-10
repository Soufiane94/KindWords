// "Send a kind word" (Phase 8): passes a kind word on to a friend or
// relative through the phone's own share sheet, so it goes out on whatever
// app they already talk on — the app never sends anything by itself. It can
// be one of the app's kind words or the user's own words, sent as a picture
// in their world's style or as plain text (which can carry a link to
// Kindwords). Opens with the quote it was opened from, or with a note the
// user wrote for someone else's day.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import QuoteCard from '../components/QuoteCard';
import SegmentedControl from '../components/SegmentedControl';
import WorldBackground from '../components/WorldBackground';
import { useCardShare } from '../components/useCardShare';
import { getQuoteById, getRandomQuote, loadQuotePrefs, Quote, QuotePrefs } from '../services/quotes';
import { getNotes, getQuoteLanguage } from '../services/storage';
import { shareText, withKindwordsLink } from '../services/share';
import { useTheme } from '../theme/ThemeContext';
import type { World } from '../data/worlds';
import type { Language } from '../data/languages';
import { headingFont } from '../theme/fontStyle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SendKindWord'>;

type Source = 'pick' | 'write';
type Format = 'picture' | 'text';

const SOURCE_VALUES: Source[] = ['pick', 'write'];
const FORMAT_VALUES: Format[] = ['picture', 'text'];

// Nothing is known about what the person receiving it is going through, so
// "Another one" picks from the kind words meant for anyone, not ones
// matched to the sender's own circumstances.
const FOR_ANYONE = ['other'];

export default function SendKindWordScreen({ route, navigation }: Props) {
  const { quoteId, noteId } = route.params;
  const [source, setSource] = useState<Source>(noteId ? 'write' : 'pick');
  const [quote, setQuote] = useState<Quote | undefined>(() => (quoteId ? getQuoteById(quoteId) : undefined));
  const [ownWords, setOwnWords] = useState('');
  const [recipient, setRecipient] = useState<string | undefined>();
  const [format, setFormat] = useState<Format>('picture');
  const [includeLink, setIncludeLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState<{ language: Language; prefs: QuotePrefs } | null>(null);
  const { cardRef, capturing, share } = useCardShare();
  const { world, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(world), [world]);

  const SOURCE_OPTIONS = SOURCE_VALUES.map((value) => ({ value, label: t(`send.sources.${value}`) }));
  const FORMAT_OPTIONS = FORMAT_VALUES.map((value) => ({ value, label: t(`send.formats.${value}`) }));

  useEffect(() => {
    Promise.all([getQuoteLanguage(), loadQuotePrefs()]).then(([language, prefs]) => {
      // Today's check-in is about how the sender feels, so it doesn't steer
      // what they send someone else. "Not for me" choices still count.
      const sendPrefs = { ...prefs, checkInMood: null };
      setPicker({ language, prefs: sendPrefs });
      // Opened from a note there's no quote yet — have one ready in case
      // they'd rather send one of the app's kind words.
      setQuote((current) => current ?? getRandomQuote(FOR_ANYONE, language, sendPrefs));
    });
  }, []);

  // Also switches to "My own words", in case a note's reminder was tapped
  // while this screen was already open on a quote (navigating then only
  // swaps the params of the open screen).
  useEffect(() => {
    if (!noteId) return;
    getNotes().then((notes) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      setOwnWords(note.text);
      setRecipient(note.to);
      setSource('write');
    });
  }, [noteId]);

  function showAnother() {
    if (!picker) return;
    setQuote(getRandomQuote(FOR_ANYONE, picker.language, { ...picker.prefs, avoidIds: quote ? [quote.id] : [] }));
  }

  const message = source === 'pick' ? (quote?.text ?? '') : ownWords.trim();
  // Only text can carry a tappable link, so the link is only offered there.
  const textToSend = format === 'text' && includeLink ? withKindwordsLink(message) : message;

  async function handleSend() {
    if (!message || sending) return;
    setSending(true);
    try {
      // The picture is the card previewed on screen (useCardShare shows its
      // own message if that goes wrong).
      if (format === 'picture') await share();
      else await shareText(textToSend);
    } catch {
      Alert.alert(t('common.shareErrorTitle'), t('common.shareErrorMessage'));
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <WorldBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('send.title')}</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('kindWord.closeLabel')}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          {recipient ? t('send.forName', { name: recipient }) : t('send.subtitle')}
        </Text>

        <SegmentedControl options={SOURCE_OPTIONS} value={source} onChange={setSource} />

        {source === 'write' && (
          <TextInput
            style={styles.input}
            value={ownWords}
            onChangeText={setOwnWords}
            placeholder={t('send.writePlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        )}

        {/* Exactly what will be sent: the card as a picture, or the text as
            it will arrive. */}
        <View style={styles.preview}>
          {message !== '' && format === 'picture' && (
            <QuoteCard quote={{ text: message }} ref={cardRef} capturing={capturing} />
          )}
          {message !== '' && format === 'text' && (
            <View style={styles.textBubble}>
              <Text style={styles.textBubbleText}>{textToSend}</Text>
            </View>
          )}
          {message === '' && source === 'write' && (
            <Text style={styles.emptyPreview}>{t('send.emptyPreview')}</Text>
          )}
        </View>

        {source === 'pick' && (
          <Pressable onPress={showAnother} style={styles.anotherButton} accessibilityRole="button" hitSlop={8}>
            <Ionicons name="refresh" size={16} color={colors.secondaryText} />
            <Text style={styles.anotherText}>{t('send.another')}</Text>
          </Pressable>
        )}

        <Text style={styles.label}>{t('send.formatLabel')}</Text>
        <SegmentedControl options={FORMAT_OPTIONS} value={format} onChange={setFormat} />

        {format === 'text' && (
          <>
            <View style={styles.linkRow}>
              <Text style={styles.toggleLabel}>{t('send.includeLink')}</Text>
              <Switch value={includeLink} onValueChange={setIncludeLink} trackColor={{ true: colors.accent }} />
            </View>
            <Text style={styles.hint}>{t('send.includeLinkSubtitle')}</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.sendButton, (!message || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message || sending}
        >
          <Text style={styles.sendButtonText}>{t('send.sendButton')}</Text>
        </Pressable>
      </View>
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
      fontSize: 17,
      color: colors.primaryText,
      ...headingFont(world),
    },
    closeButton: {
      padding: 6,
    },
    closeText: {
      fontSize: 20,
      color: colors.mutedText,
    },
    content: {
      padding: 24,
      paddingTop: 8,
      paddingBottom: 32,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 19,
      marginBottom: 16,
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
      minHeight: 100,
      marginTop: 16,
    },
    preview: {
      marginTop: 20,
      alignItems: 'center',
    },
    emptyPreview: {
      fontSize: 13,
      color: colors.mutedText,
      textAlign: 'center',
    },
    textBubble: {
      alignSelf: 'stretch',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    textBubbleText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.primaryText,
    },
    anotherButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    anotherText: {
      marginLeft: 6,
      fontSize: 13,
      color: colors.secondaryText,
      textDecorationLine: 'underline',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 24,
      marginBottom: 8,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginRight: 12,
    },
    hint: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 19,
      marginTop: 4,
    },
    footer: {
      padding: 24,
      paddingTop: 8,
    },
    sendButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: colors.accentText,
      fontSize: 16,
      ...headingFont(world),
    },
  });
}
