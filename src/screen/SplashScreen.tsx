import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { LocalizedText as Text } from '../localization/AppLocalization';
import { brandColors, useAppTheme } from '../theme/AppTheme';
import { rf } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

function SplashScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  useEffect(() => {
    const timeout = setTimeout(() => navigation.replace('Login'), 2500);

    return () => clearTimeout(timeout);
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
