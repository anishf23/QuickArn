import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { getMyBidsWithJobs, type ProviderBid } from '../../../services/bids';
import { getCachedUserProfile } from '../../../services/firebaseUser';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyBidsScreenProps = { onBack: () => void };
type BidTab = 'Active' | 'Accepted' | 'Completed';

const formatDate = (date?: Date) => date
  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const formatDateTime = (date?: Date) => date
  ? date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const getJobStatus = (bid: ProviderBid) => bid.job?.status.trim().toLowerCase() ?? '';

const getDistanceKm = (fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number) => {
  const toRadians = (value: number) => value * (Math.PI / 180);
  const latitudeDifference = toRadians(toLatitude - fromLatitude);
  const longitudeDifference = toRadians(toLongitude - fromLongitude);
  const value = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
};

const formatDistance = (distanceKm: number | null) => {
  if (distanceKm === null) return 'Distance unavailable';
  return distanceKm < 1 ? `${Math.max(1, Math.round(distanceKm * 1000))} m away` : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
};

function MyBidsScreen({ onBack }: MyBidsScreenProps) {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<BidTab>('Active');
  const [bids, setBids] = useState<ProviderBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });

  useEffect(() => {
    getMyBidsWithJobs()
      .then(setBids)
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load your bids.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getCachedUserProfile().then(profile => {
      setCoordinates({ latitude: profile?.latitude ?? null, longitude: profile?.longitude ?? null });
    }).catch(() => {});
  }, []);

  const visibleBids = useMemo(() => bids.filter(bid => {
    const status = getJobStatus(bid);
    return activeTab === 'Active'
      ? status === 'open'
      : activeTab === 'Accepted'
        ? status === 'accepted'
        : status === 'completed';
  }), [activeTab, bids]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="My Bids" />
      <View style={styles.tabs}>
        {(['Active', 'Accepted', 'Completed'] as BidTab[]).map(tab => {
          const active = tab === activeTab;
          return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textMuted }]}>{tab}</Text></Pressable>;
        })}
      </View>

      {isLoading ? (
        <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={[styles.stateText, { color: colors.textMuted }]}>Loading your bids...</Text></View>
      ) : error ? (
        <View style={styles.centerState}><Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text></View>
      ) : visibleBids.length === 0 ? (
        <View style={styles.centerState}><Text style={[styles.stateText, { color: colors.textMuted }]}>No {activeTab.toLowerCase()} bids found.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {visibleBids.map(bid => {
            const pickupLatitude = bid.job?.pickupDetails.latitude;
            const pickupLongitude = bid.job?.pickupDetails.longitude;
            const distanceKm = typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number'
              && typeof pickupLatitude === 'number' && typeof pickupLongitude === 'number'
              ? getDistanceKm(coordinates.latitude, coordinates.longitude, pickupLatitude, pickupLongitude)
              : null;
            const bidCount = bid.job?.bidCount ?? bid.job?.bidderIds?.length ?? 0;
            const completed = activeTab === 'Completed';
            const completedHours = bid.agreedHours ?? 1;
            const completedTotal = bid.job?.budgetType === 'hourly' ? bid.bidAmount * completedHours : bid.bidAmount;

            return (
            <View key={bid.bidId} style={[styles.bidCard, { backgroundColor: colors.card }]}> 
              <View style={styles.titleRow}>
                <Text style={[styles.bidTitle, { color: colors.text }]}>{bid.job?.title || 'Job unavailable'}</Text>
                <Text style={[styles.amount, { color: colors.primary }]}>₹{bid.bidAmount}</Text>
              </View>
              <Text style={[styles.status, { color: colors.primary }]}>{bid.job?.status || 'Unknown'}</Text>
              <View style={styles.bidMetaRow}>
                <Text style={[styles.bidMetaText, { color: colors.textMuted }]}>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</Text>
                <Text style={[styles.bidMetaText, { color: colors.textMuted }]}>{formatDistance(distanceKm)}</Text>
              </View>
              <View style={styles.datesRow}>
                <View>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Bid Placed</Text>
                  <Text style={[styles.dateValue, { color: colors.textMuted }]}>◷  {formatDate(bid.createdAt)}</Text>
                </View>
                <View style={styles.jobDate}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Job Date</Text>
                  <Text style={[styles.dateValue, { color: colors.textMuted }]}>{formatDate(bid.job?.jobDateTime)}</Text>
                </View>
              </View>
              {completed ? <View style={[styles.completedSummary, { backgroundColor: '#F0FDF4' }]}>
                {bid.job?.budgetType === 'hourly' ? <Text style={[styles.completedRate, { color: colors.textMuted }]}>Hourly rate ₹{bid.bidAmount} × {completedHours} hr</Text> : <Text style={[styles.completedRate, { color: colors.textMuted }]}>Fixed job amount</Text>}
                <Text style={[styles.completedTotal, { color: '#15803D' }]}>Total ₹{completedTotal}</Text>
                <Text style={[styles.completedDate, { color: colors.textMuted }]}>Completed: {formatDateTime(bid.completedAt ?? bid.job?.completedAt)}</Text>
              </View> : null}
            </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: rf(17), fontWeight: '800', marginLeft: 10 },
  bidCard: { borderRadius: 8, elevation: 3, marginBottom: 13, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5 },
  bidMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  bidMetaText: { fontSize: rf(9), fontWeight: '600' },
  bidTitle: { flex: 1, fontSize: rf(16), fontWeight: '800', lineHeight: rf(21) },
  centerState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  completedDate: { fontSize: rf(9), marginTop: 6 },
  completedRate: { fontSize: rf(10), fontWeight: '700' },
  completedSummary: { borderRadius: 7, marginTop: 13, padding: 10 },
  completedTotal: { fontSize: rf(13), fontWeight: '800', marginTop: 4 },
  dateLabel: { fontSize: rf(10), fontWeight: '800' },
  dateValue: { fontSize: rf(9), marginTop: 4 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  jobDate: { alignItems: 'flex-end' },
  list: { paddingHorizontal: 11, paddingTop: 14 },
  screen: { flex: 1 },
  stateText: { fontSize: rf(12), lineHeight: rf(17), marginTop: 10, textAlign: 'center' },
  status: { fontSize: rf(10), fontWeight: '800', marginTop: 6, textTransform: 'capitalize' },
  tab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, height: 35, justifyContent: 'center' },
  tabActive: { borderBottomColor: '#7D00F5' },
  tabLabel: { fontSize: rf(11), fontWeight: '800' },
  tabs: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default MyBidsScreen;
