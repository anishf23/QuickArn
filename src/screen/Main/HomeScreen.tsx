import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

type HomeScreenProps = { address: string; isOnline: boolean; onAvailabilityPress: () => void; onJobPress: () => void; onLocationPress: () => void; onNotificationPress: () => void; onViewAll: () => void; onWalletPress: () => void };

const stats = [
  { icon: '₹', iconColor: '#18B978', iconSurface: '#E5FAEF', label: 'Total Earning', value: '₹1450' },
  { icon: '▣', iconColor: brandColors.blue, iconSurface: '#F1E9FF', label: 'Jobs\nCompleted', value: '32' },
  { icon: '★', iconColor: '#E5AC12', iconSurface: '#FFF8DA', label: 'Rating', value: '4.5' },
];

const jobs = [
  { title: 'Delivery - Documents', area: 'Paldi, Ahmedabad', price: '₹200', distance: '2 km away' },
  { title: 'Cooking - Lunch', area: 'Bodakdev, Ahmedabad', price: '₹300', distance: '3 km away' },
];

function PersonAvatar() {
  return <View style={styles.avatarWrap}><View style={styles.avatarHead} /><View style={styles.avatarBody} /></View>;
}

function HomeScreen({ address, isOnline, onAvailabilityPress, onJobPress, onLocationPress, onNotificationPress, onViewAll, onWalletPress }: HomeScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLocation}>
          <Pressable accessibilityLabel="Change location" accessibilityRole="button" onPress={onLocationPress} style={styles.locationRow}>
            <Image source={require('../../../images/marker.png')} style={styles.locationIcon} resizeMode="contain" />
            <Text numberOfLines={1} style={styles.locationText}>{address || 'Select Location'}</Text>
            <Image source={require('../../../images/downarrow.png')} style={styles.locationArrow} resizeMode="contain" />
          </Pressable>
          <Text style={styles.screenTitle}>Home</Text>
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
        <View style={[styles.onlineCard, { backgroundColor: colors.card }]}>
          <View style={styles.onlineDetails}>
            <View style={styles.onlineIcon}><Text style={styles.onlinePerson}>●</Text></View>
            <View>
              <Text style={[styles.onlineTitle, { color: colors.text }]}>You are {isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={[styles.onlineSubtitle, { color: colors.textMuted }]}>{isOnline ? 'Ready to receive jobs' : 'Turn on to receive jobs'}</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Toggle online status"
            accessibilityRole="switch"
            accessibilityState={{ checked: isOnline }}
            onPress={onAvailabilityPress}
            style={[styles.switchTrack, isOnline ? styles.switchTrackOn : styles.switchTrackOff]}
          >
            <View style={[styles.switchKnob, isOnline ? styles.switchKnobOn : styles.switchKnobOff]} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.iconSurface }]}><Text style={[styles.statIconText, { color: stat.iconColor }]}>{stat.icon}</Text></View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Jobs</Text>
          <Pressable accessibilityRole="button" onPress={onViewAll}><Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text></Pressable>
        </View>

        <View style={styles.jobsList}>
          {jobs.map(job => (
            <Pressable key={job.title} onPress={onJobPress} style={[styles.jobCard, { backgroundColor: colors.card }]}>
              <PersonAvatar />
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                <Text style={[styles.jobArea, { color: colors.textMuted }]}>⌖ {job.area}</Text>
                <View style={styles.jobMetaRow}>
                  <Text style={[styles.jobPrice, { color: colors.text }]}>{job.price}</Text>
                  <View style={styles.distanceBadge}><Text style={[styles.distanceText, { color: colors.primary }]}>{job.distance}</Text></View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
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
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, paddingHorizontal: 14, paddingTop: 3 },
  headerActions: { alignItems: 'center', flexDirection: 'row' },
  headerLocation: { flex: 1, paddingRight: 8 },
  jobArea: { fontSize: rf(11), marginTop: 5 },
  jobCard: { alignItems: 'center', borderRadius: 12, elevation: 1, flexDirection: 'row', marginBottom: 13, padding: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  jobInfo: { flex: 1, marginLeft: 12 },
  jobMetaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  jobPrice: { fontSize: rf(12), fontWeight: '800' },
  jobTitle: { fontSize: rf(13), fontWeight: '700' },
  jobsList: { marginTop: 1 },
  locationArrow: { height: 12, marginLeft: 5, tintColor: '#FFFFFF', width: 12 },
  locationIcon: { height: 13, marginRight: 6, tintColor: '#FFFFFF', width: 13 },
  locationRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', minHeight: 18 },
  locationText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '600', maxWidth: 190, opacity: 0.92 },
  notificationIcon: { height: hp(2.8), tintColor: '#FFFFFF', width: hp(2.8) },
  notificationWrap: { alignItems: 'center', height: hp(4), justifyContent: 'center', width: hp(4) },
  onlineCard: { alignItems: 'center', borderRadius: 10, elevation: 4, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, shadowColor: '#5F20B5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7 },
  onlineDetails: { alignItems: 'center', flexDirection: 'row' },
  onlineIcon: { alignItems: 'center', backgroundColor: '#F0E8FF', borderRadius: 16, height: 32, justifyContent: 'center', marginRight: 9, width: 32 },
  onlinePerson: { color: brandColors.blue, fontSize: rf(18), lineHeight: rf(18) },
  onlineSubtitle: { fontSize: rf(9), marginTop: 2 },
  onlineTitle: { fontSize: rf(14), fontWeight: '800' },
  safeArea: { flex: 1 },
  screenTitle: { color: '#FFFFFF', fontSize: rf(19), fontWeight: '800', letterSpacing: 0.1, marginTop: 3 },
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
  viewAll: { fontSize: rf(11), fontWeight: '800' },
  walletIcon: { height: hp(2.7), tintColor: '#FFFFFF', width: hp(2.7) },
  walletWrap: { alignItems: 'center', height: hp(4), justifyContent: 'center', marginRight: 3, width: hp(4) },
});

export default HomeScreen;
