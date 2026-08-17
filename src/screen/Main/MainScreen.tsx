import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import HomeScreen from './HomeScreen';
import BrowseJobsScreen from './BrowseJobsScreen';
import JobDetailsScreen from './JobDetailsScreen';
import PlaceBidScreen from './PlaceBidScreen';
import MyBidsScreen from './Profile/MyBidsScreen';
import ChatScreen from './Chat/ChatScreen';
import PostJobScreen from './PostJobScreen';
import ProfileScreen from './ProfileScreen';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;
type TabName = 'Home' | 'Post' | 'Chat' | 'Profile';

const tabs: Array<{ icon: string; name: TabName }> = [
  { icon: '⌂', name: 'Home' },
  { icon: '+', name: 'Post' },
  { icon: '◌', name: 'Chat' },
  { icon: '◉', name: 'Profile' },
];

function MainScreen({ route }: Props) {
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [isBrowsingJobs, setIsBrowsingJobs] = useState(false);
  const [isViewingJobDetails, setIsViewingJobDetails] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isViewingMyBids, setIsViewingMyBids] = useState(false);

  const content =
    isViewingMyBids ? (
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
      <HomeScreen address={route.params.address} onJobPress={() => setIsViewingJobDetails(true)} onViewAll={() => setIsBrowsingJobs(true)} />
    ) : activeTab === 'Post' ? (
      <PostJobScreen onBack={() => setActiveTab('Home')} />
    ) : activeTab === 'Chat' ? (
      <ChatScreen onBack={() => setActiveTab('Home')} />
    ) : <ProfileScreen onMyBids={() => setIsViewingMyBids(true)} />;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, (activeTab === 'Post' || activeTab === 'Chat' || isBrowsingJobs || isViewingJobDetails || isPlacingBid || isViewingMyBids) && styles.postContent]}>{content}</View>
      {activeTab !== 'Post' && activeTab !== 'Chat' && !isBrowsingJobs && !isViewingJobDetails && !isPlacingBid && !isViewingMyBids && <View
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
              }}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.tabIcon,
                  { color: isActive ? brandColors.blue : colors.textMuted },
                ]}
              >
                {tab.icon}
              </Text>
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
  tabIcon: { fontSize: rf(25), fontWeight: '700' },
  tabLabel: { fontSize: rf(12), fontWeight: '700', marginTop: 3 },
  title: { fontSize: rf(28), fontWeight: '800' },
});

export default MainScreen;
