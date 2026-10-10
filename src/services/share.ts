// Turns a quote card into a PNG and opens the device share sheet, so a
// quote can be sent as an image to someone instead of just as text. The
// two steps are separate so the card can go back to normal on screen as
// soon as the picture is taken (see useCardShare).

import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import i18n from '../i18n';

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
