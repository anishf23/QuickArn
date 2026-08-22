import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyBidsScreenProps = {
  onBack: () => void;
};

const bids = [
  { title: 'Need Delivery Boy for\nDocuments', amount: '₹200', bidDate: '25 May 2024', jobDate: '26 May 2024' },
  { title: 'Driver for 4 Hours\nCorporate Event', amount: '₹600', bidDate: '25 May 2024', jobDate: '28 May 2024' },
  { title: 'Need Plumber for\nResidential Fix', amount: '₹500', bidDate: '24 May 2024', jobDate: '25 May 2024' },
];

function MyBidsScreen({ onBack }: MyBidsScreenProps) {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState('Active');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="My Bids" />
      <View style={styles.tabs}>
        {['Active', 'Accepted', 'Completed'].map(tab => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textMuted }]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {bids.map(bid => (
          <View key={bid.title} style={[styles.bidCard, { backgroundColor: colors.card }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.bidTitle, { color: colors.text }]}>{bid.title}</Text>
              <Text style={[styles.amount, { color: colors.primary }]}>{bid.amount}</Text>
            </View>
            <View style={styles.datesRow}>
              <View>
                <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Bid Placed</Text>
                <Text style={[styles.dateValue, { color: colors.textMuted }]}>◷  {bid.bidDate}</Text>
              </View>
              <View style={styles.jobDate}>
                <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Job Date</Text>
                <Text style={[styles.dateValue, { color: colors.textMuted }]}>{bid.jobDate}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: rf(17), fontWeight: '800', marginLeft: 10 },
  bidCard: { borderRadius: 8, elevation: 3, marginBottom: 13, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5 },
  bidTitle: { flex: 1, fontSize: rf(16), fontWeight: '800', lineHeight: rf(21) },
  dateLabel: { fontSize: rf(10), fontWeight: '800' },
  dateValue: { fontSize: rf(9), marginTop: 4 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 23 },
  jobDate: { alignItems: 'flex-end' },
  list: { paddingHorizontal: 11, paddingTop: 14 },
  screen: { flex: 1 },
  tab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, height: 35, justifyContent: 'center' },
  tabActive: { borderBottomColor: '#7D00F5' },
  tabLabel: { fontSize: rf(11), fontWeight: '800' },
  tabs: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default MyBidsScreen;
