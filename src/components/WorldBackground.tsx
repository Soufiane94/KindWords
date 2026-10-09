// Sits behind a screen's content: paints the current world's gradient (or
// nothing, for Simple) plus its small ambient decorations. Purely visual
// and never intercepts touches, so screens just drop it in as their first
// child without needing to know which world is active.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import NatureDecorations from './decorations/NatureDecorations';
import SpaceDecorations from './decorations/SpaceDecorations';
import MedievalDecorations from './decorations/MedievalDecorations';
import DesertDecorations from './decorations/DesertDecorations';
import OceanDecorations from './decorations/OceanDecorations';
import CabinDecorations from './decorations/CabinDecorations';
import GardenDecorations from './decorations/GardenDecorations';
import StorybookDecorations from './decorations/StorybookDecorations';
import WinterDecorations from './decorations/WinterDecorations';
import MeadowDecorations from './decorations/MeadowDecorations';
import LettersDecorations from './decorations/LettersDecorations';
import CloudsDecorations from './decorations/CloudsDecorations';
import QuiltDecorations from './decorations/QuiltDecorations';

export default function WorldBackground() {
  const { world } = useTheme();

  if (!world.background) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={world.background.colors} style={StyleSheet.absoluteFill} />
      {world.decorations === 'nature' && <NatureDecorations />}
      {world.decorations === 'space' && <SpaceDecorations />}
      {world.decorations === 'medieval' && <MedievalDecorations />}
      {world.decorations === 'desert' && <DesertDecorations />}
      {world.decorations === 'ocean' && <OceanDecorations />}
      {world.decorations === 'cabin' && <CabinDecorations />}
      {world.decorations === 'garden' && <GardenDecorations />}
      {world.decorations === 'storybook' && <StorybookDecorations />}
      {world.decorations === 'winter' && <WinterDecorations />}
      {world.decorations === 'meadow' && <MeadowDecorations />}
      {world.decorations === 'letters' && <LettersDecorations />}
      {world.decorations === 'clouds' && <CloudsDecorations />}
      {world.decorations === 'quilt' && <QuiltDecorations />}
    </View>
  );
}
