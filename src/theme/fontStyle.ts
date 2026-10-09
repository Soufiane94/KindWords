// A loaded custom font file already has its own weight baked in — adding
// fontWeight on top makes React Native fake-bold the glyphs, which looks
// broken (especially on Android). The Simple world has no custom font, so
// it still needs a real fontWeight to render bold text correctly.

import type { TextStyle } from 'react-native';
import type { World } from '../data/worlds';

export function headingFont(world: World): TextStyle {
  return world.fonts.heading ? { fontFamily: world.fonts.heading } : { fontWeight: '700' };
}

export function bodyFont(world: World): TextStyle {
  return world.fonts.body ? { fontFamily: world.fonts.body } : {};
}
