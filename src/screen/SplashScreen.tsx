import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { LocalizedText as Text } from '../localization/AppLocalization';
import { startFcmTokenSync, subscribeToAuthState } from '../services/firebaseUser';
import { brandColors, useAppTheme } from '../theme/AppTheme';
import { rf } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

function SplashScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  useEffect(() => {
    let hasNavigated = false;
    let navigationTimer: ReturnType<typeof setTimeout> | undefined;

    const goToNextScreen = (isSignedIn: boolean) => {
      if (hasNavigated) {
        return;
      }

      hasNavigated = true;
      if (isSignedIn) {
        navigation.replace('LocationAccess', { saveLocation: false });
      } else {
        navigation.replace('Login');
      }
    };

    const unsubscribe = subscribeToAuthState(user => {
      if (user) {
        // Refresh the stored FCM token on every signed-in app launch.
        startFcmTokenSync(user.uid);
      }
      navigationTimer = setTimeout(() => goToNextScreen(Boolean(user)), 1800);
    });

    const fallbackTimer = setTimeout(() => goToNextScreen(false), 3000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
      if (navigationTimer) {
        clearTimeout(navigationTimer);
      }
    };
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Quick<Text style={styles.accent}>Arn</Text>
      </Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>
        Anyone. Any Skill. Anytime. <Text style={styles.accent}>Earn.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: rf(42),
    fontWeight: '700',
  },
  accent: { color: brandColors.orange },
  tagline: { fontSize: rf(16), marginTop: 10 },
});

export default SplashScreen;
