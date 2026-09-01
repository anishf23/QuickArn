import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackHandler, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import HomeScreen from './HomeScreen';
import BrowseJobsScreen from './BrowseJobsScreen';
import JobDetailsScreen from './JobDetailsScreen';
import PlaceBidScreen from './PlaceBidScreen';
import MyBidsScreen from './Profile/MyBidsScreen';
import MyJobsScreen from './Profile/MyJobsScreen';
import MyEearningScreen from './Profile/MyEearningScreen';
import MyWalletScreen from './Profile/MyWalletScreen';
import VerificationScreen from './Profile/VerificationScreen';
import EditProfileScreen from './Profile/EditProfileScreen';
import PersonalProfileScreen from './Profile/PersonalProfileScreen';
import NotificationScreen from './NotificationScreen';
import ChatScreen from './Chat/ChatScreen';
import ChatListScreen from './Chat/ChatListScreen';
import LocationPickerScreen from './LocationPickerScreen';
import type { SavedAddress } from './LocationPickerScreen';
import PostJobScreen from './PostJobScreen';
import ProfileScreen from './ProfileScreen';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text, useLocalization } from '../../localization/AppLocalization';
import { getCachedUserProfile, signOutCurrentUser, subscribeToCurrentUserProfile, updateCurrentUser } from '../../services/firebaseUser';
import { closeJob, type PostedJob } from '../../services/jobs';
import { hp, rf } from '../../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;
type TabName = 'Home' | 'Post' | 'Chat' | 'Profile';

const tabs: Array<{ icon: number; name: TabName }> = [
  { icon: require('../../../images/home.png'), name: 'Home' },
  { icon: require('../../../images/add.png'), name: 'Post' },
  { icon: require('../../../images/chat.png'), name: 'Chat' },
  { icon: require('../../../images/user.png'), name: 'Profile' },
];

