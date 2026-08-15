import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

type HomeScreenProps = {
  address: string;
};

const stats = [
  { label: 'Total Earning', value: '₹1450' },
  { label: 'Jobs Completed', value: '32' },
  { label: 'Rating', value: '4.5' },
];

const jobs = [
  {
    title: 'Delivery - Documents',
    area: 'Paldi, Ahmedabad',
    price: '₹200',
    distance: '2 km',
  },
  {
    title: 'Cooking - Lunch',
    area: 'Bodakdev, Ahmedabad',
    price: '₹300',
    distance: '3 km',
  },
];

function HomeScreen({ address }: HomeScreenProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.primary }]}
      edges={['top']}
    >
    

      <View
        style={[
          styles.headerRow,
          { backgroundColor: colors.primary, paddingHorizontal: 0 },
        ]}
      >
        <View style={styles.locationTextWrap}>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationTitle}>Home</Text>
            <Text style={styles.locationArrow}>⌄</Text>
          </View>

          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.locationText}
          >
            {address || 'Ahmedabad, Gujarat'}
          </Text>
        </View>

        <View style={styles.notificationWrap}>
          <Image
            source={require('../../../images/bell.png')}
            style={styles.notificationIcon}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.container}>
        

        <View
          style={[
          styles.onlineCard,
          {
            backgroundColor: isDark ? '#DCEAFB' : '#E9F3FF',
            borderColor: isDark ? '#DCEAFB' : '#D9EDFF',
          },
        ]}
      >
        <Text style={[styles.onlineText, { color: colors.text }]}>You are Online</Text>

        <View style={styles.switchTrack}>
          <View style={styles.switchKnob} />
        </View>
      </View>

        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View
              key={stat.label}
              style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {stat.label}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Jobs</Text>
          <Text style={[styles.viewAll, { color: brandColors.blue }]}>View All</Text>
        </View>

        <View style={styles.jobsList}>
          {jobs.map(job => (
            <View
              key={job.title}
              style={[
              styles.jobCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>👤</Text>
            </View>

              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>
                  {job.title}
                </Text>
                <Text style={[styles.jobArea, { color: colors.textMuted }]}>
                  {job.area}
                </Text>
                <Text style={[styles.jobMeta, { color: colors.text }]}>
                  {job.price} - {job.distance}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarText: { fontSize: rf(20) },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 28,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: brandColors.blue,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: hp(2.5),
    paddingHorizontal: 0,
    paddingBottom: 6,
  },
  jobArea: {
    fontSize: rf(14),
    marginTop: 2,
  },
  jobCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 14,
  },
  jobInfo: {
    flex: 1,
    marginLeft: 14,
  },
  jobMeta: {
    fontSize: rf(15),
    fontWeight: '700',
    marginTop: 8,
  },
  jobTitle: {
    fontSize: rf(18),
    fontWeight: '700',
  },
  jobsList: {
    marginTop: 10,
  },
  locationTextWrap: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 0,
  },
  locationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 0,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '700',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: rf(13),
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.96,
  },
  locationArrow: {
    color: '#FFFFFF',
    fontSize: rf(18),
    fontWeight: '800',
    marginLeft: 6,
    marginTop: -2,
  },
  notificationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: hp(4),
    height: hp(4),
  },
  notificationIcon: {
    width: hp(3.5),
    height: hp(3.5),
    tintColor: '#FFFFFF',
  },
  onlineCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2.2),
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  onlineText: {
    fontSize: rf(18),
    fontWeight: '600',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: rf(26),
    fontWeight: '800',
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent:'center',
    alignItems:'center'
  },
  statLabel: {
    fontSize: rf(11),
    marginBottom: 8,
  },
  statValue: {
    fontSize: rf(22),
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: hp(2),
  },
  switchKnob: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 24,
    width: 24,
  },
  switchTrack: {
    alignItems: 'center',
    backgroundColor: brandColors.blue,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    width: 52,
    height: 30,
  },
  viewAll: {
    fontSize: rf(14),
    fontWeight: '700',
  },
});

export default HomeScreen;
