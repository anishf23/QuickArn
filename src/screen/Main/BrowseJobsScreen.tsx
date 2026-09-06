import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getDocs, getFirestore } from '@react-native-firebase/firestore';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import Shimmer from '../../components/Shimmer';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { getCachedNearbyJobs, getNearbyJobs, type NearbyJob } from '../../services/jobs';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type BrowseJobsScreenProps = {
  latitude: number | null;
  longitude: number | null;
  onBack: () => void;
  onJobPress: (job: NearbyJob) => void;
};

type CategoryFilter = {
  id: string;
  name: string;
};

const formatDistance = (distanceKm: number) => distanceKm < 1
  ? `${Math.max(1, Math.round(distanceKm * 1000))} m`
  : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;

function BrowseJobsScreen({ latitude, longitude, onBack, onJobPress }: BrowseJobsScreenProps) {
  const { colors, isDark } = useAppTheme();
  const cachedJobs = getCachedNearbyJobs(latitude, longitude, 50);
  const [jobs, setJobs] = useState<NearbyJob[]>(() => cachedJobs ?? []);
  const [isLoading, setIsLoading] = useState(() => !cachedJobs);
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(20);
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const currentUserId = getAuth().currentUser?.uid;

  useEffect(() => {
    let isMounted = true;

    getDocs(collection(getFirestore(), 'categories'))
      .then(snapshot => {
        if (!isMounted) return;
        setCategories(snapshot.docs.map(document => {
          const data = document.data() as { name?: unknown; title?: unknown };
          return {
            id: document.id,
            name: typeof data.name === 'string' ? data.name : typeof data.title === 'string' ? data.title : document.id,
          };
        }));
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setJobs([]);
      setMessage('Choose your location to browse nearby jobs.');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    const storedJobs = getCachedNearbyJobs(latitude, longitude, 50);
    if (storedJobs && storedJobs.length > 0) {
      setJobs(storedJobs);
      setIsLoading(false);
      setMessage('');
      return () => { isMounted = false; };
    }

    setIsLoading(true);
    setMessage('');
    getNearbyJobs(latitude, longitude, 50)
      .then(nextJobs => {
        if (isMounted) setJobs(nextJobs);
      })
      .catch(() => {
        if (isMounted) {
          setJobs([]);
          setMessage('Unable to load nearby jobs. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [latitude, longitude]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return jobs.filter(job => {
      const matchesFilter = selectedFilter === 'All'
        || (selectedFilter === 'Last 24 hours' && (job.createdAt?.getTime() ?? 0) >= Date.now() - 86_400_000)
        || job.categoryId === selectedFilter;
      const searchableText = `${job.title} ${job.category} ${job.description} ${job.pickupDetails.address}`.toLowerCase();
      return matchesFilter && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [jobs, searchText, selectedFilter]);

  const filterTabs = useMemo(() => [
    { id: 'All', label: 'All' },
    { id: 'Last 24 hours', label: 'Last 24 hours' },
    ...categories.map(category => ({ id: category.id, label: category.name })),
  ], [categories]);

  useEffect(() => { setVisibleCount(20); }, [filteredJobs]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Browse Jobs" />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={isLoading ? [] : filteredJobs.slice(0, visibleCount)}
        initialNumToRender={20}
        keyExtractor={job => job.id}
        ListEmptyComponent={isLoading ? (
          <View style={styles.shimmerList}>
            {[0, 1, 2,3,4,5,6,7,8].map(item => <View key={item} style={[styles.shimmerJobCard, { backgroundColor: colors.card }]}>
              <Shimmer style={styles.shimmerIcon} />
              <View style={styles.shimmerCopy}><Shimmer style={styles.shimmerTitle} /><Shimmer style={styles.shimmerLine} /><Shimmer style={styles.shimmerMeta} /></View>
            </View>)}
          </View>
        ) : <Text style={[styles.stateText, { color: colors.textMuted }]}>{message || 'No open jobs found within 50 km.'}</Text>}
        ListHeaderComponent={(
          <>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: isDark ? '#334155' : '#DED6E8' }]}>
              <Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
              <TextInput onChangeText={setSearchText} placeholder="Search jobs, skills or category" placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} value={searchText} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <View style={styles.filterRow}>
                {filterTabs.map(filter => {
                  const isSelected = filter.id === selectedFilter;
                  return <Pressable key={filter.id} accessibilityRole="button" onPress={() => setSelectedFilter(filter.id)} style={[styles.filter, isSelected ? styles.filterActive : { backgroundColor: isDark ? '#1D2D46' : '#E5E7EB' }]}><Text numberOfLines={1} style={[styles.filterText, isSelected ? styles.filterTextActive : { color: colors.textMuted }]}>{filter.label}</Text></Pressable>;
                })}
              </View>
            </ScrollView>
          </>
        )}
        onEndReached={() => setVisibleCount(current => Math.min(current + 20, filteredJobs.length))}
        onEndReachedThreshold={0.35}
        renderItem={({ item: job }) => {
          const hasAlreadyBid = Boolean(currentUserId && job.bidderIds?.includes(currentUserId));
          const bidCount = job.bidCount ?? job.bidderIds?.length ?? 0;

          return (
          <Pressable accessibilityRole="button" onPress={() => onJobPress(job)} style={[styles.jobCard, { backgroundColor: colors.card }]}> 
            <View style={[styles.jobIconWrap, { backgroundColor: isDark ? '#262042' : '#F0E8FF' }]}><Text style={[styles.jobIcon, { color: colors.primary }]}>▣</Text></View>
            <View style={styles.jobDetails}>
              <View style={styles.jobTitleRow}>
                <Text numberOfLines={2} style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                <Text style={[styles.distance, { color: colors.textMuted }]}>{formatDistance(job.distanceKm)}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.location, { color: colors.textMuted }]}>{job.pickupDetails.address || 'Pickup location'}</Text>
              <View style={styles.bidInfoRow}>
                {hasAlreadyBid ? <View style={styles.alreadyBidBadge}><Text style={[styles.alreadyBidText, { color: colors.primary }]}>Already bid</Text></View> : null}
                <Text style={[styles.bidCount, { color: colors.textMuted }]}>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</Text>
              </View>
              <View style={styles.jobMeta}>
                <Text style={[styles.price, { color: colors.primary }]}>₹{job.budget}{job.budgetType === 'hourly' ? ' / hr' : ''}</Text>
                <Text style={[styles.category, { color: colors.textMuted }]}>{job.category}</Text>
              </View>
            </View>
          </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  alreadyBidBadge: { backgroundColor: '#EDE9FE', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2 },
  alreadyBidText: { fontSize: rf(8), fontWeight: '800' },
  bidCount: { fontSize: rf(9), fontWeight: '600', marginLeft: 7 },
  bidInfoRow: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  category: { fontSize: rf(10), marginLeft: 7 },
  distance: { fontSize: rf(9), marginLeft: 8 },
  filter: { alignItems: 'center', borderRadius: 13, height: hp(3), justifyContent: 'center', marginRight: 7, paddingHorizontal: 12 },
  filterActive: { backgroundColor: brandColors.blue },
  filterRow: { flexDirection: 'row', paddingRight: 13 },
  filterScroll: { marginTop: 14, marginBottom:14 },
  filterText: { fontSize: rf(12), fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  jobCard: { alignItems: 'center', borderRadius: 7, elevation: 2, flexDirection: 'row', marginBottom: 11, minHeight: 71, paddingHorizontal: 10, paddingVertical: 10, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3 },
  jobDetails: { flex: 1, marginLeft: 10 },
  jobIcon: { fontSize: rf(17), fontWeight: '800' },
  jobIconWrap: { alignItems: 'center', backgroundColor: '#F0E8FF', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  jobMeta: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  jobTitle: { flex: 1, fontSize: rf(13), fontWeight: '800' },
  jobTitleRow: { alignItems: 'center', flexDirection: 'row' },
  listContent: { flexGrow: 1, paddingBottom: 18, paddingHorizontal: 13, paddingTop: 2,marginTop:10 },
  location: { fontSize: rf(9), marginTop: 2 },
  price: { fontSize: rf(13), fontWeight: '800' },
  screen: { flex: 1 },
  searchBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DED6E8', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: hp(6), paddingHorizontal: 8 },
  searchIcon: { fontSize: rf(26), marginRight: 5 },
  searchInput: { flex: 1, fontSize: rf(14), paddingVertical: 0 },
  shimmerCopy: { flex: 1, marginLeft: 10 },
  shimmerIcon: { borderRadius: 18, height: 36, width: 36 },
  shimmerJobCard: { alignItems: 'center', borderRadius: 7, flexDirection: 'row', marginBottom: 11, minHeight: 71, paddingHorizontal: 10, paddingVertical: 10 },
  shimmerLine: { borderRadius: 4, height: 9, marginTop: 7, width: '76%' },
  shimmerList: { marginTop: 3 },
  shimmerMeta: { borderRadius: 4, height: 11, marginTop: 8, width: '48%' },
  shimmerTitle: { borderRadius: 4, height: 13, width: '66%' },
  stateText: { fontSize: rf(11), marginLeft: 7, marginTop: 19, textAlign: 'center' },
});

export default BrowseJobsScreen;
