// The world around a card in a shared picture: the world's gradient plus a
// few of its decorations, kept still and placed around the card's sides and
// corners. A picture leaves the app's own background behind, so it brings a
// piece of the sender's world along. Like WorldBackground, but sized to the
// picture instead of the screen; Simple stays plain here too.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { NatureFrame } from './decorations/NatureDecorations';
import { SpaceFrame } from './decorations/SpaceDecorations';
import { MedievalFrame } from './decorations/MedievalDecorations';
import { DesertFrame } from './decorations/DesertDecorations';
import { OceanFrame } from './decorations/OceanDecorations';
import { CabinFrame } from './decorations/CabinDecorations';
import { GardenFrame } from './decorations/GardenDecorations';
import { StorybookFrame } from './decorations/StorybookDecorations';
import { WinterFrame } from './decorations/WinterDecorations';
import { MeadowFrame } from './decorations/MeadowDecorations';
import { LettersFrame } from './decorations/LettersDecorations';
import { CloudsFrame } from './decorations/CloudsDecorations';
import { QuiltFrame } from './decorations/QuiltDecorations';

export default function WorldFrame() {
  const { world } = useTheme();

  if (!world.background) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={world.background.colors} style={StyleSheet.absoluteFill} />
      {world.decorations === 'nature' && <NatureFrame />}
      {world.decorations === 'space' && <SpaceFrame />}
      {world.decorations === 'medieval' && <MedievalFrame />}
      {world.decorations === 'desert' && <DesertFrame />}
      {world.decorations === 'ocean' && <OceanFrame />}
      {world.decorations === 'cabin' && <CabinFrame />}
      {world.decorations === 'garden' && <GardenFrame />}
      {world.decorations === 'storybook' && <StorybookFrame />}
      {world.decorations === 'winter' && <WinterFrame />}
      {world.decorations === 'meadow' && <MeadowFrame />}
      {world.decorations === 'letters' && <LettersFrame />}
      {world.decorations === 'clouds' && <CloudsFrame />}
      {world.decorations === 'quilt' && <QuiltFrame />}
    </View>
  );
}
