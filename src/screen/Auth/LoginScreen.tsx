import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

const serviceTiles = [
  { icon: '⌂', label: 'Home care' },
  { icon: '⚡', label: 'Electrical' },
  { icon: '⌕', label: 'Repairs' },
  { icon: '✦', label: 'Cleaning' },
  { icon: '⌁', label: 'Plumbing' },
  { icon: '✚', label: 'More skills' },
];

const tileColors = [brandColors.navy, brandColors.blue, brandColors.orange];

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const { height } = useWindowDimensions();
  const [mobileNumber, setMobileNumber] = useState('');
  const [hasReferral, setHasReferral] = useState(false);
  const canContinue = mobileNumber.replace(/\D/g, '').length === 10;
  const isCompact = height < 720;

  const showLegalNotice = (documentName: string) => {
    Alert.alert(documentName, `${documentName} will be available soon.`);
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
          <View style={[styles.hero, isCompact && styles.heroCompact]}>
            <Text style={[styles.logo, isCompact && styles.logoCompact]}>
              Quick<Text style={styles.logoAccent}>Arn</Text>
            </Text>
            <Text
              style={[styles.heroText, isCompact && styles.heroTextCompact]}
            >
              Get skilled help,{`\n`}anytime you need it.
            </Text>
          </View>

          <View style={styles.tileGrid}>
            {serviceTiles.map((service, index) => (
              <View
                key={service.label}
                style={[
                  styles.tile,
                  { backgroundColor: tileColors[index % tileColors.length] },
                ]}
              >
                <Text style={styles.tileIcon}>{service.icon}</Text>
                <Text style={styles.tileLabel}>{service.label}</Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.loginSection,
              isCompact && styles.loginSectionCompact,
            ]}
          >
            <Text style={[styles.heading, { color: colors.text }]}>
              Log in or Sign up
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Text style={[styles.countryCode, { color: colors.text }]}>
                +91
              </Text>
              <TextInput
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={setMobileNumber}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                value={mobileNumber}
              />
            </View>

            <Pressable
              disabled={!canContinue}
              onPress={() =>
                navigation.navigate('OTP', { phoneNumber: mobileNumber })
              }
              style={[
                styles.continueButton,
                {
                  backgroundColor: canContinue
                    ? brandColors.blue
                    : isDark
                    ? '#334155'
                    : '#CBD5E1',
                },
              ]}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>

            <Pressable
              onPress={() => setHasReferral(value => !value)}
              style={styles.referralRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: hasReferral
                      ? brandColors.blue
                      : colors.textMuted,
                  },
                  hasReferral && styles.checkboxSelected,
                ]}
              >
                {hasReferral && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.referralText, { color: colors.text }]}>
                Have a referral code?
              </Text>
            </Pressable>

            <Text style={[styles.terms, { color: colors.textMuted }]}>
              By continuing, you agree to our{' '}
              <Text
                accessibilityRole="link"
                onPress={() => showLegalNotice('Terms of Service')}
                style={[styles.legalLink, { color: colors.text }]}
              >
                Terms of Service
              </Text>{' '}
              &{' '}
              <Text
                accessibilityRole="link"
                onPress={() => showLegalNotice('Privacy Policy')}
                style={[styles.legalLink, { color: colors.text }]}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
  checkboxSelected: {
    backgroundColor: brandColors.blue,
    borderColor: brandColors.blue,
  },
  checkmark: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  content: { flex: 1 },
  continueButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    marginTop: 18,
  },
  continueText: { color: '#FFFFFF', fontSize: rf(17), fontWeight: '700' },
  countryCode: { fontSize: 17, fontWeight: '700', marginRight: 16 },
  flex: { flex: 1 },
  heading: { fontSize: rf(28), fontWeight: '800', textAlign: 'center' },
  hero: {
    alignItems: 'center',
    backgroundColor: brandColors.blue,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    minHeight: hp(27),
    paddingHorizontal: 24,
    paddingTop: 34,
  },
  heroCompact: { minHeight: hp(21), paddingTop: hp(2.5) },
  heroText: {
    color: '#FFFFFF',
    fontSize: rf(25),
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 12,
    textAlign: 'center',
  },
  heroTextCompact: { fontSize: rf(21), lineHeight: hp(3.4), marginTop: hp(1) },
  input: { flex: 1, fontSize: rf(17), padding: 0 },
  inputContainer: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    flexDirection: 'row',
    height: hp(7),
    marginTop: 18,
    paddingHorizontal: 20,
  },
  loginSection: { paddingHorizontal: 32, paddingTop: 14 },
  loginSectionCompact: { paddingTop: 6 },
  legalLink: { fontWeight: '700', textDecorationLine: 'underline' },
  logo: {
    color: '#FFFFFF',
    fontSize: rf(40),
    fontWeight: '800',
    marginTop: hp(2),
  },
  logoAccent: { color: brandColors.orange },
  logoCompact: { fontSize: rf(35), marginTop: hp(0.5) },
  referralRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  referralText: { fontSize: 16, marginLeft: 11 },
  safeArea: { flex: 1 },
  terms: { fontSize: 12, lineHeight: 17, marginTop: 18, textAlign: 'center' },
  tile: {
    alignItems: 'center',
    borderRadius: 16,
    height: 78,
    justifyContent: 'center',
    margin: 4,
    width: 78,
  },
  tileIcon: { color: '#FFFFFF', fontSize: rf(25), fontWeight: '700' },
  tileLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  tileGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
    width: 258,
  },
});

export default LoginScreen;
