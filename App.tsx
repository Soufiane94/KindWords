import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// Split out so it can read the chosen theme — the StatusBar needs to know
// whether the current palette is light or dark, which only exists once
// ThemeProvider has loaded it.
function AppContent() {
  const { colors } = useTheme();
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
