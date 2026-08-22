import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { updateCurrentUser } from '../../../services/firebaseUser';
import PostJobHeader from '../components/PostJobHeader';


type EditProfileScreenProps = {
  onBack: () => void;
};

const genders = ['Male', 'Female', 'Other'] as const;

function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState('Mehul Joshi');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('mehul.joshi@email.com');
  const [about, setAbout] = useState('Reliable service professional, ready to help with local jobs.');
  const [gender, setGender] = useState<(typeof genders)[number]>('Male');
  const [skills, setSkills] = useState(['Delivery', 'Driving', 'Cooking', 'Plumbing']);
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentUser({
        fullName: name.trim(),
        mobileNumber: phone.trim(),
        email: email.trim(),
        gender,
        skills,
        about: about.trim(),
      });
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      <PostJobHeader onBack={onBack} title="Edit Profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" style={[styles.avatar, { backgroundColor: '#E5E0FF' }]}>
          <Text style={styles.avatarText}>MJ</Text>
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}><Text style={styles.cameraText}>⌑</Text></View>
        </Pressable>
        <Text style={[styles.photoHint, { color: colors.textMuted }]}>Tap to change profile photo</Text>

        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#E1D8E9', color: colors.text }]} />
        <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
        <TextInput value={phone} keyboardType="phone-pad" onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#E1D8E9', color: colors.text }]} />
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
        <Text style={[styles.label, { color: colors.text }]}>About You</Text>
        <TextInput multiline value={about} onChangeText={setAbout} placeholder="Tell us about yourself" placeholderTextColor={colors.textMuted} style={[styles.input, styles.aboutInput, { borderColor: '#E1D8E9', color: colors.text }]} textAlignVertical="top" />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Pressable accessibilityRole="button" disabled={isSaving} onPress={saveProfile} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutInput: { height: 104, paddingTop: 12 },
  avatar: { alignItems: 'center', alignSelf: 'center', borderRadius: 46, height: 92, justifyContent: 'center', marginTop: 5, width: 92 },
  avatarText: { color: '#665C78', fontSize: 18, fontWeight: '800' },
  cameraBadge: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, bottom: -2, height: 28, justifyContent: 'center', position: 'absolute', right: -1, width: 28 },
  cameraText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  content: { paddingBottom: 92, paddingHorizontal: 18, paddingTop: 20 },
  footer: { borderTopColor: '#E9E4EE', borderTopWidth: StyleSheet.hairlineWidth, bottom: 0, left: 0, padding: 14, position: 'absolute', right: 0 },
  genderOption: { alignItems: 'center', borderRadius: 9, borderWidth: 1, flex: 1, height: 49, justifyContent: 'center', marginHorizontal: 3 },
  genderRow: { flexDirection: 'row', marginHorizontal: -3 },
  genderText: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  input: { backgroundColor: '#FCFBFD', borderRadius: 9, borderWidth: 1, fontSize: 13, height: 46, paddingHorizontal: 13 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 19 },
  photoHint: { fontSize: 11, marginTop: 9, textAlign: 'center' },
  radio: { alignItems: 'center', borderRadius: 7, borderWidth: 1.2, height: 14, justifyContent: 'center', width: 14 },
  radioDot: { backgroundColor: '#FFFFFF', borderRadius: 4, height: 7, width: 7 },
  removeSkill: { fontSize: 17, fontWeight: '500', lineHeight: 18, marginLeft: 5 },
  saveButton: { alignItems: 'center', borderRadius: 8, height: 48, justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  screen: { flex: 1 },
  skillChip: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginBottom: 8, marginRight: 8, paddingHorizontal: 10, paddingVertical: 6 },
  skillText: { fontSize: 10, fontWeight: '700' },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: -8 },
});

export default EditProfileScreen;
