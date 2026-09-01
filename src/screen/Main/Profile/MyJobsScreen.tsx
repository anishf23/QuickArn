import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';

import { useAppTheme } from '../../../theme/AppTheme';
import Shimmer from '../../../components/Shimmer';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { getMyJobs, type PostedJob } from '../../../services/jobs';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyJobsScreenProps = {
  onBack: () => void;
  onOpenJob: (job: PostedJob) => void;
};

const formatJobDate = (date: Date) => date.toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});

const getDisplayStatus = (job: PostedJob, currentTime: number) => {
  if (job.status.toLowerCase() === 'closed') {
    return 'Closed';
  }

  return job.closeDateTime.getTime() < currentTime ? 'Overdue' : job.status;
};

function MyJobsScreen({ onBack, onOpenJob }: MyJobsScreenProps) {
  const { colors } = useAppTheme();
  const [jobs, setJobs] = useState<PostedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const currentUserId = getAuth().currentUser?.uid;

  useEffect(() => {
    getMyJobs()
      .then(setJobs)
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load your jobs.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="My Jobs" />
      {isLoading ? (
        <View style={styles.shimmerList}>
          {[0, 1, 2,3,4,5,6,7,8].map(item => <View key={item} style={[styles.shimmerJobCard, { backgroundColor: colors.card }]}>
            <Shimmer style={styles.shimmerIcon} />
            <View style={styles.shimmerCopy}><Shimmer style={styles.shimmerTitle} /><Shimmer style={styles.shimmerLine} /><Shimmer style={styles.shimmerMeta} /></View>
          </View>)}
        </View>
      ) : error ? (
        <View style={styles.centerState}><Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text></View>
      ) : jobs.length === 0 ? (
        <View style={styles.centerState}><Text style={[styles.emptyTitle, { color: colors.text }]}>No jobs posted yet</Text><Text style={[styles.stateText, { color: colors.textMuted }]}>Jobs you publish will appear here.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {jobs.map(job => {
            const status = getDisplayStatus(job, currentTime);
            const isClosed = status.toLowerCase() === 'closed';
            const isOverdue = status.toLowerCase() === 'overdue';
            const hasAlreadyBid = Boolean(currentUserId && job.bidderIds?.includes(currentUserId));
            const bidCount = job.bidCount ?? job.bidderIds?.length ?? 0;

            return (
            <Pressable key={job.id} accessibilityRole="button" onPress={() => onOpenJob(job)} style={[styles.jobCard, { backgroundColor: colors.card }]}>
              <View style={[styles.categoryIcon, { backgroundColor: '#F0E8FF' }]}><Text style={[styles.categorySymbol, { color: colors.primary }]}>▰</Text></View>
              <View style={styles.jobCopy}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={2} style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                  <View style={[styles.statusBadge, isClosed && styles.closedStatusBadge, isOverdue && styles.overdueStatusBadge]}><Text style={[styles.statusText, isClosed && styles.closedStatusText, isOverdue && styles.overdueStatusText]}>{status}</Text></View>
                </View>
                <Text numberOfLines={1} style={[styles.jobArea, { color: colors.textMuted }]}>⌖ {job.pickupDetails.address || 'Pickup location'}</Text>
                <View style={styles.bidSummaryRow}>
                  {hasAlreadyBid ? <View style={styles.alreadyBidBadge}><Text style={[styles.alreadyBidText, { color: colors.primary }]}>Already bid</Text></View> : null}
                  <Text style={[styles.bidCount, { color: colors.textMuted }]}>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.budget, { color: colors.primary }]}>₹{job.budget}{job.budgetType === 'hourly' ? ' / hr' : ''}</Text>
                  <Text style={[styles.date, { color: colors.textMuted }]}>{formatJobDate(job.jobDateTime)}</Text>
                </View>
              </View>
            </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  alreadyBidBadge: { backgroundColor: '#EDE9FE', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2 },
  alreadyBidText: { fontSize: rf(8), fontWeight: '800' },
  bidCount: { fontSize: rf(9), fontWeight: '600', marginLeft: 7 },
  bidSummaryRow: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  budget: { fontSize: rf(14), fontWeight: '800' },
  categoryIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  categorySymbol: { fontSize: rf(18), fontWeight: '800' },
  closedStatusBadge: { backgroundColor: '#FEE2E2' },
  closedStatusText: { color: '#DC2626' },
  centerState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  date: { fontSize: rf(10) },
  emptyTitle: { fontSize: rf(16), fontWeight: '800', marginBottom: 7 },
  jobArea: { fontSize: rf(11), marginTop: 5 },
  jobCard: { alignItems: 'center', borderRadius: 12, elevation: 2, flexDirection: 'row', marginBottom: 12, padding: 12, shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.09, shadowRadius: 4 },
  jobCopy: { flex: 1, marginLeft: 12 },
  jobTitle: { flex: 1, fontSize: rf(14), fontWeight: '800', lineHeight: rf(18), paddingRight: 7 },
  list: { padding: 12 },
  metaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  overdueStatusBadge: { backgroundColor: '#FFEDD5' },
  overdueStatusText: { color: '#C2410C' },
  screen: { flex: 1 },
  shimmerCopy: { flex: 1, marginLeft: 12 },
  shimmerIcon: { borderRadius: 22, height: 44, width: 44 },
  shimmerJobCard: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', marginBottom: 12, padding: 12 },
  shimmerLine: { borderRadius: 4, height: 10, marginTop: 8, width: '78%' },
  shimmerList: { padding: 12 },
  shimmerMeta: { borderRadius: 4, height: 11, marginTop: 10, width: '50%' },
  shimmerTitle: { borderRadius: 4, height: 14, width: '65%' },
  stateText: { fontSize: rf(12), lineHeight: rf(17), marginTop: 10, textAlign: 'center' },
  statusBadge: { backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { color: '#15803D', fontSize: rf(9), fontWeight: '800', textTransform: 'capitalize' },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row' },
});

export default MyJobsScreen;
