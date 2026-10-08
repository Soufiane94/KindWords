// Turns a quote card into a PNG and opens the device share sheet, so a
// quote can be sent as an image to someone instead of just as text.

import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareViewAsImage(viewRef: RefObject<View | null>): Promise<void> {
  if (!viewRef.current) return;

  const uri = await captureRef(viewRef, { format: 'png', quality: 0.9 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share this kind word',
    });
  }
}
