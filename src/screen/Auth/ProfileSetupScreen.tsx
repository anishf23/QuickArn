import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  KeyboardAvoidingView,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { updateCurrentUser } from '../../services/firebaseUser';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

const genders = ['Male', 'Female', 'Other'] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

function ProfileSetupScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<(typeof genders)[number] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canContinue =
    name.trim().length > 0 && email.trim().length > 0 && gender !== null;

  const saveProfile = async () => {
    if (!canContinue || isSaving || !gender) {
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentUser({ fullName: name.trim(), gender, email: email.trim() });
      navigation.navigate('LanguageSelection', { mode: 'onboarding' });
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>Q</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Tell us about yourself
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            This helps us personalize your QuickArn experience.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full name
            </Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  color: colors.text,
                },
              ]}
              value={name}
            />

            <Text
              style={[styles.label, styles.emailLabel, { color: colors.text }]}
            >
              Email address
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  color: colors.text,
                },
              ]}
              value={email}
            />

            <Text
              style={[styles.label, styles.genderLabel, { color: colors.text }]}
            >
              Gender
            </Text>
            <View style={styles.genderRow}>
              {genders.map(option => {
                const selected = gender === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setGender(option)}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor: selected
                          ? brandColors.blue
                          : colors.card,
                        borderColor: selected
                          ? brandColors.blue
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? '#FFFFFF' : colors.textMuted,
                        },
                      ]}
                    >
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.genderText,
                        { color: selected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            disabled={!canContinue || isSaving}
            onPress={saveProfile}
            style={[
              styles.continueButton,
              {
                backgroundColor: canContinue && !isSaving
                  ? brandColors.blue
                  : isDark
                  ? '#334155'
                  : '#CBD5E1',
              },
            ]}
          >
            <Text style={styles.continueText}>{isSaving ? 'Saving...' : 'Continue'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 28, paddingTop: hp(8) },
  continueButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: hp(7),
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: hp(4),
  },
  continueText: { color: '#FFFFFF', fontSize: rf(17), fontWeight: '700' },
  emailLabel: { marginTop: hp(2.5) },
  flex: { flex: 1 },
  form: { marginTop: hp(5) },
  genderLabel: { marginTop: hp(2.5) },
  genderOption: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    flex: 1,
    height: hp(7.5),
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  genderRow: { flexDirection: 'row', marginHorizontal: -3, marginTop: hp(1.4) },
  genderText: { fontSize: rf(13), fontWeight: '700', marginTop: 5 },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: brandColors.blue,
    borderRadius: hp(4),
    height: hp(8),
    justifyContent: 'center',
    width: hp(8),
  },
  headerIconText: { color: '#FFFFFF', fontSize: rf(31), fontWeight: '800' },
  input: {
    borderRadius: 14,
    borderWidth: 1.2,
    fontSize: rf(16),
    height: hp(7),
    marginTop: hp(1.2),
    paddingHorizontal: 18,
  },
  label: { fontSize: rf(15), fontWeight: '700' },
  radio: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1.4,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  safeArea: { flex: 1 },
  subtitle: { fontSize: rf(16), lineHeight: hp(3), marginTop: hp(1.4) },
  title: { fontSize: rf(28), fontWeight: '800', marginTop: hp(3) },
});

export default ProfileSetupScreen;
