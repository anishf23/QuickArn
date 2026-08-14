import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

function OTPScreen({ navigation, route }: Props) {
  const { colors, isDark } = useAppTheme();
  const [otp, setOtp] = useState('');
  const isComplete = otp.length === 6;

  const updateOtp = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, 6));
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
          <Pressable onPress={navigation.goBack} style={styles.backButton}>
            <Image
              accessibilityLabel="Go back"
              source={require('../../../images/back.png')}
              style={styles.backImage}
            />
          </Pressable>

          <View style={styles.main}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>✓</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Verify your number
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              We sent a 6-digit code to{`\n`}+91 {route.params.phoneNumber}
            </Text>

            <View style={styles.otpWrapper}>
              <View pointerEvents="none" style={styles.otpRow}>
                {Array.from({ length: 6 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          index === otp.length
                            ? brandColors.blue
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                      },
                    ]}
                  >
                    <Text style={[styles.digit, { color: colors.text }]}>
                      {otp[index] ?? ''}
                    </Text>
                  </View>
                ))}
              </View>
              <TextInput
                autoFocus
                caretHidden
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={updateOtp}
                selectionColor="transparent"
                style={styles.hiddenInput}
                value={otp}
              />
            </View>

            <Pressable
              disabled={!isComplete}
              onPress={() => navigation.replace('ProfileSetup')}
              style={[
                styles.verifyButton,
                {
                  backgroundColor: isComplete
                    ? brandColors.blue
                    : isDark
                    ? '#334155'
                    : '#CBD5E1',
                },
              ]}
            >
              <Text style={styles.verifyText}>Verify OTP</Text>
            </Pressable>

            <Text style={[styles.resendHint, { color: colors.textMuted }]}>
              Didn't receive the code?
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Code resent',
                  'A new verification code has been sent.',
                )
              }
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backImage: { height: 22, width: 22 },
  content: { flex: 1 },
  digit: { fontSize: rf(24), fontWeight: '700' },
  flex: { flex: 1 },
  hiddenInput: {
    bottom: 0,
    color: 'transparent',
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  icon: { color: '#FFFFFF', fontSize: rf(30), fontWeight: '800' },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: brandColors.blue,
    borderRadius: hp(5),
    height: hp(10),
    justifyContent: 'center',
    width: hp(10),
  },
  main: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: hp(12),
  },
  otpBox: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: hp(6.8),
    justifyContent: 'center',
    width: hp(5.5),
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpWrapper: {
    height: hp(6.8),
    marginTop: hp(5),
    position: 'relative',
    width: '100%',
  },
  resendHint: { fontSize: 14, marginTop: 28 },
  resendText: {
    color: brandColors.orange,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  safeArea: { flex: 1 },
  subtitle: {
    fontSize: rf(16),
    lineHeight: hp(3),
    marginTop: hp(1.8),
    textAlign: 'center',
  },
  title: {
    fontSize: rf(28),
    fontWeight: '800',
    marginTop: hp(3.2),
    textAlign: 'center',
  },
  verifyButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    marginTop: 36,
    width: '100%',
  },
  verifyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

export default OTPScreen;
