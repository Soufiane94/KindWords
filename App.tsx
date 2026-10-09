import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Quicksand_400Regular, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { MedievalSharp_400Regular } from '@expo-google-fonts/medievalsharp';
import { IMFellEnglish_400Regular } from '@expo-google-fonts/im-fell-english';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { Comfortaa_400Regular, Comfortaa_700Bold } from '@expo-google-fonts/comfortaa';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Baloo2_400Regular, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Fredoka_400Regular, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round';
import { Mali_400Regular, Mali_700Bold } from '@expo-google-fonts/mali';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import i18n from './src/i18n';
import { getUiLanguage } from './src/services/storage';

// Split out so it can read the chosen world — the StatusBar needs to know
// whether the current world counts as light or dark, which only exists
// once ThemeProvider has loaded it. Also loads every world's fonts up
// front (they're tiny), so switching worlds in Settings never flashes
// unstyled text while a font loads in.
function AppContent() {
  const { colors } = useTheme();

  // src/i18n/index.ts already set i18next to the phone's detected language
  // at import time (synchronously); this only needs to apply a saved
  // override, same pattern as ThemeProvider loading the saved world.
  useEffect(() => {
    getUiLanguage().then((language) => {
      if (language !== i18n.language) i18n.changeLanguage(language);
    });
  }, []);

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    MedievalSharp_400Regular,
    IMFellEnglish_400Regular,
    Lora_400Regular,
    Lora_700Bold,
    Comfortaa_400Regular,
    Comfortaa_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    PatrickHand_400Regular,
    Baloo2_400Regular,
    Baloo2_700Bold,
    Fredoka_400Regular,
    Fredoka_700Bold,
    Caveat_700Bold,
    EBGaramond_400Regular,
    VarelaRound_400Regular,
    Mali_400Regular,
    Mali_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
