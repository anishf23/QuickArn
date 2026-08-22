import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type BrowseJobsScreenProps = {
  onBack: () => void;
};

const filters = ['All', 'Nearby', 'Delivery', 'Driver', 'Plumber'];

const jobs = [
  { icon: '▣', title: 'Need Delivery Boy', location: 'Paldi, Ahmedabad', price: '₹200', distance: '1.5 km', time: '2 min ago' },
  { icon: '▤', title: 'Driver for 4 Hours', location: 'Vastrapur, Ahmedabad', price: '₹600', distance: '3 km', time: '15 min ago' },
  { icon: '⚒', title: 'Need Plumber', location: 'Gota, Ahmedabad', price: '₹500', distance: '4 km', time: '30 min ago' },
];

function BrowseJobsScreen({ onBack }: BrowseJobsScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Browse Jobs" />

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
          <TextInput
            placeholder="Search jobs, skills or category"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter, index) => (
            <Pressable key={filter} accessibilityRole="button" style={[styles.filter, index === 0 ? styles.filterActive : styles.filterInactive]}>
              <Text style={[styles.filterText, index === 0 ? styles.filterTextActive : { color: colors.textMuted }]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.jobsList}>
          {jobs.map(job => (
            <Pressable key={job.title} accessibilityRole="button" style={[styles.jobCard, { backgroundColor: colors.card }]}>
              <View style={styles.jobIconWrap}><Text style={[styles.jobIcon, { color: colors.textMuted }]}>{job.icon}</Text></View>
              <View style={styles.jobDetails}>
                <View style={styles.jobTitleRow}>
                  <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                  <Text style={[styles.time, { color: colors.textMuted }]}>{job.time}</Text>
                </View>
                <Text style={[styles.location, { color: colors.textMuted }]}>{job.location}</Text>
                <View style={styles.jobMeta}>
                  <Text style={[styles.price, { color: colors.primary }]}>{job.price}</Text>
                  <Text style={[styles.distance, { color: colors.textMuted }]}>• {job.distance}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 13, paddingTop: 2 },
  distance: { fontSize: rf(10), marginLeft: 5 },
  filter: { alignItems: 'center', borderRadius: 13, height: hp(3), justifyContent: 'center', marginRight: 7, paddingHorizontal: 12 },
  filterActive: { backgroundColor: brandColors.blue },
  filterInactive: { backgroundColor: '#E5E7EB' },
  filterRow: { flexDirection: 'row', marginTop: 14, overflow: 'hidden' },
  filterText: { fontSize: rf(12), fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  jobCard: { alignItems: 'center', borderRadius: 7, elevation: 2, flexDirection: 'row', marginBottom: 11, minHeight: 71, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3 },
  jobDetails: { flex: 1, marginLeft: 10 },
  jobIcon: { fontSize: rf(17), fontWeight: '800' },
  jobIconWrap: { alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  jobMeta: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  jobTitle: { flex: 1, fontSize: rf(13), fontWeight: '800' },
  jobTitleRow: { alignItems: 'center', flexDirection: 'row' },
  jobsList: { marginTop: 21 },
  location: { fontSize: rf(9), marginTop: 2 },
  price: { fontSize: rf(13), fontWeight: '800' },
  screen: { flex: 1 },
  searchBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DED6E8', 
    borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: hp(6), paddingHorizontal: 8 },
  searchIcon: { fontSize: rf(26), marginRight: 5 },
  searchInput: { flex: 1, fontSize: rf(14), paddingVertical: 0 },
  time: { fontSize: rf(8), marginLeft: 8 },
});

export default BrowseJobsScreen;
