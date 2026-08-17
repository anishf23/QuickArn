import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { rf } from '../../utils/responsive';

const profileItems = [
  { icon: '✥', label: 'My Skills' },
  { icon: '▣', label: 'My Portfolio' },
  { icon: '₹', label: 'Earnings' },
  { icon: '◇', label: 'My Bids' },
  { icon: '▤', label: 'Wallet' },
  { icon: '⚙', label: 'Settings' },
  { icon: '?', label: 'Help & Support' },
];

type ProfileScreenProps = {
  onMyBids: () => void;
};

function ProfileScreen({ onMyBids }: ProfileScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
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
          <Pressable accessibilityRole="button" style={styles.editButton}>
            <Text style={[styles.editText, { color: colors.primary }]}>Edit Profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.menu}>
        {profileItems.map(item => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={item.label === 'My Bids' ? onMyBids : undefined}
            style={styles.menuItem}
          >
            <Text style={[styles.menuIcon, { color: colors.textMuted }]}>{item.icon}</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: { fontSize: rf(24), fontWeight: '300', lineHeight: rf(23) },
  avatar: { alignItems: 'center', backgroundColor: '#D9E0EA', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarInitials: { color: '#4B5563', fontSize: rf(16), fontWeight: '800' },
  editButton: { alignItems: 'center', alignSelf: 'flex-start', borderColor: '#E3D6ED', borderRadius: 5, borderWidth: 1, marginTop: 8, paddingHorizontal: 11, paddingVertical: 5 },
  editText: { fontSize: rf(11), fontWeight: '700' },
  menu: { paddingTop: 1 },
  menuIcon: { fontSize: rf(17), fontWeight: '700', textAlign: 'center', width: 30 },
  menuItem: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 41, paddingHorizontal: 11 },
  menuLabel: { flex: 1, fontSize: rf(12), fontWeight: '500', marginLeft: 8 },
  name: { fontSize: rf(18), fontWeight: '800' },
  profileDetails: { flex: 1, marginLeft: 11 },
  profileHeader: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingBottom: 19, paddingHorizontal: 12, paddingTop: 13 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  ratingText: { fontSize: rf(10), marginLeft: 4 },
  screen: { flex: 1 },
  star: { color: '#7D00F5', fontSize: rf(11) },
});

export default ProfileScreen;
