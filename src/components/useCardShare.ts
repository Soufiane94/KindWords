// Shares a QuoteCard as a picture: pass `cardRef` and `capturing` to a
// `framed` QuoteCard, and call `share` from a share button. See QuoteCard
// for why the frame's corners change for that moment.

import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureViewAsImage, shareImage } from '../services/share';

// Resolves once the latest state change has actually been drawn on screen
// (two frames, to be safe), so the capture sees the square corners.
function waitForNextFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function useCardShare() {
  const cardRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const { t } = useTranslation();

  async function share() {
    setCapturing(true);
    try {
      await waitForNextFrames();
      const uri = await captureViewAsImage(cardRef);
      setCapturing(false);
      if (uri) await shareImage(uri);
    } catch {
      Alert.alert(t('common.shareErrorTitle'), t('common.shareErrorMessage'));
    } finally {
      setCapturing(false);
    }
  }

  return { cardRef, capturing, share };
}
