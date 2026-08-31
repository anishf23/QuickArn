import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCustomAlert } from '../../components/CustomAlert';
import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { getCachedUserProfile, type StoredUserProfile } from '../../services/firebaseUser';
import { RFValue } from 'react-native-responsive-fontsize';
import { hp } from '../../utils/responsive';

const profileItems = [
  // { icon: '▣', label: 'My Portfolio' },
  { icon: '₹', label: 'My Earnings' },
  { icon: '◇', label: 'My Bids' },
  { icon: '◇', label: 'My Jobs' },
  { icon: '▤', label: 'Wallet' },
  { icon: '◉', label: 'Language' },
  { icon: '⚙', label: 'Settings' },
  { icon: '?', label: 'Help & Support' },
  { icon: '?', label: 'Privacy Policy' },
  { icon: '?', label: 'Terms & Conditions' },
  { icon: '⎋', label: 'Log Out' },
];

const verificationItems = [
  {
    icon: '▤',
    label: 'Verify Aadhaar',
    detail: 'Verify your identity securely with Aadhaar',
  },
  {
    icon: '▭',
    label: 'Take a Selfie',
    detail: 'Required to confirm your identity',
  },
  {
    icon: '〽',
    label: 'Add Bank Account',
    detail: 'Add your bank details for secure payments',
  },
];

type ProfileScreenProps = {
  onEditProfile: () => void;
  onLanguage: () => void;
  onMyBids: () => void;
  onMyJobs: () => void;
  onMyPortfolio: () => void;
  onWallet: () => void;
  onVerification: () => void;
  onLogout: () => void;
};