function MainScreen({ navigation, route }: Props) {
  const { colors, isDark } = useAppTheme();
  const { resetLanguage } = useLocalization();
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [isBrowsingJobs, setIsBrowsingJobs] = useState(false);
  const [isViewingJobDetails, setIsViewingJobDetails] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isViewingMyBids, setIsViewingMyBids] = useState(false);
  const [isViewingMyJobs, setIsViewingMyJobs] = useState(false);
  const [isViewingMyPortfolio, setIsViewingMyPortfolio] = useState(false);
  const [isViewingSingleChat, setIsViewingSingleChat] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(route.params.address);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [isViewingNotifications, setIsViewingNotifications] = useState(false);
  const [isViewingWallet, setIsViewingWallet] = useState(false);
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isViewingPersonalProfile, setIsViewingPersonalProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PostedJob | null>(null);
  const [isViewingOwnJob, setIsViewingOwnJob] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [userRole, setUserRole] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    getCachedUserProfile().then(profile => {
      setUserRole(profile?.role ?? '');
      setVerificationStatus(profile?.verificationStatus ?? '');
      setIsVerified(Boolean(profile?.isVerified));
      if (typeof profile?.latitude === 'number' && typeof profile.longitude === 'number') {
        setLocationCoordinates({ latitude: profile.latitude, longitude: profile.longitude });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => subscribeToCurrentUserProfile(profile => {
    setVerificationStatus(profile?.verificationStatus ?? '');
    setIsVerified(Boolean(profile?.isVerified));
  }), []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isViewingPersonalProfile) {
        setIsViewingPersonalProfile(false);
      } else if (isEditingJob) {
        setIsEditingJob(false);
        setIsViewingJobDetails(true);
      } else if (isEditingProfile) {
        setIsEditingProfile(false);
      } else if (isVerifyingProfile) {
        setIsVerifyingProfile(false);
      } else if (isViewingNotifications) {
        setIsViewingNotifications(false);
      } else if (isViewingWallet) {
        setIsViewingWallet(false);
      } else if (isSelectingLocation) {
        setIsSelectingLocation(false);
      } else if (isViewingMyPortfolio) {
        setIsViewingMyPortfolio(false);
      } else if (isViewingMyBids) {
        setIsViewingMyBids(false);
      } else if (isViewingMyJobs) {
        setIsViewingMyJobs(false);
      } else if (isPlacingBid) {
        setIsPlacingBid(false);
      } else if (isViewingJobDetails) {
        setIsViewingJobDetails(false);
        if (selectedJob && isViewingOwnJob) {
          setIsViewingMyJobs(true);
        }
        setSelectedJob(null);
      } else if (isBrowsingJobs) {
        setIsBrowsingJobs(false);
      } else if (isViewingSingleChat) {
        setIsViewingSingleChat(false);
      } else if (activeTab !== 'Home') {
        setActiveTab('Home');
      } else {
        // Home is the app root, so retain Android's normal back-to-exit behavior.
        return false;
      }

      return true;
    });

    return () => subscription.remove();
  }, [
    activeTab,
    isBrowsingJobs,
    isEditingProfile,
    isEditingJob,
    isPlacingBid,
    isSelectingLocation,
    isVerifyingProfile,
    isViewingJobDetails,
    isViewingMyBids,
    isViewingMyJobs,
    isViewingMyPortfolio,
    isViewingNotifications,
    isViewingPersonalProfile,
    isViewingSingleChat,
    isViewingWallet,
    isViewingOwnJob,
    selectedJob,
  ]);

  const handleLogout = async () => {
    try {
      await signOutCurrentUser();
    } catch {
      // Always remove local session data and return to Login.
    } finally {
      await resetLanguage().catch(() => {});
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const content =
    isViewingPersonalProfile ? (
      <PersonalProfileScreen onBack={() => setIsViewingPersonalProfile(false)} />
    ) : isEditingJob && selectedJob ? (
      <PostJobScreen
        editingJob={selectedJob}
        onBack={() => {
          setIsEditingJob(false);
          setIsViewingJobDetails(true);
        }}
        onJobSaved={() => {
          setIsEditingJob(false);
          setIsViewingJobDetails(false);
          setSelectedJob(null);
          setIsViewingMyJobs(true);
        }}
      />
    ) : isEditingProfile ? (
      <EditProfileScreen onBack={() => setIsEditingProfile(false)} onVerification={() => { setIsEditingProfile(false); setIsVerifyingProfile(true); }} />
    ) : isVerifyingProfile ? (
      <VerificationScreen
        onBack={() => setIsVerifyingProfile(false)}
        onComplete={() => {
          setIsOnline(false);
          updateCurrentUser({ isOnline: false, isVerified: false }).catch(() => {});
          setIsVerifyingProfile(false);
          setActiveTab('Home');
        }}
      />
    ) : isViewingNotifications ? (
      <NotificationScreen onBack={() => setIsViewingNotifications(false)} />
    ) : isViewingWallet ? (
      <MyWalletScreen onBack={() => setIsViewingWallet(false)} />
    ) : isSelectingLocation ? (
      <LocationPickerScreen
        onBack={() => setIsSelectingLocation(false)}
        recentAddresses={recentAddresses}
        savedAddresses={savedAddresses}
        onSaveAddress={savedAddress => {
          setSavedAddresses(addresses => [savedAddress, ...addresses.filter(item => item.label !== savedAddress.label)]);
        }}
        onSelectLocation={location => {
          setSelectedAddress(location.address);
          setLocationCoordinates({ latitude: location.latitude, longitude: location.longitude });
          setRecentAddresses(addresses => [location.address, ...addresses.filter(item => item !== location.address)].slice(0, 5));
          updateCurrentUser({
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          }).catch(() => {});
          setIsSelectingLocation(false);
        }}
      />
    ) : isViewingMyPortfolio ? (
      <MyEearningScreen onBack={() => setIsViewingMyPortfolio(false)} />
    ) : isViewingMyBids ? (
      <MyBidsScreen onBack={() => setIsViewingMyBids(false)} />
    ) : isViewingMyJobs ? (
      <MyJobsScreen
        onBack={() => setIsViewingMyJobs(false)}
        onOpenJob={job => {
          setSelectedJob(job);
          setIsViewingOwnJob(true);
          setIsViewingMyJobs(false);
          setIsViewingJobDetails(true);
        }}
      />
    ) : isPlacingBid ? (
      <PlaceBidScreen
        job={selectedJob}
        onBack={() => setIsPlacingBid(false)}
        onGoHome={() => {
          setActiveTab('Home');
          setIsPlacingBid(false);
          setIsViewingJobDetails(false);
        }}
        onGoToChat={() => {
          setActiveTab('Chat');
          setIsPlacingBid(false);
          setIsViewingJobDetails(false);
        }}
      />
    ) : isViewingJobDetails ? (
      <JobDetailsScreen
        job={selectedJob}
        isOwner={isViewingOwnJob}
        isOnline={isOnline}
        role={userRole}
        verificationStatus={verificationStatus}
        onBack={() => {
          setIsViewingJobDetails(false);
          if (selectedJob && isViewingOwnJob) {
            setIsViewingMyJobs(true);
          }
          setSelectedJob(null);
        }}
        onEditJob={() => {
          if (selectedJob) {
            setIsViewingJobDetails(false);
            setIsEditingJob(true);
          }
        }}
        onCloseJob={() => {
          if (!selectedJob) {
            return;
          }

          closeJob(selectedJob.id)
            .then(() => {
              setIsViewingJobDetails(false);
              setSelectedJob(null);
              setIsViewingOwnJob(false);
              setIsViewingMyJobs(true);
            })
            .catch(() => {});
        }}
        onPlaceBid={() => setIsPlacingBid(true)}
      />
    ) : isBrowsingJobs ? (
      <BrowseJobsScreen
        latitude={locationCoordinates.latitude}
        longitude={locationCoordinates.longitude}
        onBack={() => setIsBrowsingJobs(false)}
        onJobPress={job => {
          setSelectedJob(job);
          setIsViewingOwnJob(false);
          setIsViewingJobDetails(true);
        }}
      />
    ) : activeTab === 'Home' ? (
      <HomeScreen
        address={selectedAddress}
        isOnline={isOnline}
        latitude={locationCoordinates.latitude}
        longitude={locationCoordinates.longitude}
        role={userRole}
        verificationStatus={verificationStatus}
        onAvailabilityPress={() => {
          if (isVerified || verificationStatus === 'verified') {
            setIsOnline(current => {
              updateCurrentUser({ isOnline: !current }).catch(() => {});
              return !current;
            });
            return;
          }

          if (verificationStatus !== 'pending') {
            setIsVerifyingProfile(true);
          }
        }}
        onJobPress={job => {
          setSelectedJob(job);
          setIsViewingOwnJob(false);
          setIsViewingJobDetails(true);
        }}
        onLocationPress={() => setIsSelectingLocation(true)}
        onNotificationPress={() => setIsViewingNotifications(true)}
        onProfilePress={() => setIsViewingPersonalProfile(true)}
        onViewAll={() => setIsBrowsingJobs(true)}
        onWalletPress={() => setIsViewingWallet(true)}
      />
    ) : activeTab === 'Post' ? (
      <PostJobScreen onBack={() => setActiveTab('Home')} />
    ) : activeTab === 'Chat' ? (
      isViewingSingleChat ? <ChatScreen onBack={() => setIsViewingSingleChat(false)} /> : <ChatListScreen onOpenChat={() => setIsViewingSingleChat(true)} />
    ) : <ProfileScreen onEditProfile={() => setIsEditingProfile(true)} onLanguage={() => navigation.navigate('LanguageSelection', { mode: 'profile' })} onMyBids={() => setIsViewingMyBids(true)} onMyJobs={() => setIsViewingMyJobs(true)} onMyPortfolio={() => setIsViewingMyPortfolio(true)} onWallet={() => setIsViewingWallet(true)} onVerification={() => setIsVerifyingProfile(true)} onLogout={() => {
      handleLogout().catch(() => {});
    }} />;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, (activeTab === 'Post' || isViewingSingleChat || isBrowsingJobs || isViewingJobDetails || isPlacingBid || isViewingMyBids || isViewingMyJobs || isViewingMyPortfolio || isSelectingLocation || isViewingNotifications || isViewingWallet || isVerifyingProfile || isEditingProfile || isEditingJob || isViewingPersonalProfile) && styles.postContent]}>{content}</View>
      {activeTab !== 'Post' && !isViewingSingleChat && !isBrowsingJobs && !isViewingJobDetails && !isPlacingBid && !isViewingMyBids && !isViewingMyJobs && !isViewingMyPortfolio && !isSelectingLocation && !isViewingNotifications && !isViewingWallet && !isVerifyingProfile && !isEditingProfile && !isEditingJob && !isViewingPersonalProfile && <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.name;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                setActiveTab(tab.name);
                setIsBrowsingJobs(false);
                setIsViewingJobDetails(false);
                setIsPlacingBid(false);
                setIsViewingMyBids(false);
                setIsViewingMyJobs(false);
                setIsViewingMyPortfolio(false);
                setIsViewingSingleChat(false);
                setIsSelectingLocation(false);
                setIsViewingNotifications(false);
                setIsViewingWallet(false);
                setIsVerifyingProfile(false);
                setIsEditingProfile(false);
                setIsEditingJob(false);
                setIsViewingPersonalProfile(false);
              }}
              style={styles.tabButton}
            >
              <Image
                source={tab.icon}
                style={[
                  styles.tabIcon,
                  { tintColor: isActive ? brandColors.blue : colors.textMuted },
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? brandColors.blue : colors.textMuted },
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 0, paddingTop: hp(2) },
  description: { fontSize: rf(16), lineHeight: hp(3), marginTop: hp(1.5) },
  safeArea: { flex: 1 },
  postContent: { paddingTop: 0 },
  tabBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: hp(1.5),
    paddingTop: hp(1),
  },
  tabButton: { alignItems: 'center', flex: 1, paddingVertical: 5 },
  tabIcon: { height: rf(16), width: rf(16) },
  tabLabel: { fontSize: rf(12), fontWeight: '700', marginTop: 3 },
  title: { fontSize: rf(26), fontWeight: '800' },
});

export default MainScreen;
