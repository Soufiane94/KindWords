// Sends a kind word out through the device share sheet, either as a picture
// of a quote card or (since Phase 8) as plain text. Taking the picture and
// sharing it are separate steps so the card can go back to normal on
// screen as soon as the picture is taken (see useCardShare).

import { RefObject } from 'react';
import { Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import i18n from '../i18n';

// Where "Add a link to Kindwords" points: the Play Store listing for the
// package name in app.json. On Android it opens in the Play Store app,
// which offers "Install", or "Open" if Kindwords is already installed. It
// only leads somewhere once the app is published (Phase 11); a link on our
// own website could later open the app directly and suit iPhones too.
export const KINDWORDS_LINK = 'https://play.google.com/store/apps/details?id=com.kindwords.app';

export async function captureViewAsImage(viewRef: RefObject<View | null>): Promise<string | null> {
  if (!viewRef.current) return null;
  return captureRef(viewRef, { format: 'png' });
}

export async function shareImage(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: i18n.t('common.shareDialogTitle'),
    });
  }
}

// Text goes through React Native's own Share API: expo-sharing only shares
// files, and plain text is what messaging apps show as a normal message,
// with any link in it tappable.
export async function shareText(message: string): Promise<void> {
  await Share.share({ message }, { dialogTitle: i18n.t('common.shareDialogTitle') });
}

// The message plus one gentle line at the end about Kindwords, so whoever
// receives it can try the app if they'd like.
export function withKindwordsLink(message: string): string {
  return `${message}\n\n${i18n.t('send.linkLine', { url: KINDWORDS_LINK })}`;
}
