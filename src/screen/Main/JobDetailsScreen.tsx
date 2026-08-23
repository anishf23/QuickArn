import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import type { PostedJob } from '../../services/jobs';
import { rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type JobDetailsScreenProps = {
  job?: PostedJob | null;
  onBack: () => void;
  onCloseJob?: () => void;
  onEditJob?: () => void;
  onPlaceBid: () => void;
};

const formatJobDateTime = (date: Date) => date.toLocaleString('en-IN', {
  day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short', year: 'numeric',
});

function JobDetailsScreen({ job, onBack, onCloseJob, onEditJob, onPlaceBid }: JobDetailsScreenProps) {
  const { colors } = useAppTheme();
  const title = job?.title ?? 'Need Delivery Boy for Documents';
  const description = job?.description ?? 'Need a reliable person to quickly pick up sensitive documents from branch in Paldi and deliver them securely to a client office in the Satellite area.\nMust have own vehicle.';
  const budget = job ? `₹${job.budget}${job.budgetType === 'hourly' ? ' / hour' : ''}` : '₹200';
  const pickupAddress = job ? [job.pickupDetails.address, job.pickupDetails.nearbyLocation].filter(Boolean).join(', ') : 'Paldi, Ahmedabad';
  const postedBy = job?.pickupDetails.name || 'Ravi Patel';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Job Details" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={[styles.jobSummary, { backgroundColor: colors.card }]}>
          <View style={styles.jobTitleRow}>
            <Text style={[styles.jobTitle, { color: colors.text }]}>{title}</Text>
            <View style={styles.openBadge}><Text style={styles.openText}>{job?.status ?? 'Open'}</Text></View>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>{budget}</Text>
          <Text style={[styles.location, { color: colors.textMuted }]}>⌖  {pickupAddress}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Job Description</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}> 
          <View style={styles.infoIcon}><Text style={[styles.calendarIcon, { color: colors.primary }]}>▣</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Date &amp; Time</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{job ? formatJobDateTime(job.jobDateTime) : '25 May 2024 • 04:00 PM'}</Text>
          </View>
        </View>

        {job && (
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Pickup &amp; Drop Details</Text>
            <Text style={[styles.locationDetailTitle, { color: colors.textMuted }]}>Pickup</Text>
            <Text style={[styles.locationDetail, { color: colors.text }]}>{job.pickupDetails.name} • +91 {job.pickupDetails.phoneNumber}{`\n`}{job.pickupDetails.floorDetails}, {pickupAddress}</Text>
            <Text style={[styles.locationDetailTitle, { color: colors.textMuted }]}>Drop</Text>
            <Text style={[styles.locationDetail, { color: colors.text }]}>{job.dropDetails.name} • +91 {job.dropDetails.phoneNumber}{`\n`}{job.dropDetails.floorDetails}, {[job.dropDetails.address, job.dropDetails.nearbyLocation].filter(Boolean).join(', ')}</Text>
          </View>
        )}

        {job && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}> 
            <View style={styles.infoIcon}><Text style={[styles.calendarIcon, { color: colors.primary }]}>!</Text></View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Job Priority</Text>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>{job.priority}</Text>
            </View>
          </View>
        )}

         <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoIcon}><Text style={[styles.calendarIcon, { color: colors.primary }]}>▣</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Job close Date &amp; Time</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{job ? formatJobDateTime(job.closeDateTime) : '25 May 2024 • 04:00 PM'}</Text>
          </View>
        </View>


        <View style={[styles.card, styles.skillsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Skills Required</Text>
          <View style={styles.skillsRow}>
            <View style={styles.skillBadge}><Text style={styles.skillText}>{job?.category ?? 'Delivery'}</Text></View>
            {!job && <View style={styles.skillBadge}><Text style={styles.skillText}>Driving</Text></View>}
          </View>
        </View>

        <View style={[styles.infoCard, styles.posterCard, { backgroundColor: colors.card }]}>
          <View style={styles.posterAvatar}><Text style={styles.posterInitials}>RP</Text></View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Posted by</Text>
            <Text style={[styles.posterName, { color: colors.text }]}>{postedBy}</Text>
            <Text style={[styles.rating, { color: colors.textMuted }]}>★  4.7 (24 Reviews)</Text>
          </View>
        </View>
      </ScrollView>

      {job ? (
        <View style={[styles.footer, styles.ownerFooter, { backgroundColor: colors.card }]}>
          <Pressable accessibilityRole="button" onPress={onEditJob} style={[styles.ownerButton, styles.editButton, { borderColor: colors.primary }]}>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCloseJob} style={[styles.ownerButton, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.ownerButtonText}>Close Job</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Pressable accessibilityRole="button" onPress={onPlaceBid} style={[styles.bidButton, { backgroundColor: colors.primary }]}><Text style={styles.bidText}>Place Bid</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bidButton: { alignItems: 'center', borderRadius: 7, elevation: 4, height: 45, justifyContent: 'center', shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  bidText: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '800' },
  calendarIcon: { fontSize: rf(20), fontWeight: '800' },
  card: { borderRadius: 12, elevation: 2, marginTop: 12, padding: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  cardTitle: { fontSize: rf(11), fontWeight: '800' },
  content: { paddingBottom: 16, paddingHorizontal: 8, paddingTop: 7 },
  dateText: { fontSize: rf(10), marginTop: 3 },
  description: { fontSize: rf(12), lineHeight: rf(19), marginTop: 10 },
  footer: { paddingHorizontal: 5, paddingVertical: 7 },
  editButton: { backgroundColor: 'transparent', borderWidth: 1.2 },
  editButtonText: { fontSize: rf(13), fontWeight: '800' },
  infoCard: { alignItems: 'center', borderRadius: 12, elevation: 2, flexDirection: 'row', marginTop: 12, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  infoIcon: { alignItems: 'center', backgroundColor: '#F0E5FF', borderRadius: 17, height: 34, justifyContent: 'center', marginRight: 12, width: 34 },
  jobSummary: { borderRadius: 12, elevation: 2, padding: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5 },
  jobTitle: { fontSize: rf(18), fontWeight: '800', lineHeight: rf(22) },
  jobTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  location: { fontSize: rf(10), marginTop: 13 },
  locationDetail: { fontSize: rf(11), lineHeight: rf(16), marginTop: 4 },
  locationDetailTitle: { fontSize: rf(10), fontWeight: '800', marginTop: 12 },
  openBadge: { alignItems: 'center', backgroundColor: '#1CE7B5', borderRadius: 12, height: 24, justifyContent: 'center', marginLeft: 7, marginTop: 1, paddingHorizontal: 11 },
  openText: { color: '#08795E', fontSize: rf(10), fontWeight: '800' },
  ownerButton: { alignItems: 'center', borderRadius: 7, flex: 1, height: 45, justifyContent: 'center' },
  ownerButtonText: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '800' },
  ownerFooter: { flexDirection: 'row', gap: 10 },
  posterAvatar: { alignItems: 'center', backgroundColor: '#D7E4F4', borderRadius: 20, height: 40, justifyContent: 'center', marginRight: 12, width: 40 },
  posterCard: { marginTop: 12 },
  posterInitials: { color: '#354155', fontSize: rf(12), fontWeight: '800' },
  posterName: { fontSize: rf(12), fontWeight: '800', marginTop: 5 },
  price: { fontSize: rf(21), fontWeight: '800', marginTop: 13 },
  rating: { color: '#F4A400', fontSize: rf(9), marginTop: 3 },
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  skillBadge: { backgroundColor: '#E5E7EB', borderRadius: 5, marginRight: 8, paddingHorizontal: 11, paddingVertical: 6 },
  skillText: { color: '#697386', fontSize: rf(10), fontWeight: '700' },
  skillsCard: { paddingBottom: 13 },
  skillsRow: { flexDirection: 'row', marginTop: 11 },
});

export default JobDetailsScreen;
