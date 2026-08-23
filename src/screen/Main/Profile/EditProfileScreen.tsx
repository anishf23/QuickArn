import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, type ScrollViewInstance, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

import { useAppTheme } from '../../../theme/AppTheme';
import { useCustomAlert } from '../../../components/CustomAlert';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { getCachedUserProfile, updateCurrentUser } from '../../../services/firebaseUser';
import PostJobHeader from '../components/PostJobHeader';


type EditProfileScreenProps = {
  onBack: () => void;
};

const genders = ['Male', 'Female', 'Other'] as const;

function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [gender, setGender] = useState<(typeof genders)[number]>('Male');
  const [skills, setSkills] = useState<string[]>([]);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    getCachedUserProfile().then(profile => {
      if (!profile) {
        return;
      }

      setName(profile.fullName ?? '');
      setPhone(profile.mobileNumber ?? '');
      setEmail(profile.email ?? '');
      setAbout(profile.about ?? '');
      setSkills(profile.skills ?? []);
      setIsCustomer(profile.role === 'customer');
      if (profile.gender === 'Male' || profile.gender === 'Female' || profile.gender === 'Other') {
        setGender(profile.gender);
      }
    }).catch(() => {});
  }, []);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'U';

  const saveProfile = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const profileUpdates = {
        fullName: name.trim(),
        mobileNumber: phone.trim(),
        email: email.trim(),
        gender,
        skills,
        about: about.trim(),
      };

      // updateCurrentUser writes these fields to users/{firebaseUid} and then
      // refreshes the local AsyncStorage profile cache before resolving.
      await updateCurrentUser(profileUpdates);
      showAlert(
        'Profile updated',
        'Your profile changes have been saved successfully.',
        [{ text: 'OK', onPress: onBack }],
      );
    } catch (error) {
      showAlert(
        'Unable to save profile',
        error instanceof Error ? error.message : 'Please check your internet connection and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const focusAboutField = () => {
    // Wait for the keyboard to begin opening, then bring the final field above it.
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 180);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      <PostJobHeader onBack={onBack} title="Edit Profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <Pressable accessibilityRole="button" style={[styles.avatar, { backgroundColor: '#E5E0FF' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}><Text style={styles.cameraText}>⌑</Text></View>
          </Pressable>
          <Text style={[styles.photoHint, { color: colors.textMuted }]}>Tap to change profile photo</Text>

          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#E1D8E9', color: colors.text }]} />
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            editable={false}
            keyboardType="phone-pad"
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus={false}
            style={[styles.input, styles.readOnlyInput, { borderColor: '#E1D8E9', color: colors.textMuted }]}
            value={phone}
          />
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <TextInput value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#E1D8E9', color: colors.text }]} />
          <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
          <View style={styles.genderRow}>
            {genders.map(option => {
              const selected = gender === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setGender(option)}
                  style={[styles.genderOption, { backgroundColor: selected ? colors.primary : '#FCFBFD', borderColor: selected ? colors.primary : '#E1D8E9' }]}
                >
                  <View style={[styles.radio, { borderColor: selected ? '#FFFFFF' : colors.textMuted }]}>{selected && <View style={styles.radioDot} />}</View>
                  <Text style={[styles.genderText, { color: selected ? '#FFFFFF' : colors.text }]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          {!isCustomer && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>My Skills</Text>
              <View style={styles.skillsList}>
                {skills.map(skill => (
                  <View key={skill} style={[styles.skillChip, { backgroundColor: '#F0E8FF' }]}>
                    <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                    <Pressable accessibilityLabel={`Remove ${skill}`} accessibilityRole="button" hitSlop={8} onPress={() => setSkills(current => current.filter(item => item !== skill))}>
                      <Text style={[styles.removeSkill, { color: colors.primary }]}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
          <Text style={[styles.label, { color: colors.text }]}>About You</Text>
          <TextInput
            blurOnSubmit
            multiline
            onChangeText={setAbout}
            onFocus={focusAboutField}
            onSubmitEditing={saveProfile}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={[styles.input, styles.aboutInput, { borderColor: '#E1D8E9', color: colors.text }]}
            textAlignVertical="top"
            value={about}
          />
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Pressable accessibilityRole="button" disabled={isSaving} onPress={saveProfile} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutInput: { height: 104, paddingTop: 12 },
  avatar: { alignItems: 'center', alignSelf: 'center', borderRadius: 46, height: 92, justifyContent: 'center', marginTop: 5, width: 92 },
  avatarText: { color: '#665C78', fontSize: RFValue(15), fontWeight: '800' },
  cameraBadge: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, bottom: -2, height: 28, justifyContent: 'center', position: 'absolute', right: -1, width: 28 },
  cameraText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  content: { paddingBottom: 20, paddingHorizontal: 18, paddingTop: 20 },
  footer: { borderTopColor: '#E9E4EE', borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  genderOption: { alignItems: 'center', borderRadius: 9, borderWidth: 1, flex: 1, height: 49, justifyContent: 'center', marginHorizontal: 3 },
  genderRow: { flexDirection: 'row', marginHorizontal: -3 },
  genderText: { fontSize: RFValue(13), fontWeight: '700', marginTop: 4 },
  input: { backgroundColor: '#FCFBFD', borderRadius: 9, borderWidth: 1, fontSize: RFValue(14), height: 50, paddingHorizontal: 13 },
  keyboardContainer: { flex: 1 },
  label: { fontSize: RFValue(14), fontWeight: '700', marginBottom: 8, marginTop: 19 },
  photoHint: { fontSize: RFValue(11), marginTop: 9, textAlign: 'center' },
  radio: { alignItems: 'center', borderRadius: 7, borderWidth: 1.2, height: 14, justifyContent: 'center', width: 14 },
  radioDot: { backgroundColor: '#FFFFFF', borderRadius: 4, height: 7, width: 7 },
  readOnlyInput: { backgroundColor: '#F5F3F7' },
  removeSkill: { fontSize: 17, fontWeight: '500', lineHeight: 18, marginLeft: 5 },
  saveButton: { alignItems: 'center', borderRadius: 8, height: 48, justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: RFValue(14), fontWeight: '800' },
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  skillChip: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginBottom: 8, marginRight: 8, paddingHorizontal: 10, paddingVertical: 6 },
  skillText: { fontSize: RFValue(11), fontWeight: '700' },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: -8 },
});

export default EditProfileScreen;
