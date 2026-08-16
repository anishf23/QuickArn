import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import HomeScreen from './HomeScreen';
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

  const content =
    activeTab === 'Home' ? (
      <HomeScreen address={route.params.address} />
    ) : activeTab === 'Post' ? (
      <PostJobScreen onBack={() => setActiveTab('Home')} />
    ) : activeTab === 'Chat' ? (
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Chat</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Your conversations with service professionals will appear here.
        </Text>
      </View>
    ) : <ProfileScreen />;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, activeTab === 'Post' && styles.postContent]}>{content}</View>
      {activeTab !== 'Post' && <View
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
              onPress={() => setActiveTab(tab.name)}
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