function ProfileScreen({ onEditProfile, onLanguage, onMyBids, onMyJobs, onMyPortfolio, onWallet, onVerification, onLogout }: ProfileScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [profile, setProfile] = useState<StoredUserProfile | null>(null);

  useEffect(() => {
    getCachedUserProfile().then(setProfile).catch(() => {});
  }, []);

  const fullName = profile?.fullName?.trim() || 'Your Profile';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(name => name[0])
    .join('')
    .toUpperCase();
  const skills = profile?.skills ?? [];
  const isCustomer = profile?.role === 'customer';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={[styles.screen, { backgroundColor: colors.card }]}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>4.5 (11 Reviews)</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onEditProfile} style={[styles.editButton, { borderColor: colors.primary }]}>
            <Text style={[styles.editText, { color: colors.primary }]}>Edit Profile</Text>
          </Pressable>
          {profile?.verificationStatus === 'pending' ? <Text style={styles.pendingMessage}>Verification pending — documents are under review.</Text> : null}
          {profile?.verificationStatus === 'failed' ? <Text style={styles.failedMessage}>Verification failed — please submit your documents again.</Text> : null}
        </View>
      </View>

      {!isCustomer && (
        <View style={styles.verificationSection}>
          <Text style={[styles.verificationHeading, { color: colors.textMuted }]}>VERIFICATION</Text>
          {verificationItems.map(item => (
            <Pressable key={item.label} accessibilityRole="button" disabled={profile?.verificationStatus === 'pending'} onPress={onVerification} style={[styles.verificationCard, profile?.verificationStatus === 'pending' && styles.lockedVerificationCard]}>
              <View style={styles.verificationIcon}>
                <Text style={[styles.verificationSymbol, { color: colors.primary }]}>{item.icon}</Text>
              </View>
              <View style={styles.verificationCopy}>
                <Text style={[styles.verificationLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.verificationDetail, { color: colors.textMuted }]}>{item.detail}</Text>
              </View>
              <Text style={[styles.verifyText, { color: colors.primary }]}>{profile?.verificationStatus === 'pending' ? 'Pending' : profile?.verificationStatus === 'failed' ? 'Resubmit' : 'Verify'}</Text>
              <Text style={[styles.verificationArrow, { color: colors.primary }]}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!isCustomer && (
          <Pressable disabled={profile?.verificationStatus === 'pending'} onPress={onVerification} style={[styles.skillsSection, profile?.verificationStatus === 'pending' && styles.lockedVerificationCard]}>
          <Text style={[styles.skillsHeading, { color: colors.text }]}>My Skills</Text>
          <View style={styles.skillList}>
            {skills.map(skill => (
              <View key={skill} style={[styles.skillChip, { backgroundColor: '#F0E8FF' }]}>
                <Text style={[styles.skillChipText, { color: colors.primary }]}>{skill}</Text>
              </View>
            ))}
            {skills.length === 0 ? <Text style={[styles.emptySkillsText, { color: colors.textMuted }]}>No skills added yet.</Text> : null}
          </View>
        </Pressable>
      )}

      <View style={styles.menu}>
        {profileItems.filter(item => !isCustomer || (item.label !== 'My Earnings' && item.label !== 'My Bids')).map(item => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={
              item.label === 'My Bids'
                ? onMyBids
                : item.label === 'My Jobs'
                ? onMyJobs
                : item.label === 'My Earnings'
                ? onMyPortfolio
                : item.label === 'Wallet'
                ? onWallet
                : item.label === 'Language'
                ? onLanguage
                : item.label === 'Log Out'
                ? () => {
                    showAlert(
                      'Log Out',
                      'Are you sure you want to log out?',
                      [
                        { style: 'cancel', text: 'Cancel' },
                        { onPress: onLogout, style: 'destructive', text: 'Log Out' },
                      ],
                    );
                  }
                : undefined
            }
            style={styles.menuItem}
          >
            <Text style={[styles.menuIcon, { color: colors.textMuted }]}>{item.icon}</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  arrow: { fontSize: RFValue(26), fontWeight: '300', lineHeight: 23 },
  avatar: { alignItems: 'center', backgroundColor: '#E5E0FF', borderRadius: 41, height: 82, justifyContent: 'center', width: 82 },
  avatarInitials: { color: '#665C78', fontSize: 15, fontWeight: '700' },
  editButton: { alignItems: 'center', borderRadius: 20, borderWidth: 1.5, marginTop: 10, paddingHorizontal: 18, paddingVertical: 8 },
  editText: { fontSize: RFValue(12), fontWeight: '700' },
  emptySkillsText: { fontSize: RFValue(10), marginTop: 2 },
  menu: { paddingHorizontal: 18, paddingTop: 19 },
  menuIcon: { fontSize: 16, fontWeight: '700', textAlign: 'center', width: RFValue(24) },
  menuItem: { alignItems: 'center', borderBottomColor: '#E9E2EE', borderBottomWidth: 1, flexDirection: 'row', height: 48, paddingHorizontal: 6 },
  menuLabel: { flex: 1, fontSize: RFValue(14), fontWeight: '600', marginLeft: 10 },
  name: { fontSize: RFValue(14), fontWeight: '800' },
  failedMessage: { color: '#DC2626', fontSize: RFValue(10), marginTop: 9, textAlign: 'center' },
  pendingMessage: { color: '#D97706', fontSize: RFValue(10), marginTop: 9, textAlign: 'center' },
  profileDetails: { alignItems: 'center', marginTop: 12 },
  profileHeader: { alignItems: 'center', paddingBottom: 20, paddingTop: 27 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  ratingText: { fontSize: RFValue(11), marginLeft: 4 },
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  skillChip: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: '31.5%' },
  skillChipText: { fontSize: 10, fontWeight: '700' },
  skillList: { columnGap: '2.75%', flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 8 },
  skillsHeading: { fontSize: RFValue(14), fontWeight: '800' },
  skillsSection: { paddingHorizontal: 18, paddingTop: 20 },
  star: { color: '#7D00F5', fontSize: RFValue(11) },
  verificationArrow: { fontSize: RFValue(18), lineHeight: 18, marginLeft: 5 },
  verificationCard: { alignItems: 'center', backgroundColor: '#FFFFFF', 
    borderColor: '#E4D9EB', borderRadius: 10, borderWidth: 1,
     flexDirection: 'row', marginTop: 7, minHeight: hp(7), paddingHorizontal: 13 },
  lockedVerificationCard: { opacity: 0.65 },
  verificationCopy: { flex: 1, marginLeft: 9 },
  verificationDetail: { fontSize: RFValue(10), lineHeight: 12, marginTop: 2 },
  verificationHeading: { fontSize: RFValue(14), fontWeight: '800', marginLeft: 6 },
  verificationIcon: { alignItems: 'center', backgroundColor: '#EEE8FF', borderRadius: 18, 
    height: hp(3.5), justifyContent: 'center', width: hp(3.5) },
  verificationLabel: { fontSize: RFValue(14), fontWeight: '700' },
  verificationSection: { paddingHorizontal: 18, paddingTop: 4 },
  verificationSymbol: { fontSize: 14, fontWeight: '800' },
  verifyText: { fontSize: RFValue(8), fontWeight: '800' },
});

export default ProfileScreen;
