// True when the phone's text size is set well above normal (9C). A few
// tight rows (the check-in's five moods, the actions under a quote) switch
// to a roomier layout then, instead of cutting words off.

import { useWindowDimensions } from 'react-native';

const LARGE_TEXT_SCALE = 1.3;

export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= LARGE_TEXT_SCALE;
}
