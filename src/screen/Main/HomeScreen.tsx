import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuth } from '@react-native-firebase/auth';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import Shimmer from '../../components/Shimmer';
import { useCustomAlert } from '../../components/CustomAlert';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { getCachedNearbyJobs, getNearbyJobs, getProviderCompletedJobs, invalidateJobCaches, type NearbyJob } from '../../services/jobs';
import { cancelBidRequest, cancelProviderBidRequest, getOwnerBidRequests, getProviderBidRequests, respondToBidRequest, updateBidRequestProgress, type OwnerBidRequest } from '../../services/bids';
import { createProviderReview, getProviderReviewStats, hasCurrentUserReviewedJob } from '../../services/reviews';
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
  onReassignRequest: (request: OwnerBidRequest) => void;
};

const formatDistance = (distanceKm: number) => distanceKm < 1
  ? `${Math.max(1, Math.round(distanceKm * 1000))} m away`
  : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;

const formatRequestStatus = (status: string) => status === 'job_started' ? 'Job Started' : status === 'completed' ? 'Job Done' : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
const nextProviderAction = (status: string) => {
  if (status === 'accepted') return { label: 'Start Coming', nextStatus: 'coming' as const };
  if (status === 'coming') return { label: 'Start Job', nextStatus: 'job_started' as const };
  if (status === 'job_started') return { label: 'Mark Job Done', nextStatus: 'completed' as const };
  return null;
};

