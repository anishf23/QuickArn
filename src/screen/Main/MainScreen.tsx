import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import HomeScreen from './HomeScreen';
import BrowseJobsScreen from './BrowseJobsScreen';
import JobDetailsScreen from './JobDetailsScreen';
import PlaceBidScreen from './PlaceBidScreen';
import MyBidsScreen from './Profile/MyBidsScreen';
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
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { updateCurrentUser } from '../../services/firebaseUser';
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
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [isBrowsingJobs, setIsBrowsingJobs] = useState(false);
  const [isViewingJobDetails, setIsViewingJobDetails] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isViewingMyBids, setIsViewingMyBids] = useState(false);
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
  const [isViewingPersonalProfile, setIsViewingPersonalProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const content =
    isViewingPersonalProfile ? (
      <PersonalProfileScreen onBack={() => setIsViewingPersonalProfile(false)} />
    ) : isEditingProfile ? (
      <EditProfileScreen onBack={() => setIsEditingProfile(false)} />
    ) : isVerifyingProfile ? (
      <VerificationScreen
        onBack={() => setIsVerifyingProfile(false)}
        onComplete={() => {
          setIsOnline(true);
          updateCurrentUser({ isOnline: true, isVerified: true }).catch(() => {});
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
        onSelectLocation={address => {
          setSelectedAddress(address);
          setRecentAddresses(addresses => [address, ...addresses.filter(item => item !== address)].slice(0, 5));
          setIsSelectingLocation(false);
        }}
      />
    ) : isViewingMyPortfolio ? (
      <MyEearningScreen onBack={() => setIsViewingMyPortfolio(false)} />
    ) : isViewingMyBids ? (
      <MyBidsScreen onBack={() => setIsViewingMyBids(false)} />
    ) : isPlacingBid ? (
      <PlaceBidScreen
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
      <JobDetailsScreen onBack={() => setIsViewingJobDetails(false)} onPlaceBid={() => setIsPlacingBid(true)} />
    ) : isBrowsingJobs ? (
      <BrowseJobsScreen onBack={() => setIsBrowsingJobs(false)} />
    ) : activeTab === 'Home' ? (
      <HomeScreen
        address={selectedAddress}
        isOnline={isOnline}
        onAvailabilityPress={() => setIsVerifyingProfile(true)}
        onJobPress={() => setIsViewingJobDetails(true)}
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
    ) : <ProfileScreen onEditProfile={() => setIsEditingProfile(true)} onLanguage={() => navigation.navigate('LanguageSelection', { mode: 'profile' })} onMyBids={() => setIsViewingMyBids(true)} onMyPortfolio={() => setIsViewingMyPortfolio(true)} onWallet={() => setIsViewingWallet(true)} />;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, (activeTab === 'Post' || isViewingSingleChat || isBrowsingJobs || isViewingJobDetails || isPlacingBid || isViewingMyBids || isViewingMyPortfolio || isSelectingLocation || isViewingNotifications || isViewingWallet || isVerifyingProfile || isEditingProfile || isViewingPersonalProfile) && styles.postContent]}>{content}</View>
      {activeTab !== 'Post' && !isViewingSingleChat && !isBrowsingJobs && !isViewingJobDetails && !isPlacingBid && !isViewingMyBids && !isViewingMyPortfolio && !isSelectingLocation && !isViewingNotifications && !isViewingWallet && !isVerifyingProfile && !isEditingProfile && !isViewingPersonalProfile && <View
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
                setIsViewingMyPortfolio(false);
                setIsViewingSingleChat(false);
                setIsSelectingLocation(false);
                setIsViewingNotifications(false);
                setIsViewingWallet(false);
                setIsVerifyingProfile(false);
                setIsEditingProfile(false);
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
  tabIcon: { height: rf(18), width: rf(18) },
  tabLabel: { fontSize: rf(12), fontWeight: '700', marginTop: 3 },
  title: { fontSize: rf(26), fontWeight: '800' },
});

export default MainScreen;
