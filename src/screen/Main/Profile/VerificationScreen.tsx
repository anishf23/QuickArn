import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type VerificationScreenProps = { onBack: () => void; onComplete: () => void };

const skills = ['Delivery', 'Driver', 'Cooking', 'Cleaning', 'Plumbing'];

function VerificationScreen({ onBack, onComplete }: VerificationScreenProps) {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState(['Delivery', 'Driver', 'Cooking']);
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);

  const toggleSkill = (skill: string) => setSelectedSkills(current => current.includes(skill) ? current.filter(item => item !== skill) : [...current, skill]);
  const goNext = () => step === 5 ? onComplete() : setStep(current => current + 1);
  const title = ['Select Your Skills', 'Verify Your Identity', 'Take a Selfie', 'Add Bank Account', 'Review & Submit'][step - 1];

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      <PostJobHeader onBack={step === 1 ? onBack : () => setStep(current => current - 1)} title="Profile Verification" />
      <View style={styles.progressInfo}><Text style={[styles.stepText, { color: colors.textMuted }]}>STEP {step} OF 5</Text><Text style={[styles.stepText, { color: colors.primary }]}>{step * 20}%</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${step * 20}%` }]} /></View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {step === 1 && <>
          <Text style={[styles.description, { color: colors.textMuted }]}>You can select multiple skills to highlight your expertise.</Text>
          <View style={styles.searchBox}><Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text><Text style={[styles.searchText, { color: colors.textMuted }]}>Search skills...</Text></View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Skills</Text>
          {skills.map(skill => {
            const selected = selectedSkills.includes(skill);
            return <Pressable key={skill} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleSkill(skill)} style={[styles.skillRow, { borderColor: selected ? colors.primary : '#DED6E8' }]}><View style={[styles.skillIcon, { backgroundColor: '#EDE1FF' }]}><Text style={[styles.skillSymbol, { color: colors.primary }]}>▣</Text></View><Text style={[styles.skillName, { color: colors.text }]}>{skill}</Text><View style={[styles.checkbox, { backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : '#A8A1B0' }]}>{selected && <Text style={styles.check}>✓</Text>}</View></Pressable>;
          })}
          <Text style={[styles.moreSkills, { color: colors.primary }]}>＋  Add More Skills</Text>
        </>}

        {step === 2 && <>
          <Text style={[styles.description, { color: colors.textMuted }]}>Upload government-issued identity proof.</Text>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Select Document Type</Text><View style={styles.documentSelect}><Text style={[styles.documentText, { color: colors.text }]}>Aadhaar Card</Text><Text style={[styles.documentArrow, { color: colors.textMuted }]}>⌄</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setFrontUploaded(true)} style={[styles.uploadBox, { borderColor: frontUploaded ? colors.primary : '#D7CBE5' }]}><Text style={[styles.uploadIcon, { color: colors.primary }]}>{frontUploaded ? '✓' : '↑'}</Text><Text style={[styles.uploadText, { color: colors.text }]}>{frontUploaded ? 'Front Side Uploaded' : 'Upload Front Side'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setBackUploaded(true)} style={[styles.uploadBox, { borderColor: backUploaded ? colors.primary : '#D7CBE5' }]}><Text style={[styles.uploadIcon, { color: colors.primary }]}>{backUploaded ? '✓' : '↑'}</Text><Text style={[styles.uploadText, { color: colors.text }]}>{backUploaded ? 'Back Side Uploaded' : 'Upload Back Side'}</Text></Pressable>
        </>}

        {step === 3 && <>
          <Text style={[styles.description, styles.centered, { color: colors.textMuted }]}>Make sure your face is clearly visible and well-lit.</Text>
          <View style={[styles.selfiePreview, { borderColor: selfieTaken ? colors.primary : '#D7CBE5' }]}><Text style={[styles.selfieIcon, { color: selfieTaken ? colors.primary : '#B8A7D2' }]}>{selfieTaken ? '✓' : '◉'}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setSelfieTaken(true)} style={[styles.cameraButton, { backgroundColor: colors.primary }]}><Text style={styles.cameraText}>{selfieTaken ? 'Selfie Captured' : '▣  Open Camera'}</Text></Pressable>
          <Text style={[styles.selfieHint, { color: colors.textMuted }]}>Position your face within the frame and avoid wearing sunglasses or hats.</Text>
        </>}

        {step === 4 && <>
          <Text style={[styles.description, { color: colors.textMuted }]}>Your earnings will be sent to this account.</Text>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Account Holder Name</Text><TextInput placeholder="e.g. Mehul Joshi" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#DED6E8', color: colors.text }]} />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Account Number</Text><TextInput keyboardType="numeric" placeholder="e.g. 1234 5678 9012" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#DED6E8', color: colors.text }]} />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>IFSC Code</Text><TextInput autoCapitalize="characters" placeholder="e.g. HDFC0001234" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#DED6E8', color: colors.text }]} />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>UPI ID <Text style={[styles.optional, { color: colors.textMuted }]}>(Optional)</Text></Text><TextInput placeholder="e.g. mehul@upi" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: '#DED6E8', color: colors.text }]} />
          <Text style={[styles.securityText, { color: colors.textMuted }]}>▣  Your bank details are encrypted and secure</Text>
        </>}

        {step === 5 && <>
          <Text style={[styles.description, { color: colors.textMuted }]}>Review your details before submitting for verification.</Text>
          <View style={styles.reviewCard}><Text style={[styles.reviewTitle, { color: colors.text }]}>Skills</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{selectedSkills.join(', ') || 'No skills selected'}</Text></View>
          <View style={styles.reviewCard}><Text style={[styles.reviewTitle, { color: colors.text }]}>Identity Proof</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{frontUploaded && backUploaded ? 'Aadhaar Card uploaded' : 'Documents pending'}</Text></View>
          <View style={styles.reviewCard}><Text style={[styles.reviewTitle, { color: colors.text }]}>Selfie</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{selfieTaken ? 'Selfie captured' : 'Selfie pending'}</Text></View>
          <Text style={[styles.readyText, { color: colors.primary }]}>You are ready to start receiving jobs.</Text>
        </>}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        {step > 1 && <Pressable accessibilityRole="button" onPress={() => setStep(current => current - 1)} style={styles.backButton}><Text style={[styles.backText, { color: colors.textMuted }]}>‹  Back</Text></Pressable>}
        <Pressable accessibilityRole="button" onPress={goNext} style={[styles.continueButton, { backgroundColor: colors.primary }]}><Text style={styles.continueText}>{step === 4 ? 'Save & Continue' : step === 5 ? 'Submit Verification' : 'Continue  ›'}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', borderColor: '#AFA6B8', borderRadius: 6, borderWidth: 1, height: 40, justifyContent: 'center', marginRight: 10, width: 120 },
  backText: { fontSize: rf(11), fontWeight: '800' },
  cameraButton: { alignItems: 'center', alignSelf: 'center', borderRadius: 18, marginTop: 18, paddingHorizontal: 20, paddingVertical: 10 },
  cameraText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  centered: { textAlign: 'center' },
  check: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '900' },
  checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 18, justifyContent: 'center', width: 18 },
  continueButton: { alignItems: 'center', borderRadius: 6, flex: 1, height: 40, justifyContent: 'center' },
  continueText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  content: { flex: 1, paddingBottom: 82, paddingHorizontal: 14, paddingTop: 16 },
  description: { fontSize: rf(11), lineHeight: rf(15), marginTop: 6 },
  documentArrow: { fontSize: rf(16) },
  documentSelect: { alignItems: 'center', backgroundColor: '#FBF9FE', borderColor: '#DED6E8', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 38, justifyContent: 'space-between', paddingHorizontal: 11 },
  documentText: { fontSize: rf(11) },
  fieldLabel: { fontSize: rf(10), fontWeight: '700', marginBottom: 7, marginTop: 18 },
  footer: {
    borderTopColor: '#E5E7EB',
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  input: { backgroundColor: '#FBF9FE', borderRadius: 6, borderWidth: 1, fontSize: rf(11), height: 38, paddingHorizontal: 11 },
  moreSkills: { fontSize: rf(11), fontWeight: '800', marginTop: 14 },
  optional: { fontSize: rf(9), fontWeight: '400' },
  progressFill: { borderRadius: 3, height: 4 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10 },
  progressTrack: { backgroundColor: '#E4E7EC', borderRadius: 3, height: 4, marginHorizontal: 14, marginTop: 6 },
  readyText: { fontSize: rf(13), fontWeight: '800', marginTop: 25, textAlign: 'center' },
  reviewCard: { backgroundColor: '#FBF9FE', borderColor: '#E5DDED', borderRadius: 7, borderWidth: 1, marginTop: 11, padding: 12 },
  reviewTitle: { fontSize: rf(11), fontWeight: '800' },
  reviewValue: { fontSize: rf(10), marginTop: 4 },
  searchBox: { alignItems: 'center', backgroundColor: '#FBF9FE', borderColor: '#DED6E8', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 35, marginTop: 17, paddingHorizontal: 10 },
  searchIcon: { fontSize: rf(16), marginRight: 7 },
  searchText: { fontSize: rf(10) },
  screen: { flex: 1 },
  sectionTitle: { fontSize: rf(13), fontWeight: '800', marginTop: 19 },
  securityText: { fontSize: rf(9), marginTop: 16, textAlign: 'center' },
  selfieHint: { fontSize: rf(10), lineHeight: rf(14), marginTop: 15, textAlign: 'center' },
  selfieIcon: { fontSize: rf(62) },
  selfiePreview: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#E5EAFF', borderColor: '#D3C5ED', borderRadius: 85, borderWidth: 1, height: 170, justifyContent: 'center', marginTop: 30, width: 170 },
  skillIcon: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', marginRight: 10, width: 28 },
  skillName: { flex: 1, fontSize: rf(11), fontWeight: '600' },
  skillRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 48, marginTop: 7, paddingHorizontal: 10 },
  skillSymbol: { fontSize: rf(14), fontWeight: '800' },
  stepText: { fontSize: rf(9), fontWeight: '800' },
  title: { fontSize: rf(20), fontWeight: '800' },
  uploadBox: { alignItems: 'center', backgroundColor: '#FBF9FE', borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, height: 100, justifyContent: 'center', marginTop: 10 },
  uploadIcon: { backgroundColor: '#EDE1FF', borderRadius: 16, fontSize: rf(16), height: 32, lineHeight: 31, overflow: 'hidden', textAlign: 'center', width: 32 },
  uploadText: { fontSize: rf(11), fontWeight: '700', marginTop: 7 },
});

export default VerificationScreen;