function PersonAvatar({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Open provider profile" accessibilityRole="button" hitSlop={5} onPress={onPress} style={styles.avatarWrap}><View style={styles.avatarHead} /><View style={styles.avatarBody} /></Pressable>;
}

function HomeScreen({ address, isOnline, latitude, longitude, role, verificationStatus, onAvailabilityPress, onJobPress, onLocationPress, onNotificationPress, onProfilePress, onViewAll, onWalletPress, onReassignRequest }: HomeScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const cachedJobs = getCachedNearbyJobs(latitude, longitude, 20);
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>(() => cachedJobs ?? []);
  const [isLoadingJobs, setIsLoadingJobs] = useState(() => !cachedJobs);
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [jobsMessage, setJobsMessage] = useState('');
  const [visibleJobCount, setVisibleJobCount] = useState(20);
  const [isBidRequestModalVisible, setIsBidRequestModalVisible] = useState(false);
  const [bidRequests, setBidRequests] = useState<OwnerBidRequest[]>([]);
  const [isLoadingBidRequests, setIsLoadingBidRequests] = useState(false);
  const [bidRequestMessage, setBidRequestMessage] = useState('');
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [reviewRequest, setReviewRequest] = useState<OwnerBidRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [providerStats, setProviderStats] = useState({ completedJobs: 0, rating: 0, ratingCount: 0, totalEarnings: 0 });
  const promptedReviewIds = useRef(new Set<string>());
  const fullAddress = address?.trim() || 'Choose your location';
  const areaName = fullAddress.split(',')[0]?.trim() || 'Select Location';
  const isProviderVerified = role === 'provider' && verificationStatus === 'accepted';
  const availabilityEnabled = isOnline && isProviderVerified;
  const currentUserId = getAuth().currentUser?.uid;
  const stats = useMemo(() => [
    { icon: '₹', iconColor: '#18B978', iconSurface: '#E5FAEF', label: 'Total Earning', value: `₹${providerStats.totalEarnings.toLocaleString('en-IN')}` },
    { icon: '▣', iconColor: brandColors.blue, iconSurface: '#F1E9FF', label: 'Jobs Completed', value: `${providerStats.completedJobs}` },
    { icon: '★', iconColor: '#E5AC12', iconSurface: '#FFF8DA', label: `Rating (${providerStats.ratingCount})`, value: providerStats.ratingCount ? providerStats.rating.toFixed(1) : '—' },
  ], [providerStats]);

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

    const storedJobs = getCachedNearbyJobs(latitude, longitude, 20);
    if (storedJobs && storedJobs.length > 0) {
      setNearbyJobs(storedJobs);
      setIsLoadingJobs(false);
      setJobsMessage('');
      return () => { isMounted = false; };
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

  useEffect(() => {
    if (role !== 'customer' && role !== 'provider') {
      setBidRequests([]);
      return;
    }
    let isMounted = true;
    (role === 'provider' ? getProviderBidRequests() : getOwnerBidRequests())
      .then(requests => { if (isMounted) setBidRequests(requests); })
      .catch(() => { if (isMounted) setBidRequests([]); });
    return () => { isMounted = false; };
  }, [role]);

  useEffect(() => {
    if (role !== 'provider' || verificationStatus !== 'accepted' || !currentUserId) {
      setProviderStats({ completedJobs: 0, rating: 0, ratingCount: 0, totalEarnings: 0 });
      return;
    }
    let isMounted = true;
    Promise.all([getProviderCompletedJobs(), getProviderReviewStats(currentUserId)])
      .then(([completedJobs, reviews]) => {
        if (!isMounted) return;
        const totalEarnings = completedJobs.reduce((total, job) => total + (job.agreedTotalAmount ?? (job.budgetType === 'hourly' ? job.budget * (job.agreedHours ?? 1) : job.budget)), 0);
        setProviderStats({ completedJobs: completedJobs.length, rating: reviews.average, ratingCount: reviews.count, totalEarnings });
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [currentUserId, role, verificationStatus]);

  useEffect(() => {
    if (role !== 'customer' || reviewRequest) return;
    const completedRequest = bidRequests.find(request => request.status.toLowerCase() === 'completed' && !promptedReviewIds.current.has(request.requestId));
    if (!completedRequest) return;

    let active = true;
    promptedReviewIds.current.add(completedRequest.requestId);
    hasCurrentUserReviewedJob(completedRequest.jobId)
      .then(hasReviewed => {
        if (!active || hasReviewed) return;
        setReviewRating(0);
        setReviewComment('');
        setReviewError('');
        setReviewRequest(completedRequest);
      })
      .catch(() => {
        // Do not show a duplicate review prompt when review status cannot be checked.
      });
    return () => { active = false; };
  }, [bidRequests, reviewRequest, role]);

  const loadMoreJobs = () => {
    setVisibleJobCount(currentCount => Math.min(currentCount + 20, nearbyJobs.length));
  };

  const refreshJobs = async () => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setJobsMessage('Choose your location to see nearby jobs.');
      return;
    }
    setIsRefreshingJobs(true);
    setJobsMessage('');
    try {
      invalidateJobCaches();
      const jobs = await getNearbyJobs(latitude, longitude, 20);
      setNearbyJobs(jobs);
      setVisibleJobCount(20);
    } catch {
      setJobsMessage('Unable to refresh nearby jobs. Please try again.');
    } finally {
      setIsRefreshingJobs(false);
    }
  };

  const hasActiveBidRequest = bidRequests.some(request => role === 'provider'
    ? ['requested', 'accepted', 'coming', 'job_started'].includes(request.status.toLowerCase())
    : ['requested', 'accepted', 'coming', 'job_started'].includes(request.status.toLowerCase()));

  const openBidRequests = () => {
    setIsBidRequestModalVisible(true);
    setIsLoadingBidRequests(true);
    setBidRequestMessage('');
    (role === 'provider' ? getProviderBidRequests() : getOwnerBidRequests())
      .then(setBidRequests)
      .catch(error => setBidRequestMessage(error instanceof Error ? error.message : 'Unable to load bid requests.'))
      .finally(() => setIsLoadingBidRequests(false));
  };

  const cancelRequest = (request: OwnerBidRequest, reassign = false) => {
    showAlert(
      reassign ? 'Reassign job' : 'Cancel bid request',
      reassign ? 'This request will be cancelled, the held wallet amount refunded, and the job will reopen for another provider.' : 'This request will be cancelled and the held wallet amount refunded to your wallet.',
      [
        { text: 'Keep request', style: 'cancel' },
        {
          text: reassign ? 'Reassign' : 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            setRequestActionId(request.requestId);
            try {
              await cancelBidRequest(request);
              setBidRequests(current => current.map(item => item.requestId === request.requestId ? { ...item, status: 'cancelled' } : item));
              if (reassign) {
                setIsBidRequestModalVisible(false);
                onReassignRequest(request);
              }
            } catch (error) {
              showAlert('Unable to update request', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setRequestActionId(null);
            }
          },
        },
      ],
    );
  };

  const respondToRequest = (request: OwnerBidRequest, accept: boolean) => {
    showAlert(
      accept ? 'Accept job request' : 'Reject job request',
      accept ? 'Confirm that you are ready to accept this job request.' : 'Rejecting this request will return the held amount to the job owner.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: accept ? 'Accept' : 'Reject',
          style: accept ? 'default' : 'destructive',
          onPress: async () => {
            setRequestActionId(request.requestId);
            try {
              await respondToBidRequest(request, accept);
              setBidRequests(current => current.map(item => item.requestId === request.requestId ? { ...item, status: accept ? 'accepted' : 'rejected' } : item));
            } catch (error) {
              showAlert('Unable to update request', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setRequestActionId(null);
            }
          },
        },
      ],
    );
  };

  const advanceProviderRequest = (request: OwnerBidRequest, nextStatus: 'coming' | 'job_started' | 'completed') => {
    const action = nextProviderAction(request.status.toLowerCase());
    showAlert(
      action?.label ?? 'Update job status',
      `Confirm that the job status should change to ${formatRequestStatus(nextStatus)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setRequestActionId(request.requestId);
            try {
              await updateBidRequestProgress(request, nextStatus);
              setBidRequests(current => current.map(item => item.requestId === request.requestId ? { ...item, status: nextStatus } : item));
            } catch (error) {
              showAlert('Unable to update job', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setRequestActionId(null);
            }
          },
        },
      ],
    );
  };

  const cancelProviderRequest = (request: OwnerBidRequest) => {
    showAlert(
      'Cancel Job',
      'Cancel this job? The job will reopen for reassignment and the held amount will be refunded to the job owner.',
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Cancel Job',
          style: 'destructive',
          onPress: async () => {
            setRequestActionId(request.requestId);
            try {
              await cancelProviderBidRequest(request);
              setBidRequests(current => current.map(item => item.requestId === request.requestId ? { ...item, status: 'cancelled' } : item));
            } catch (error) {
              showAlert('Unable to cancel job', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setRequestActionId(null);
            }
          },
        },
      ],
    );
  };

  const submitReview = async () => {
    if (!reviewRequest) return;
    if (reviewRating < 1) {
      setReviewError('Please select a star rating.');
      return;
    }
    setReviewError('');
    setIsSubmittingReview(true);
    try {
      await createProviderReview({
        comment: reviewComment,
        jobId: reviewRequest.jobId,
        jobTitle: reviewRequest.jobTitle,
        providerId: reviewRequest.bidderId,
        providerName: reviewRequest.bidderName,
        rating: reviewRating,
      });
      setReviewRequest(null);
      showAlert('Review submitted', 'Thank you for rating your service provider.');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to submit your review.');
    } finally {
      setIsSubmittingReview(false);
    }
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
            refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={refreshJobs} refreshing={isRefreshingJobs} tintColor={colors.primary} />}
            ListEmptyComponent={isLoadingJobs ? (
              <View style={styles.shimmerList}>
                {[0, 1, 2,3,4,5,6,7,8].map(item => <View key={item} style={[styles.shimmerJobCard, { backgroundColor: colors.card }]}>
                  <Shimmer style={styles.shimmerAvatar} />
                  <View style={styles.shimmerCopy}><Shimmer style={styles.shimmerTitle} /><Shimmer style={styles.shimmerLine} /><Shimmer style={styles.shimmerMeta} /></View>
                </View>)}
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
                    accessibilityState={{ checked: availabilityEnabled, disabled: role !== 'customer' && !isProviderVerified }}
                    disabled={role !== 'customer' && !isProviderVerified}
                    onPress={onAvailabilityPress}
                    style={[styles.switchTrack, availabilityEnabled ? styles.switchTrackOn : styles.switchTrackOff, role !== 'customer' && !isProviderVerified && styles.switchTrackDisabled]}
                  >
                    <View style={[styles.switchKnob, availabilityEnabled ? styles.switchKnobOn : styles.switchKnobOff]} />
                  </Pressable>
                </View>
                {!isProviderVerified ? <Text style={styles.verificationMessage}>{role !== 'provider' ? 'Only verified service providers can go online.' : verificationStatus === 'pending' ? 'Your verification is pending. You can go online after approval.' : 'Your verification must be accepted before you can go online.'}</Text> : null}

                {isProviderVerified ? (
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
            renderItem={({ item: job }) => {
              const hasAlreadyBid = Boolean(currentUserId && job.bidderIds?.includes(currentUserId));
              const bidCount = job.bidCount ?? job.bidderIds?.length ?? 0;

              return (
              <View style={[styles.jobCard, { backgroundColor: colors.card }]}> 
                <PersonAvatar onPress={onProfilePress} />
                <Pressable accessibilityRole="button" onPress={() => onJobPress(job)} style={styles.jobInfo}>
                  <View style={styles.jobTitleRow}>
                    <Text numberOfLines={1} style={[styles.jobTitle, styles.jobTitleCopy, { color: colors.text }]}>{job.title}</Text>
                    {hasAlreadyBid ? <View style={[styles.alreadyBidBadge, { backgroundColor: '#EDE9FE' }]}><Text style={[styles.alreadyBidText, { color: colors.primary }]}>Already bid</Text></View> : null}
                  </View>
                  <Text style={[styles.jobArea, { color: colors.textMuted }]}>⌖ {job.pickupDetails.address || 'Pickup location'}</Text>
                  <View style={styles.jobMetaRow}>
                    <Text style={[styles.jobPrice, { color: colors.text }]}>₹{job.budget}{job.budgetType === 'hourly' ? ' / hr' : ''}</Text>
                    <Text style={[styles.bidCountText, { color: colors.textMuted }]}>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</Text>
                    <View style={styles.distanceBadge}><Text style={[styles.distanceText, { color: colors.primary }]}>{formatDistance(job.distanceKm)}</Text></View>
                  </View>
                </Pressable>
              </View>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        {(role === 'customer' || role === 'provider') && hasActiveBidRequest ? <View style={[styles.bidRequestOverlay, { backgroundColor: `${colors.primary}E6`, borderColor: `${colors.primary}99` }]}>
          <Pressable accessibilityRole="button" onPress={openBidRequests} style={styles.bidRequestLink}>
            <Text style={styles.bidRequestOverlayText}>{role === 'provider' ? 'See Job Requests' : 'See Job Bid Requests'}</Text>
            <Text style={styles.bidRequestOverlayArrow}>›</Text>
          </Pressable>
        </View> : null}
      </View>

      <Modal animationType="slide" transparent visible={isBidRequestModalVisible} onRequestClose={() => setIsBidRequestModalVisible(false)}>
        <View style={styles.requestModalBackdrop}>
          <View style={[styles.requestModalCard, { backgroundColor: colors.card }]}>
            <View style={styles.requestModalHeader}>
              <Text style={[styles.requestModalTitle, { color: colors.text }]}>{role === 'provider' ? 'Job Requests' : 'Job Bid Requests'}</Text>
              <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={() => setIsBidRequestModalVisible(false)} style={styles.closeRequestModal}><Text style={[styles.closeRequestModalText, { color: colors.textMuted }]}>×</Text></Pressable>
            </View>
            {isLoadingBidRequests ? <View style={styles.requestCenter}><ActivityIndicator color={colors.primary} /></View> : bidRequestMessage ? <Text style={styles.requestError}>{bidRequestMessage}</Text> : bidRequests.length === 0 ? <Text style={[styles.emptyRequestText, { color: colors.textMuted }]}>No bid requests yet.</Text> : <FlatList
              data={bidRequests}
              keyExtractor={request => request.requestId}
              contentContainerStyle={styles.requestList}
              renderItem={({ item: request }) => {
                const active = request.status.toLowerCase() === 'requested';
                const ownerCanCancel = role === 'customer' && ['requested', 'accepted', 'coming', 'job_started'].includes(request.status.toLowerCase());
                const providerAction = role === 'provider' ? nextProviderAction(request.status.toLowerCase()) : null;
                return <View style={[styles.requestCard, { borderColor: active ? `${colors.primary}40` : '#E5E7EB', backgroundColor: colors.background }]}>
                  <View style={styles.requestTitleRow}>
                    <Text numberOfLines={2} style={[styles.requestJobTitle, { color: colors.text }]}>{request.jobTitle}</Text>
                    <View style={[styles.requestStatusBadge, { backgroundColor: active ? `${colors.primary}1A` : request.status === 'accepted' ? '#DCFCE7' : '#F1F5F9' }]}><Text style={[styles.requestStatusText, { color: active ? colors.primary : request.status === 'accepted' ? '#15803D' : colors.textMuted }]}>{formatRequestStatus(request.status)}</Text></View>
                  </View>
                  <Text style={[styles.requestProvider, { color: colors.text }]}>Provider: {request.bidderName}</Text>
                  <Text style={[styles.requestDetails, { color: colors.textMuted }]}>Bid ₹{request.bidAmount} · Paid ₹{request.totalPaid} · Fee ₹{request.platformFee}</Text>
                  {role === 'provider' ? <Text style={[styles.providerStatusText, { color: request.status === 'accepted' ? '#15803D' : colors.textMuted }]}>Status: {formatRequestStatus(request.status)}</Text> : null}
                  {request.createdAt ? <Text style={[styles.requestDate, { color: colors.textMuted }]}>Requested {request.createdAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text> : null}
                  {ownerCanCancel ? <View style={styles.requestActions}>
                    <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => cancelRequest(request)} style={[styles.requestActionButton, styles.cancelRequestButton, { borderColor: '#DC2626' }]}><Text style={styles.cancelRequestText}>{requestActionId === request.requestId ? 'Updating...' : 'Cancel Job'}</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => cancelRequest(request, true)} style={[styles.requestActionButton, { backgroundColor: colors.primary }]}><Text style={styles.reassignRequestText}>Reassign</Text></Pressable>
                  </View> : active && role === 'provider' ? <View style={styles.requestActions}>
                    <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => respondToRequest(request, false)} style={[styles.requestActionButton, styles.cancelRequestButton, { borderColor: '#DC2626' }]}><Text style={styles.cancelRequestText}>{requestActionId === request.requestId ? 'Updating...' : 'Reject'}</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => respondToRequest(request, true)} style={[styles.requestActionButton, { backgroundColor: '#15803D' }]}><Text style={styles.reassignRequestText}>Accept</Text></Pressable>
                  </View> : providerAction ? <View style={styles.requestActions}>
                    {request.status.toLowerCase() === 'accepted' ? <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => cancelProviderRequest(request)} style={[styles.requestActionButton, styles.cancelRequestButton, { borderColor: '#DC2626' }]}><Text style={styles.cancelRequestText}>{requestActionId === request.requestId ? 'Updating...' : 'Cancel Job'}</Text></Pressable> : null}
                    <Pressable accessibilityRole="button" disabled={requestActionId !== null} onPress={() => advanceProviderRequest(request, providerAction.nextStatus)} style={[styles.requestActionButton, { backgroundColor: colors.primary, opacity: requestActionId ? 0.7 : 1 }]}><Text style={styles.reassignRequestText}>{providerAction.label}</Text></Pressable>
                  </View> : null}
                </View>;
              }}
            />}
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={reviewRequest !== null} onRequestClose={() => { if (!isSubmittingReview) setReviewRequest(null); }}>
        <View style={styles.reviewBackdrop}>
          <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.reviewTitle, { color: colors.text }]}>Rate Your Provider</Text>
            <Text style={[styles.reviewSubtitle, { color: colors.textMuted }]}>How was your experience with {reviewRequest?.bidderName}?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => <Pressable key={star} accessibilityLabel={`${star} stars`} accessibilityRole="button" onPress={() => { setReviewRating(star); setReviewError(''); }} style={styles.starButton}><Text style={[styles.starText, { color: star <= reviewRating ? '#F59E0B' : '#CBD5E1' }]}>★</Text></Pressable>)}
            </View>
            <TextInput multiline placeholder="Write a review (optional)" placeholderTextColor={colors.textMuted} textAlignVertical="top" value={reviewComment} onChangeText={setReviewComment} style={[styles.reviewInput, { borderColor: reviewError ? '#DC2626' : '#E0D6ED', color: colors.text }]} />
            {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}
            <View style={styles.reviewActions}>
              <Pressable accessibilityRole="button" disabled={isSubmittingReview} onPress={() => setReviewRequest(null)} style={[styles.reviewButton, styles.reviewCancelButton, { borderColor: colors.primary }]}><Text style={[styles.reviewCancelText, { color: colors.primary }]}>Later</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={isSubmittingReview} onPress={submitReview} style={[styles.reviewButton, { backgroundColor: colors.primary, opacity: isSubmittingReview ? 0.7 : 1 }]}><Text style={styles.reviewSubmitText}>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bidRequestLink: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  bidRequestLinkArrow: { fontSize: rf(22), fontWeight: '700', lineHeight: rf(18), marginLeft: 5 },
  bidRequestLinkText: { fontSize: rf(12), fontWeight: '800' },
  bidRequestOverlay: { borderRadius: 24, borderWidth: 1, bottom: 14, elevation: 8, left: 26, position: 'absolute', right: 26, shadowColor: '#0F172A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.16, shadowRadius: 7 },
  bidRequestOverlayArrow: { color: '#FFFFFF', fontSize: rf(22), fontWeight: '700', lineHeight: rf(18), marginLeft: 5 },
  bidRequestOverlayText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  cancelRequestButton: { backgroundColor: '#FFFFFF', borderWidth: 1 },
  cancelRequestText: { color: '#DC2626', fontSize: rf(10), fontWeight: '800' },
  alreadyBidBadge: { borderRadius: 10, marginLeft: 7, paddingHorizontal: 7, paddingVertical: 3 },
  alreadyBidText: { fontSize: rf(8), fontWeight: '800' },
  bidCountText: { fontSize: rf(9), fontWeight: '600', marginLeft: 9 },
  avatarBody: { backgroundColor: '#A7ADBA', borderRadius: 10, height: 9, marginTop: 3, width: 18 },
  avatarHead: { backgroundColor: '#A7ADBA', borderRadius: 5, height: 10, width: 10 },
  avatarWrap: { alignItems: 'center', backgroundColor: '#F2F3F6', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  content: { flex: 1, paddingHorizontal: 10, paddingTop: 13 },
  closeRequestModal: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  closeRequestModalText: { fontSize: rf(27), fontWeight: '400', lineHeight: rf(28) },
  distanceBadge: { backgroundColor: '#F0E8FF', borderRadius: 4, marginLeft: 12, paddingHorizontal: 7, paddingVertical: 2 },
  distanceText: { fontSize: rf(10), fontWeight: '700' },
  emptyRequestText: { fontSize: rf(12), paddingVertical: 35, textAlign: 'center' },
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
  jobTitleCopy: { flex: 1 },
  jobTitleRow: { alignItems: 'center', flexDirection: 'row' },
  jobsStateText: { fontSize: rf(11), marginTop: 4, textAlign: 'center' },
  listContent: { flexGrow: 1, paddingBottom: 82 },
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
  reassignRequestText: { color: '#FFFFFF', fontSize: rf(10), fontWeight: '800' },
  requestActionButton: { alignItems: 'center', borderRadius: 7, flex: 1, height: 36, justifyContent: 'center' },
  requestActions: { flexDirection: 'row', gap: 9, marginTop: 13 },
  requestCard: { borderRadius: 10, borderWidth: 1, marginBottom: 10, padding: 12 },
  requestCenter: { alignItems: 'center', justifyContent: 'center', minHeight: 150 },
  requestDate: { fontSize: rf(9), marginTop: 7 },
  requestDetails: { fontSize: rf(10), marginTop: 5 },
  requestError: { color: '#DC2626', fontSize: rf(11), lineHeight: rf(16), paddingVertical: 24, textAlign: 'center' },
  requestJobTitle: { flex: 1, fontSize: rf(13), fontWeight: '800', paddingRight: 7 },
  requestList: { paddingTop: 13 },
  requestModalBackdrop: { backgroundColor: 'rgba(15, 23, 42, 0.5)', flex: 1, justifyContent: 'flex-end' },
  requestModalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '78%', minHeight: '46%', padding: 16 },
  requestModalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  requestModalTitle: { fontSize: rf(17), fontWeight: '800' },
  requestProvider: { fontSize: rf(11), fontWeight: '700', marginTop: 9 },
  providerProgressButton: { alignItems: 'center', borderRadius: 7, flex: 1, height: 36, justifyContent: 'center' },
  providerStatusText: { fontSize: rf(10), fontWeight: '800', marginTop: 7 },
  requestStatusBadge: { borderRadius: 7, flexShrink: 0, paddingHorizontal: 7, paddingVertical: 3 },
  requestStatusText: { fontSize: rf(8), fontWeight: '800', textTransform: 'capitalize' },
  requestTitleRow: { alignItems: 'flex-start', flexDirection: 'row' },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  reviewBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  reviewButton: { alignItems: 'center', borderRadius: 8, flex: 1, height: 42, justifyContent: 'center' },
  reviewCancelButton: { borderWidth: 1 },
  reviewCancelText: { fontSize: rf(11), fontWeight: '800' },
  reviewCard: { borderRadius: 16, elevation: 10, maxWidth: 360, padding: 20, shadowColor: '#0F172A', shadowOffset: { height: 7, width: 0 }, shadowOpacity: 0.22, shadowRadius: 16, width: '100%' },
  reviewError: { color: '#DC2626', fontSize: rf(9), fontWeight: '600', marginTop: 5 },
  reviewInput: { borderRadius: 8, borderWidth: 1, fontSize: rf(11), height: 90, marginTop: 12, padding: 10 },
  reviewSubmitText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  reviewSubtitle: { fontSize: rf(11), lineHeight: rf(16), marginTop: 7, textAlign: 'center' },
  reviewTitle: { fontSize: rf(18), fontWeight: '800', textAlign: 'center' },
  safeArea: { flex: 1 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: hp(2.4), paddingHorizontal: 2 },
  sectionTitle: { fontSize: rf(16), fontWeight: '800' },
  statCard: { alignItems: 'center', borderRadius: 9, elevation: 1, flex: 1, marginHorizontal: 4, minHeight: 96, paddingHorizontal: 4, paddingTop: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2 },
  statIcon: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', marginBottom: 7, width: 26 },
  statIconText: { fontSize: rf(13), fontWeight: '900' },
  statLabel: { fontSize: rf(9), lineHeight: rf(11), minHeight: rf(21), textAlign: 'center' },
  statValue: { fontSize: rf(14), fontWeight: '800', marginTop: 1 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginTop: 13 },
  shimmerAvatar: { borderRadius: 22, height: 44, width: 44 },
  starButton: { paddingHorizontal: 4, paddingVertical: 3 },
  starText: { fontSize: rf(29) },
  starsRow: { alignSelf: 'center', flexDirection: 'row', marginTop: 16 },
  shimmerCopy: { flex: 1, marginLeft: 12 },
  shimmerJobCard: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', marginBottom: 13, padding: 12 },
  shimmerLine: { borderRadius: 4, height: 10, marginTop: 8, width: '76%' },
  shimmerList: { marginTop: 1 },
  shimmerMeta: { borderRadius: 4, height: 11, marginTop: 10, width: '48%' },
  shimmerTitle: { borderRadius: 4, height: 14, width: '62%' },
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
