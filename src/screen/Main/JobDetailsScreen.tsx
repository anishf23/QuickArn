import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type JobDetailsScreenProps = {
  onBack: () => void;
  onPlaceBid: () => void;
};

function JobDetailsScreen({ onBack, onPlaceBid }: JobDetailsScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Job Details" />

      <View style={styles.content}>
        <View style={[styles.jobSummary, { backgroundColor: colors.card }]}>
          <View style={styles.jobTitleRow}>
            <Text style={[styles.jobTitle, { color: colors.text }]}>Need Delivery Boy for{`\n`}Documents</Text>
            <View style={styles.openBadge}><Text style={styles.openText}>Open</Text></View>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>₹200</Text>
          <Text style={[styles.location, { color: colors.textMuted }]}>⌖  Paldi, Ahmedabad • 1.5 km</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Job Description</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>Need a reliable person to quickly pick up sensitive documents from branch in Paldi and deliver them securely to a client office in the Satellite area.{`\n`}Must have own vehicle.</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoIcon}><Text style={[styles.calendarIcon, { color: colors.primary }]}>▣</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Date &amp; Time</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>25 May 2024 • 04:00 PM</Text>
          </View>
        </View>

         <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoIcon}><Text style={[styles.calendarIcon, { color: colors.primary }]}>▣</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Job close Date &amp; Time</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>25 May 2024 • 04:00 PM</Text>
          </View>
        </View>


        <View style={[styles.card, styles.skillsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Skills Required</Text>
          <View style={styles.skillsRow}>
            <View style={styles.skillBadge}><Text style={styles.skillText}>Delivery</Text></View>
            <View style={styles.skillBadge}><Text style={styles.skillText}>Driving</Text></View>
          </View>
        </View>

        <View style={[styles.infoCard, styles.posterCard, { backgroundColor: colors.card }]}>
          <View style={styles.posterAvatar}><Text style={styles.posterInitials}>RP</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Posted by</Text>
            <Text style={[styles.posterName, { color: colors.text }]}>Ravi Patel</Text>
            <Text style={[styles.rating, { color: colors.textMuted }]}>★  4.7 (24 Reviews)</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Pressable accessibilityRole="button" onPress={onPlaceBid} style={[styles.bidButton, { backgroundColor: colors.primary }]}><Text style={styles.bidText}>Place Bid</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bidButton: { alignItems: 'center', borderRadius: 7, elevation: 4, height: 45, justifyContent: 'center', shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  bidText: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '800' },
  calendarIcon: { fontSize: rf(20), fontWeight: '800' },
  card: { borderRadius: 12, elevation: 2, marginTop: 12, padding: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  cardTitle: { fontSize: rf(11), fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 8, paddingTop: 7 },
  dateText: { fontSize: rf(10), marginTop: 3 },
  description: { fontSize: rf(12), lineHeight: rf(19), marginTop: 10 },
  footer: { paddingHorizontal: 5, paddingVertical: 7 },
  infoCard: { alignItems: 'center', borderRadius: 12, elevation: 2, flexDirection: 'row', marginTop: 12, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  infoIcon: { alignItems: 'center', backgroundColor: '#F0E5FF', borderRadius: 17, height: 34, justifyContent: 'center', marginRight: 12, width: 34 },
  jobSummary: { borderRadius: 12, elevation: 2, padding: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  jobTitle: { fontSize: rf(18), fontWeight: '800', lineHeight: rf(22) },
  jobTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  location: { fontSize: rf(10), marginTop: 13 },
  openBadge: { alignItems: 'center', backgroundColor: '#1CE7B5', borderRadius: 12, height: 24, justifyContent: 'center', marginLeft: 7, marginTop: 1, paddingHorizontal: 11 },
  openText: { color: '#08795E', fontSize: rf(10), fontWeight: '800' },
  posterAvatar: { alignItems: 'center', backgroundColor: '#D7E4F4', borderRadius: 20, height: 40, justifyContent: 'center', marginRight: 12, width: 40 },
  posterCard: { marginTop: 12 },
  posterInitials: { color: '#354155', fontSize: rf(12), fontWeight: '800' },
  posterName: { fontSize: rf(12), fontWeight: '800', marginTop: 5 },
  price: { fontSize: rf(21), fontWeight: '800', marginTop: 13 },
  rating: { color: '#F4A400', fontSize: rf(9), marginTop: 3 },
  screen: { flex: 1 },
  skillBadge: { backgroundColor: '#E5E7EB', borderRadius: 5, marginRight: 8, paddingHorizontal: 11, paddingVertical: 6 },
  skillText: { color: '#697386', fontSize: rf(10), fontWeight: '700' },
  skillsCard: { paddingBottom: 13 },
  skillsRow: { flexDirection: 'row', marginTop: 11 },
});

export default JobDetailsScreen;
