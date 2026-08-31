import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { getNearbyJobs, type NearbyJob } from '../../services/jobs';
import { hp, rf } from '../../utils/responsive';

type HomeScreenProps = {
  address: string;
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
  role?: string;
  verificationStatus?: string;
  onAvailabilityPress: () => void;
  onJobPress: (job: NearbyJob) => void;
  onLocationPress: () => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  onViewAll: () => void;
  onWalletPress: () => void;
};

const stats = [
  { icon: '₹', iconColor: '#18B978', iconSurface: '#E5FAEF', label: 'Total Earning', value: '₹1450' },
  { icon: '▣', iconColor: brandColors.blue, iconSurface: '#F1E9FF', label: 'Jobs\nCompleted', value: '32' },
  { icon: '★', iconColor: '#E5AC12', iconSurface: '#FFF8DA', label: 'Rating', value: '4.5' },
];

const formatDistance = (distanceKm: number) => distanceKm < 1
  ? `${Math.max(1, Math.round(distanceKm * 1000))} m away`
  : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;

function PersonAvatar({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Open provider profile" accessibilityRole="button" hitSlop={5} onPress={onPress} style={styles.avatarWrap}><View style={styles.avatarHead} /><View style={styles.avatarBody} /></Pressable>;
}

function HomeScreen({ address, isOnline, latitude, longitude, role, verificationStatus, onAvailabilityPress, onJobPress, onLocationPress, onNotificationPress, onProfilePress, onViewAll, onWalletPress }: HomeScreenProps) {
  const { colors } = useAppTheme();
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsMessage, setJobsMessage] = useState('');
  const [visibleJobCount, setVisibleJobCount] = useState(20);
  const fullAddress = address?.trim() || 'Choose your location';
  const areaName = fullAddress.split(',')[0]?.trim() || 'Select Location';
  const isVerificationPending = verificationStatus === 'pending';
  const availabilityEnabled = isOnline && !isVerificationPending;

  useEffect(() => {
    let isMounted = true;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setNearbyJobs([]);
      setJobsMessage('Choose your location to see nearby jobs.');
      setIsLoadingJobs(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingJobs(true);
    setJobsMessage('');
    getNearbyJobs(latitude, longitude, 20)
      .then(jobs => {
        if (isMounted) {
          setNearbyJobs(jobs);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNearbyJobs([]);
          setJobsMessage('Unable to load nearby jobs. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingJobs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    setVisibleJobCount(20);
  }, [nearbyJobs]);

  const loadMoreJobs = () => {
    setVisibleJobCount(currentCount => Math.min(currentCount + 20, nearbyJobs.length));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primary }]} edges={['left','right']}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLocation}>
          <Pressable accessibilityLabel="Change location" accessibilityRole="button" onPress={onLocationPress} style={styles.locationRow}>
            <Image source={require('../../../images/marker.png')} style={styles.locationIcon} resizeMode="contain" />
            <View style={styles.locationCopy}>
              <Text numberOfLines={1} style={styles.areaName}>{areaName}</Text>
              <Text numberOfLines={1} style={styles.fullAddress}>{fullAddress}</Text>
            </View>
            <Image source={require('../../../images/downarrow.png')} style={styles.locationArrow} resizeMode="contain" />
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Open wallet" accessibilityRole="button" onPress={onWalletPress} style={styles.walletWrap}>
            <Image source={require('../../../images/wallet.png')} style={styles.walletIcon} resizeMode="contain" />
          </Pressable>
          <Pressable accessibilityLabel="Open notifications" accessibilityRole="button" onPress={onNotificationPress} style={styles.notificationWrap}>
            <Image source={require('../../../images/bell.png')} style={styles.notificationIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <FlatList
            data={isLoadingJobs ? [] : nearbyJobs.slice(0, visibleJobCount)}
            keyExtractor={job => job.id}
            contentContainerStyle={styles.listContent}
            initialNumToRender={20}
            ListEmptyComponent={isLoadingJobs ? (
              <View style={styles.listLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.listLoadingText, { color: colors.textMuted }]}>Loading nearby jobs...</Text>
              </View>
            ) : <Text style={[styles.jobsStateText, { color: colors.textMuted }]}>{jobsMessage || 'No open jobs found within 20 km.'}</Text>}
            ListHeaderComponent={(
              <>
                <View style={[styles.onlineCard, { backgroundColor: colors.card }]}>
                  <View style={styles.onlineDetails}>
                    <View style={styles.onlineIcon}><Text style={styles.onlinePerson}>●</Text></View>
                    <View>
                      <Text style={[styles.onlineTitle, { color: colors.text }]}>You are {availabilityEnabled ? 'Online' : 'Offline'}</Text>
                      <Text style={[styles.onlineSubtitle, { color: colors.textMuted }]}>{availabilityEnabled ? 'Ready to receive jobs' : 'Turn on to receive jobs'}</Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel="Toggle online status"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: availabilityEnabled, disabled: isVerificationPending }}
                    disabled={isVerificationPending}
                    onPress={onAvailabilityPress}
                    style={[styles.switchTrack, availabilityEnabled ? styles.switchTrackOn : styles.switchTrackOff, isVerificationPending && styles.switchTrackDisabled]}
                  >
                    <View style={[styles.switchKnob, availabilityEnabled ? styles.switchKnobOn : styles.switchKnobOff]} />
                  </Pressable>
                </View>
                {verificationStatus === 'pending' ? <Text style={styles.verificationMessage}>Your verification is pending. You can go online after approval.</Text> : null}

                {role !== 'customer' ? (
                  <View style={styles.statsRow}>
                    {stats.map(stat => (
                      <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: stat.iconSurface }]}><Text style={[styles.statIconText, { color: stat.iconColor }]}>{stat.icon}</Text></View>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Jobs</Text>
                  <Pressable accessibilityRole="button" onPress={onViewAll}><Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text></Pressable>
                </View>
              </>
            )}
            onEndReached={isLoadingJobs ? undefined : loadMoreJobs}
            onEndReachedThreshold={0.35}
            renderItem={({ item: job }) => (
              <View style={[styles.jobCard, { backgroundColor: colors.card }]}>
                <PersonAvatar onPress={onProfilePress} />
                <Pressable accessibilityRole="button" onPress={() => onJobPress(job)} style={styles.jobInfo}>
                  <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                  <Text style={[styles.jobArea, { color: colors.textMuted }]}>⌖ {job.pickupDetails.address || 'Pickup location'}</Text>
                  <View style={styles.jobMetaRow}>
                    <Text style={[styles.jobPrice, { color: colors.text }]}>₹{job.budget}{job.budgetType === 'hourly' ? ' / hr' : ''}</Text>
                    <View style={styles.distanceBadge}><Text style={[styles.distanceText, { color: colors.primary }]}>{formatDistance(job.distanceKm)}</Text></View>
                  </View>
                </Pressable>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarBody: { backgroundColor: '#A7ADBA', borderRadius: 10, height: 9, marginTop: 3, width: 18 },
  avatarHead: { backgroundColor: '#A7ADBA', borderRadius: 5, height: 10, width: 10 },
  avatarWrap: { alignItems: 'center', backgroundColor: '#F2F3F6', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  content: { flex: 1, paddingHorizontal: 10, paddingTop: 13 },
  distanceBadge: { backgroundColor: '#F0E8FF', borderRadius: 4, marginLeft: 12, paddingHorizontal: 7, paddingVertical: 2 },
  distanceText: { fontSize: rf(10), fontWeight: '700' },
  areaName: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  fullAddress: { color: '#FFFFFF', fontSize: rf(9), marginTop: 1, opacity: 0.82 },
  header: { alignItems: 'center', flexDirection: 'row',
     justifyContent: 'space-between', minHeight: hp(6), 
     paddingBottom: 7, paddingHorizontal: 14, paddingTop: 2 },
  headerActions: { alignItems: 'center', flexDirection: 'row' },
  headerLocation: { flex: 1, paddingRight: 8 },
  jobArea: { fontSize: rf(11), marginTop: 5 },
  jobCard: { alignItems: 'center', borderRadius: 12, elevation: 1, flexDirection: 'row', marginBottom: 13, padding: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  jobInfo: { flex: 1, marginLeft: 12 },
  jobMetaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  jobPrice: { fontSize: rf(12), fontWeight: '800' },
  jobTitle: { fontSize: rf(13), fontWeight: '700' },
  jobsStateText: { fontSize: rf(11), marginTop: 4, textAlign: 'center' },
  listLoading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', minHeight: 90 },
  listLoadingText: { fontSize: rf(11), marginLeft: 8 },
  listContent: { flexGrow: 1, paddingBottom: 18 },
  locationArrow: { height: 10, marginLeft: 5, tintColor: '#FFFFFF', width: 10 },
  locationCopy: { flex: 1, paddingRight: 3 },
  locationIcon: { height: 16, marginRight: 7, tintColor: '#FFFFFF', width: 16 },
  locationRow: { alignItems: 'center', flexDirection: 'row', minHeight: 34 },
  notificationIcon: { height: hp(2.8), tintColor: '#FFFFFF', width: hp(2.8) },
  notificationWrap: { alignItems: 'center', height: hp(4), justifyContent: 'center', width: hp(4) },
  onlineCard: { alignItems: 'center', borderRadius: 10, elevation: 4, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, shadowColor: '#5F20B5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7 },
  onlineDetails: { alignItems: 'center', flexDirection: 'row' },
  onlineIcon: { alignItems: 'center', backgroundColor: '#F0E8FF', borderRadius: 16, height: 32, justifyContent: 'center', marginRight: 9, width: 32 },
  onlinePerson: { color: brandColors.blue, fontSize: rf(18), lineHeight: rf(18) },
  onlineSubtitle: { fontSize: rf(9), marginTop: 2 },
  onlineTitle: { fontSize: rf(14), fontWeight: '800' },
  safeArea: { flex: 1 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: hp(2.4), paddingHorizontal: 2 },
  sectionTitle: { fontSize: rf(16), fontWeight: '800' },
  statCard: { alignItems: 'center', borderRadius: 9, elevation: 1, flex: 1, marginHorizontal: 4, minHeight: 96, paddingHorizontal: 4, paddingTop: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2 },
  statIcon: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', marginBottom: 7, width: 26 },
  statIconText: { fontSize: rf(13), fontWeight: '900' },
  statLabel: { fontSize: rf(9), lineHeight: rf(11), minHeight: rf(21), textAlign: 'center' },
  statValue: { fontSize: rf(14), fontWeight: '800', marginTop: 1 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginTop: 13 },
  switchKnob: { backgroundColor: '#FFFFFF', borderRadius: 11, height: 22, width: 22 },
  switchKnobOff: { transform: [{ translateX: 0 }] },
  switchKnobOn: { transform: [{ translateX: 18 }] },
  switchTrack: { borderRadius: 15, height: 28, justifyContent: 'center', paddingHorizontal: 3, width: 46 },
  switchTrackOff: { backgroundColor: '#CBD5E1' },
  switchTrackOn: { backgroundColor: brandColors.blue },
  switchTrackDisabled: { opacity: 0.55 },
  viewAll: { fontSize: rf(11), fontWeight: '800' },
  verificationMessage: { color: '#DC2626', fontSize: rf(10), lineHeight: rf(14), marginTop: 8, textAlign: 'center' },
  walletIcon: { height: hp(2.7), tintColor: '#FFFFFF', width: hp(2.7) },
  walletWrap: { alignItems: 'center', height: hp(4), justifyContent: 'center', marginRight: 3, width: hp(4) },
});

export default HomeScreen;
