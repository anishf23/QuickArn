import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { CustomAlertProvider } from './src/components/CustomAlert';
import { LocalizationProvider } from './src/localization/AppLocalization';
import { ThemeProvider, useAppTheme } from './src/theme/AppTheme';
import { subscribeToPushNotifications } from './src/services/pushNotifications';

function App() {
  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <ThemeProvider>
          <CustomAlertProvider>
            <AppContent />
          </CustomAlertProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const theme = useAppTheme();

  useEffect(() => subscribeToPushNotifications({
    // Keep FCM event handling and Metro logs, but do not show an in-app
    // CustomAlert when a push message arrives.
    onForeground: () => {},
    onOpen: () => {},
  }), []);

  return (
    <NavigationContainer theme={theme.navigation}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default App;
