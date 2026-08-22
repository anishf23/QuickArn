import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { LocalizedText as Text, useLocalization } from '../../localization/AppLocalization';
import { updateCurrentUser } from '../../services/firebaseUser';
import { useAppTheme } from '../../theme/AppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

const languages = [
  { label: 'English', nativeLabel: 'English' },
  { label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
] as const;

function LanguageSelectionScreen({ navigation, route }: Props) {
  const { colors } = useAppTheme();
  const { language, setLanguage } = useLocalization();
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof languages)[number]['label']>(language === 'gu' ? 'Gujarati' : 'English');
  const isProfileSettings = route.params.mode === 'profile';

  const selectLanguage = (nextLanguage: (typeof languages)[number]['label']) => {
    setSelectedLanguage(nextLanguage);
    const languageCode = nextLanguage === 'Gujarati' ? 'gu' : 'en';
    setLanguage(languageCode);
    updateCurrentUser({ language: languageCode }).catch(() => {});
  };

  const continueToNextScreen = () => {
    if (isProfileSettings) {
      navigation.goBack();
      return;
    }
    navigation.navigate('LocationAccess');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {isProfileSettings ? <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={10} onPress={() => navigation.goBack()} style={styles.backButton}><Text style={[styles.backIcon, { color: colors.text }]}>‹</Text></Pressable> : <View style={styles.headerSpacer} />}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Language</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Choose your language</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>You can change this anytime from Profile settings.</Text>
        <View style={styles.languageList}>
          {languages.map(option => {
            const selected = selectedLanguage === option.label;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => selectLanguage(option.label)}
                style={[styles.languageCard, { backgroundColor: selected ? '#F1E9FF' : colors.card, borderColor: selected ? colors.primary : '#E1E4E8' }]}
              >
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.textMuted }]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View>
                <View style={styles.languageCopy}>
                  <Text style={[styles.languageName, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.nativeName, { color: colors.textMuted }]}>{option.nativeLabel}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Pressable accessibilityRole="button" onPress={continueToNextScreen} style={[styles.continueButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.continueText}>{isProfileSettings ? 'Save Language' : 'Continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 },
  backIcon: { fontSize: 32, fontWeight: '300', lineHeight: 31 },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 40 },
  continueButton: { alignItems: 'center', borderRadius: 10, height: 50, justifyContent: 'center' },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  footer: { padding: 16 },
  header: { alignItems: 'center', borderBottomColor: '#E9E9ED', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 12 },
  headerSpacer: { height: 34, width: 34 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  languageCard: { alignItems: 'center', borderRadius: 12, borderWidth: 1.2, flexDirection: 'row', minHeight: 70, paddingHorizontal: 16 },
  languageCopy: { marginLeft: 13 },
  languageList: { gap: 12, marginTop: 28 },
  languageName: { fontSize: 15, fontWeight: '800' },
  nativeName: { fontSize: 12, marginTop: 4 },
  radio: { alignItems: 'center', borderRadius: 11, borderWidth: 1.5, height: 22, justifyContent: 'center', width: 22 },
  radioDot: { borderRadius: 6, height: 12, width: 12 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800' },
});

export default LanguageSelectionScreen;
