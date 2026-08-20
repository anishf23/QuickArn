import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';

const profileItems = [
  { icon: '▣', label: 'My Portfolio' },
  { icon: '₹', label: 'My Earnings' },
  { icon: '◇', label: 'My Bids' },
  { icon: '▤', label: 'Wallet' },
  { icon: '⚙', label: 'Settings' },
  { icon: '?', label: 'Help & Support' },
  { icon: '?', label: 'Privacy Policy' },
  { icon: '?', label: 'Terms & Conditions' },
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

const mySkills = ['Delivery', 'Driving', 'Cooking', 'Cleaning', 'Plumbing', 'Electrical'];

type ProfileScreenProps = {
  onEditProfile: () => void;
  onMyBids: () => void;
  onMyPortfolio: () => void;
  onWallet: () => void;
};

function ProfileScreen({ onEditProfile, onMyBids, onMyPortfolio, onWallet }: ProfileScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={[styles.screen, { backgroundColor: colors.card }]}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>MJ</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.name, { color: colors.text }]}>Mehul Joshi</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>4.5 (11 Reviews)</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onEditProfile} style={[styles.editButton, { borderColor: colors.primary }]}>
            <Text style={[styles.editText, { color: colors.primary }]}>Edit Profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.verificationSection}>
        <Text style={[styles.verificationHeading, { color: colors.textMuted }]}>VERIFICATION</Text>
        {verificationItems.map(item => (
          <Pressable key={item.label} accessibilityRole="button" style={styles.verificationCard}>
            <View style={styles.verificationIcon}>
              <Text style={[styles.verificationSymbol, { color: colors.primary }]}>{item.icon}</Text>
            </View>
            <View style={styles.verificationCopy}>
              <Text style={[styles.verificationLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.verificationDetail, { color: colors.textMuted }]}>{item.detail}</Text>
            </View>
            <Text style={[styles.verifyText, { color: colors.primary }]}>Verify</Text>
            <Text style={[styles.verificationArrow, { color: colors.primary }]}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.skillsSection}>
        <Text style={[styles.skillsHeading, { color: colors.text }]}>My Skills</Text>
        <View style={styles.skillList}>
          {mySkills.map(skill => (
            <View key={skill} style={[styles.skillChip, { backgroundColor: '#F0E8FF' }]}>
              <Text style={[styles.skillChipText, { color: colors.primary }]}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.menu}>
        {profileItems.map(item => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={item.label === 'My Bids' ? onMyBids : item.label === 'My Earnings' ? onMyPortfolio : item.label === 'Wallet' ? onWallet : undefined}
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
  arrow: { fontSize: 24, fontWeight: '300', lineHeight: 23 },
  avatar: { alignItems: 'center', backgroundColor: '#E5E0FF', borderRadius: 41, height: 82, justifyContent: 'center', width: 82 },
  avatarInitials: { color: '#665C78', fontSize: 15, fontWeight: '700' },
  editButton: { alignItems: 'center', borderRadius: 20, borderWidth: 1.5, marginTop: 10, paddingHorizontal: 18, paddingVertical: 8 },
  editText: { fontSize: 11, fontWeight: '700' },
  menu: { paddingHorizontal: 18, paddingTop: 19 },
  menuIcon: { fontSize: 16, fontWeight: '700', textAlign: 'center', width: 26 },
  menuItem: { alignItems: 'center', borderBottomColor: '#E9E2EE', borderBottomWidth: 1, flexDirection: 'row', height: 48, paddingHorizontal: 6 },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 10 },
  name: { fontSize: 16, fontWeight: '800' },
  profileDetails: { alignItems: 'center', marginTop: 12 },
  profileHeader: { alignItems: 'center', paddingBottom: 20, paddingTop: 27 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  ratingText: { fontSize: 10, marginLeft: 4 },
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  skillChip: { alignItems: 'center', borderRadius: 16, flexBasis: '31%', height: 30, justifyContent: 'center', marginBottom: 8 },
  skillChipText: { fontSize: 10, fontWeight: '700' },
  skillList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  skillsHeading: { fontSize: 13, fontWeight: '800' },
  skillsSection: { paddingHorizontal: 18, paddingTop: 20 },
  star: { color: '#7D00F5', fontSize: 11 },
  verificationArrow: { fontSize: 20, lineHeight: 18, marginLeft: 5 },
  verificationCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E4D9EB', borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginTop: 7, minHeight: 68, paddingHorizontal: 13 },
  verificationCopy: { flex: 1, marginLeft: 9 },
  verificationDetail: { fontSize: 9, lineHeight: 12, marginTop: 2 },
  verificationHeading: { fontSize: 10, fontWeight: '800', marginLeft: 6 },
  verificationIcon: { alignItems: 'center', backgroundColor: '#EEE8FF', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  verificationLabel: { fontSize: 11, fontWeight: '700' },
  verificationSection: { paddingHorizontal: 18, paddingTop: 4 },
  verificationSymbol: { fontSize: 14, fontWeight: '800' },
  verifyText: { fontSize: 9, fontWeight: '800' },
});

export default ProfileScreen;
