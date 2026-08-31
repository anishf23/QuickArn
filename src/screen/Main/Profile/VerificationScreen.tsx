import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { serverTimestamp } from '@react-native-firebase/firestore';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { pick, types } from '@react-native-documents/picker';
import { launchCamera } from 'react-native-image-picker';

import { useCustomAlert } from '../../../components/CustomAlert';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { updateCurrentUser } from '../../../services/firebaseUser';
import { getCachedUserProfile } from '../../../services/firebaseUser';
import { ensureInternetConnection } from '../../../services/internetCheck';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type VerificationScreenProps = { onBack: () => void; onComplete: () => void };
type UploadKind = 'front' | 'back' | 'selfie';
const documentTypes = ['Aadhaar Card', 'Pan Card', 'Passport'];
const defaultSkills = ['Delivery', 'Driver', 'Cooking', 'Cleaning', 'Plumbing'];

const extensionFor = (name: string, fallback: string) => name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || fallback;

function VerificationScreen({ onBack, onComplete }: VerificationScreenProps) {
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState(defaultSkills);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [isDocumentTypeOpen, setIsDocumentTypeOpen] = useState(false);
  const [frontUrl, setFrontUrl] = useState('');
  const [backUrl, setBackUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [selfieUri, setSelfieUri] = useState('');
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getCachedUserProfile().then(profile => {
      if (!profile) return;
      setSelectedSkills(profile.skills ?? []);
      setDocumentType(documentTypes.includes(profile.documentType ?? '') ? profile.documentType! : documentTypes[0]);
      setFrontUrl(profile.documentFrontUrl ?? '');
      setBackUrl(profile.documentBackUrl ?? '');
      setSelfieUrl(profile.selfieUrl ?? '');
      setAccountHolderName(profile.bankAccountDetails?.accountHolderName ?? '');
      setAccountNumber(profile.bankAccountDetails?.accountNumber ?? '');
      setIfscCode(profile.bankAccountDetails?.ifscCode ?? '');
      setUpiId(profile.bankAccountDetails?.upiId ?? '');
    }).catch(() => {});
  }, []);

  const toggleSkill = (skill: string) => setSelectedSkills(current => current.includes(skill) ? current.filter(item => item !== skill) : [...current, skill]);
  const visibleSkills = skills.filter(skill => skill.toLowerCase().includes(skillSearch.trim().toLowerCase()));
  const uploadFile = async (kind: UploadKind, uri: string, name: string, contentType?: string | null) => {
    const user = getAuth().currentUser;
    if (!user) throw new Error('Your login session has expired. Please sign in again.');
    await ensureInternetConnection();
    const fileName = `${kind}-${Date.now()}.${extensionFor(name, kind === 'selfie' ? 'jpg' : 'file')}`;
    const storageReference = ref(getStorage(), `Documnet/${user.uid}/${fileName}`);
    await putFile(storageReference, uri, { contentType: contentType ?? undefined });
    return getDownloadURL(storageReference);
  };
  const selectDocument = async (kind: 'front' | 'back') => {
    try {
      const [file] = await pick({ type: [types.images, types.pdf] });
      setUploading(kind);
      const url = await uploadFile(kind, file.uri, file.name ?? `${kind}.file`, file.type);
      if (kind === 'front') { setFrontUrl(url); setErrors(current => ({ ...current, front: '' })); } else { setBackUrl(url); setErrors(current => ({ ...current, back: '' })); }
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('cancel')) return;
      showAlert('Upload failed', error instanceof Error ? error.message : 'Please choose the document again.');
    } finally { setUploading(null); }
  };
  const takeSelfie = async () => {
    try {
      const response = await launchCamera({ cameraType: 'front', mediaType: 'photo', quality: 0.8, saveToPhotos: false });
      if (response.didCancel) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) throw new Error(response.errorMessage || 'Unable to capture selfie.');
      setUploading('selfie');
      const url = await uploadFile('selfie', asset.uri, asset.fileName ?? 'selfie.jpg', asset.type);
      setSelfieUri(asset.uri);
      setSelfieUrl(url);
      setErrors(current => ({ ...current, selfie: '' }));
    } catch (error) { showAlert('Selfie failed', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setUploading(null); }
  };
  const addSkill = () => {
    const value = newSkill.trim();
    if (!value) return;
    setSkills(current => current.some(skill => skill.toLowerCase() === value.toLowerCase()) ? current : [...current, value]);
    setSelectedSkills(current => current.some(skill => skill.toLowerCase() === value.toLowerCase()) ? current : [...current, value]);
    setNewSkill(''); setIsAddingSkill(false);
  };
  const submit = async () => {
    setIsSubmitting(true);
    try {
      await updateCurrentUser({
        role: 'provider',
        skills: selectedSkills,
        documentType,
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl,
        selfieUrl,
        bankAccountDetails: { accountHolderName: accountHolderName.trim(), accountNumber: accountNumber.trim(), ifscCode: ifscCode.trim().toUpperCase(), upiId: upiId.trim() },
        verificationStatus: 'pending',
        verificationSubmittedAt: serverTimestamp(),
      });
      showAlert('Verification submitted', 'Your profile verification details have been saved.', [{ text: 'Continue', onPress: onComplete }]);
    } catch (error) { showAlert('Unable to submit', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setIsSubmitting(false); }
  };
  const continueStep = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 1 && !selectedSkills.filter(Boolean).length) nextErrors.skills = 'Please select at least one skill.';
    // if (step === 2) {
    //   if (!frontUrl) nextErrors.front = 'Please upload the front side of your document.';
    //   if (!backUrl) nextErrors.back = 'Please upload the back side of your document.';
    // }
    // if (step === 3 && !selfieUrl) nextErrors.selfie = 'Please capture a clear, centered selfie.';
    if (step === 4) {
      if (!accountHolderName.trim()) nextErrors['Account Holder Name'] = 'Account holder name is required.';
      if (accountNumber.trim().length < 6) nextErrors['Account Number'] = 'Enter a valid account number.';
      if (!ifscCode.trim()) nextErrors['IFSC Code'] = 'IFSC code is required.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (step === 5) { submit().catch(() => {}); return; }
    setStep(current => current + 1);
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { backgroundColor: colors.card }]}>
    <PostJobHeader onBack={step === 1 ? onBack : () => setStep(current => current - 1)} title="Profile Verification" />
    <View style={styles.progressInfo}><Text style={[styles.stepText, { color: colors.textMuted }]}>STEP {step} OF 5</Text><Text style={[styles.stepText, { color: colors.primary }]}>{step * 20}%</Text></View>
    <View style={[styles.progressTrack, { backgroundColor: isDark ? '#27364D' : '#E4E7EC' }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${step * 20}%` }]} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {step === 1 && <><Text style={[styles.title, { color: colors.text }]}>Select Your Skills</Text><Text style={[styles.description, { color: colors.textMuted }]}>Select multiple skills to highlight your expertise.</Text><View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: isDark ? '#334155' : '#DED6E8' }]}><Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text><TextInput value={skillSearch} onChangeText={setSkillSearch} placeholder="Search skills..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} /></View><Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Skills</Text>{visibleSkills.map(skill => { const selected = selectedSkills.includes(skill); return <Pressable key={skill} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => { toggleSkill(skill); setErrors(current => ({ ...current, skills: '' })); }} style={[styles.skillRow, { backgroundColor: colors.background, borderColor: selected ? colors.primary : isDark ? '#334155' : '#DED6E8' }]}><View style={[styles.skillIcon, { backgroundColor: isDark ? '#292042' : '#EDE1FF' }]}><Text style={[styles.skillSymbol, { color: colors.primary }]}>▣</Text></View><Text style={[styles.skillName, { color: colors.text }]}>{skill}</Text><View style={[styles.checkbox, { backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.textMuted }]}>{selected && <Text style={styles.check}>✓</Text>}</View></Pressable>; })}{isAddingSkill ? <View style={styles.addSkillRow}><TextInput autoFocus value={newSkill} onChangeText={setNewSkill} onSubmitEditing={addSkill} placeholder="Enter a skill" placeholderTextColor={colors.textMuted} style={[styles.addSkillInput, { color: colors.text, borderColor: isDark ? '#334155' : '#DED6E8' }]} /><Pressable onPress={addSkill} style={[styles.addSkillButton, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Add</Text></Pressable></View> : <Pressable onPress={() => setIsAddingSkill(true)}><Text style={[styles.moreSkills, { color: colors.primary }]}>＋ Add More Skills</Text></Pressable>}{errors.skills ? <Text style={styles.errorText}>{errors.skills}</Text> : null}</>}
      {step === 2 && <><Text style={[styles.title, { color: colors.text }]}>Verify Your Identity</Text><Text style={[styles.description, { color: colors.textMuted }]}>Upload government-issued identity proof.</Text><Text style={[styles.fieldLabel, { color: colors.text }]}>Select Document Type</Text><Pressable onPress={() => setIsDocumentTypeOpen(true)} style={[styles.documentSelect, { backgroundColor: colors.background, borderColor: isDark ? '#334155' : '#DED6E8' }]}><Text style={[styles.documentText, { color: colors.text }]}>{documentType}</Text><Text style={[styles.documentArrow, { color: colors.textMuted }]}>⌄</Text></Pressable><Pressable onPress={() => selectDocument('front')} style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: frontUrl ? colors.primary : errors.front ? '#DC2626' : isDark ? '#46536B' : '#D7CBE5' }]}><Text style={[styles.uploadIcon, { color: colors.primary }]}>{uploading === 'front' ? '…' : frontUrl ? '✓' : '↑'}</Text><Text style={[styles.uploadText, { color: colors.text }]}>{frontUrl ? 'Front Side Uploaded' : 'Upload Front Side'}</Text></Pressable>{errors.front ? <Text style={styles.errorText}>{errors.front}</Text> : null}<Pressable onPress={() => selectDocument('back')} style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: backUrl ? colors.primary : errors.back ? '#DC2626' : isDark ? '#46536B' : '#D7CBE5' }]}><Text style={[styles.uploadIcon, { color: colors.primary }]}>{uploading === 'back' ? '…' : backUrl ? '✓' : '↑'}</Text><Text style={[styles.uploadText, { color: colors.text }]}>{backUrl ? 'Back Side Uploaded' : 'Upload Back Side'}</Text></Pressable>{errors.back ? <Text style={styles.errorText}>{errors.back}</Text> : null}</>}
      {step === 3 && <><Text style={[styles.title, styles.centered, { color: colors.text }]}>Take a Selfie</Text><Text style={[styles.description, styles.centered, { color: colors.textMuted }]}>Keep your face centered inside the guide and well-lit.</Text><View style={[styles.selfiePreview, { backgroundColor: isDark ? '#202D52' : '#E5EAFF', borderColor: selfieUrl ? colors.primary : errors.selfie ? '#DC2626' : isDark ? '#46536B' : '#D3C5ED' }]}>{selfieUri ? <Image source={{ uri: selfieUri }} style={styles.selfieImage} /> : <Text style={[styles.selfieIcon, { color: colors.primary }]}>◉</Text>}<View pointerEvents="none" style={[styles.faceGuide, { borderColor: '#FFFFFF' }]} /></View><Pressable onPress={takeSelfie} disabled={uploading === 'selfie'} style={[styles.cameraButton, { backgroundColor: colors.primary }]}><Text style={styles.cameraText}>{uploading === 'selfie' ? 'Uploading...' : selfieUrl ? 'Retake Selfie' : '▣  Open Camera'}</Text></Pressable><Text style={[styles.selfieHint, { color: colors.textMuted }]}>Position your face inside the oval. Avoid sunglasses or hats.</Text>{errors.selfie ? <Text style={[styles.errorText, styles.centered]}>{errors.selfie}</Text> : null}</>}
      {step === 4 && <><Text style={[styles.title, { color: colors.text }]}>Add Bank Account</Text><Text style={[styles.description, { color: colors.textMuted }]}>Your earnings will be sent to this account.</Text>{[['Account Holder Name', accountHolderName, setAccountHolderName, 'e.g. Mehul Joshi'], ['Account Number', accountNumber, setAccountNumber, 'e.g. 1234 5678 9012'], ['IFSC Code', ifscCode, setIfscCode, 'e.g. HDFC0001234'], ['UPI ID (Optional)', upiId, setUpiId, 'e.g. mehul@upi']].map(([label, value, setter, placeholder]) => <View key={label as string}><Text style={[styles.fieldLabel, { color: colors.text }]}>{label as string}</Text><TextInput value={value as string} onChangeText={text => { (setter as (nextValue: string) => void)(text); setErrors(current => ({ ...current, [label as string]: '' })); }} autoCapitalize={(label as string).startsWith('IFSC') ? 'characters' : 'none'} keyboardType={(label as string).includes('Number') ? 'numeric' : 'default'} placeholder={placeholder as string} placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.background, borderColor: errors[label as string] ? '#DC2626' : isDark ? '#334155' : '#DED6E8', color: colors.text }]} />{errors[label as string] ? <Text style={styles.errorText}>{errors[label as string]}</Text> : null}</View>)}</>}
      {step === 5 && <><Text style={[styles.title, { color: colors.text }]}>Review & Submit</Text><Text style={[styles.description, { color: colors.textMuted }]}>Review your details before submitting.</Text><View style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: isDark ? '#334155' : '#E5DDED' }]}><Text style={[styles.reviewTitle, { color: colors.text }]}>Skills</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{selectedSkills.join(', ')}</Text></View><View style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: isDark ? '#334155' : '#E5DDED' }]}><Text style={[styles.reviewTitle, { color: colors.text }]}>Identity Proof</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{documentType} • Front and back uploaded</Text></View><View style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: isDark ? '#334155' : '#E5DDED' }]}><Text style={[styles.reviewTitle, { color: colors.text }]}>Bank Account</Text><Text style={[styles.reviewValue, { color: colors.textMuted }]}>{accountHolderName} • {accountNumber.slice(-4).padStart(accountNumber.length, '•')}</Text></View></>}
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#27364D' : '#E5E7EB' }]}>{step > 1 && <Pressable onPress={() => setStep(current => current - 1)} style={[styles.backButton, { borderColor: isDark ? '#46536B' : '#AFA6B8' }]}><Text style={[styles.backText, { color: colors.textMuted }]}>‹ Back</Text></Pressable>}<Pressable disabled={isSubmitting || uploading !== null} onPress={continueStep} style={[styles.continueButton, { backgroundColor: colors.primary, opacity: isSubmitting || uploading ? 0.65 : 1 }]}><Text style={styles.buttonText}>{step === 5 ? (isSubmitting ? 'Submitting...' : 'Submit Verification') : 'Continue ›'}</Text></Pressable></View>
    <Modal transparent visible={isDocumentTypeOpen} onRequestClose={() => setIsDocumentTypeOpen(false)}><Pressable onPress={() => setIsDocumentTypeOpen(false)} style={styles.modalOverlay}><View style={[styles.modalCard, { backgroundColor: colors.card }]}>{documentTypes.map(type => <Pressable key={type} onPress={() => { setDocumentType(type); setIsDocumentTypeOpen(false); }} style={styles.modalOption}><Text style={[styles.documentText, { color: colors.text }]}>{type}</Text>{type === documentType && <Text style={{ color: colors.primary }}>✓</Text>}</Pressable>)}</View></Pressable></Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  addSkillButton: { alignItems: 'center', borderRadius: 7, justifyContent: 'center', marginLeft: 8, paddingHorizontal: 15 }, addSkillInput: { borderRadius: 7, borderWidth: 1, flex: 1, fontSize: rf(11), height: 42, paddingHorizontal: 10 }, addSkillRow: { flexDirection: 'row', marginTop: 12 }, backButton: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 42, justifyContent: 'center', marginRight: 10, width: 105 }, backText: { fontSize: rf(11), fontWeight: '800' }, buttonText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' }, cameraButton: { alignItems: 'center', alignSelf: 'center', borderRadius: 18, marginTop: 18, paddingHorizontal: 20, paddingVertical: 10 }, cameraText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' }, centered: { textAlign: 'center' }, check: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '900' }, checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 18, justifyContent: 'center', width: 18 }, continueButton: { alignItems: 'center', borderRadius: 6, flex: 1, height: 42, justifyContent: 'center' }, content: { flexGrow: 1, paddingBottom: 18, paddingHorizontal: 14, paddingTop: 16 }, description: { fontSize: rf(11), lineHeight: rf(15), marginTop: 6 }, documentArrow: { fontSize: rf(16) }, documentSelect: { alignItems: 'center', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 42, justifyContent: 'space-between', paddingHorizontal: 11 }, documentText: { fontSize: rf(11) }, errorText: { color: '#DC2626', fontSize: rf(10), lineHeight: rf(14), marginTop: 5 }, faceGuide: { borderRadius: 62, borderWidth: 2, height: 124, position: 'absolute', width: 94 }, fieldLabel: { fontSize: rf(10), fontWeight: '700', marginBottom: 7, marginTop: 18 }, footer: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', padding: 12 }, input: { borderRadius: 6, borderWidth: 1, fontSize: rf(11), height: 42, paddingHorizontal: 11 }, modalCard: { borderRadius: 14, width: '80%' }, modalOption: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 17 }, modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'center' }, moreSkills: { fontSize: rf(11), fontWeight: '800', marginTop: 14 }, progressFill: { borderRadius: 3, height: 4 }, progressInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10 }, progressTrack: { borderRadius: 3, height: 4, marginHorizontal: 14, marginTop: 6 }, reviewCard: { borderRadius: 7, borderWidth: 1, marginTop: 11, padding: 12 }, reviewTitle: { fontSize: rf(11), fontWeight: '800' }, reviewValue: { fontSize: rf(10), marginTop: 4 }, searchBox: { alignItems: 'center', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 40, marginTop: 17, paddingHorizontal: 10 }, searchIcon: { fontSize: rf(16), marginRight: 7 }, searchInput: { flex: 1, fontSize: rf(11), paddingVertical: 0 }, sectionTitle: { fontSize: rf(13), fontWeight: '800', marginTop: 19 }, selfieHint: { fontSize: rf(10), lineHeight: rf(14), marginTop: 15, textAlign: 'center' }, selfieIcon: { fontSize: rf(62) }, selfieImage: { borderRadius: 84, height: 168, width: 168 }, selfiePreview: { alignItems: 'center', alignSelf: 'center', borderRadius: 85, borderWidth: 1, height: 170, justifyContent: 'center', marginTop: 30, overflow: 'hidden', width: 170 }, skillIcon: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', marginRight: 10, width: 28 }, skillName: { flex: 1, fontSize: rf(11), fontWeight: '600' }, skillRow: { alignItems: 'center', borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 48, marginTop: 7, paddingHorizontal: 10 }, skillSymbol: { fontSize: rf(14), fontWeight: '800' }, stepText: { fontSize: rf(9), fontWeight: '800' }, title: { fontSize: rf(20), fontWeight: '800' }, uploadBox: { alignItems: 'center', borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, height: 100, justifyContent: 'center', marginTop: 10 }, uploadIcon: { fontSize: rf(20), fontWeight: '800' }, uploadText: { fontSize: rf(11), fontWeight: '700', marginTop: 7 }, screen: { flex: 1 },
});

export default VerificationScreen;
