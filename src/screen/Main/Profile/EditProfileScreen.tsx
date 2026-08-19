import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import PostJobHeader from '../components/PostJobHeader';


type EditProfileScreenProps = {
  onBack: () => void;
};

function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState('Mehul Joshi');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('mehul.joshi@email.com');
  const [about, setAbout] = useState('Reliable service professional, ready to help with local jobs.');

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
        <Text style={[styles.label, { color: colors.text }]}>About You</Text>
        <TextInput multiline value={about} onChangeText={setAbout} placeholder="Tell us about yourself" placeholderTextColor={colors.textMuted} style={[styles.input, styles.aboutInput, { borderColor: '#E1D8E9', color: colors.text }]} textAlignVertical="top" />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveText}>Save Changes</Text>
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
  input: { backgroundColor: '#FCFBFD', borderRadius: 9, borderWidth: 1, fontSize: 13, height: 46, paddingHorizontal: 13 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 19 },
  photoHint: { fontSize: 11, marginTop: 9, textAlign: 'center' },
  saveButton: { alignItems: 'center', borderRadius: 8, height: 48, justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  screen: { flex: 1 },
});

export default EditProfileScreen;
