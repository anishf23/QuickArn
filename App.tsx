import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { LocalizationProvider } from './src/localization/AppLocalization';
import { ThemeProvider, useAppTheme } from './src/theme/AppTheme';

function App() {
  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const theme = useAppTheme();

  return (
    <NavigationContainer theme={theme.navigation}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default App;
