import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyEearningScreenProps = {
  onBack: () => void;
};

const transactions = [
  { icon: '▣', title: 'Job Payment - Ravi Patel', date: '25 May 2024', amount: '+₹200', incoming: true },
  { icon: '▤', title: 'Withdrawal to Bank', date: '20 May 2024', amount: '-₹1,500', incoming: false },
  { icon: '▣', title: 'Job Payment - Meena Shah', date: '18 May 2024', amount: '+₹300', incoming: true },
];

function MyEearningScreen({ onBack }: MyEearningScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="My Earnings" />
      <View style={styles.content}>
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLabelRow}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Available Balance</Text>
              <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>
            </View>
          </View>
          <View style={styles.balanceBottomRow}>
            <Text style={[styles.balance, { color: colors.text }]}>₹2,450</Text>
            <Pressable accessibilityRole="button" style={[styles.withdrawButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>This Month</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹5,600</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Earnings</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹12,450</Text>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Transaction History</Text>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </View>
        <View style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
          {transactions.map((transaction, index) => (
            <View key={transaction.title} style={[styles.transaction, index < transactions.length - 1 && styles.transactionDivider]}>
              <View style={[styles.transactionIcon, transaction.incoming ? styles.incomingIcon : styles.outgoingIcon]}>
                <Text style={[styles.transactionSymbol, { color: transaction.incoming ? '#0C9C60' : '#64748B' }]}>{transaction.icon}</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text>
                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{transaction.date}</Text>
              </View>
              <Text style={[styles.transactionAmount, { color: transaction.incoming ? '#0C9C60' : colors.text }]}>{transaction.amount}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeBadge: { backgroundColor: '#D9F8E7', borderRadius: 8, marginLeft: 8, paddingHorizontal: 7, paddingVertical: 2 },
  activeText: { color: '#0C9C60', fontSize: rf(8), fontWeight: '700' },
  balance: { fontSize: rf(23), fontWeight: '800' },
  balanceBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  balanceCard: { borderRadius: 9, elevation: 2, padding: 15, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  balanceLabel: { fontSize: rf(10), fontWeight: '500' },
  balanceLabelRow: { alignItems: 'center', flexDirection: 'row' },
  balanceTopRow: { flexDirection: 'row' },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  historyTitle: { fontSize: rf(13), fontWeight: '800' },
  incomingIcon: { backgroundColor: '#D9F8E7' },
  outgoingIcon: { backgroundColor: '#ECEEF0' },
  screen: { flex: 1 },
  summaryCard: { borderRadius: 8, elevation: 2, flex: 1, marginHorizontal: 4, padding: 14, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  summaryLabel: { fontSize: rf(10) },
  summaryRow: { flexDirection: 'row', marginHorizontal: -4, marginTop: 18 },
  summaryValue: { fontSize: rf(15), fontWeight: '800', marginTop: 7 },
  transaction: { alignItems: 'center', flexDirection: 'row', minHeight: 52, paddingHorizontal: 12 },
  transactionAmount: { fontSize: rf(12), fontWeight: '800', marginLeft: 7 },
  transactionDate: { fontSize: rf(8), marginTop: 3 },
  transactionDetails: { flex: 1, marginLeft: 10 },
  transactionDivider: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth },
  transactionIcon: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  transactionSymbol: { fontSize: rf(15), fontWeight: '800' },
  transactionTitle: { fontSize: rf(11), fontWeight: '500' },
  transactionsCard: { borderRadius: 8, elevation: 2, marginTop: 13, overflow: 'hidden', shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  viewAll: { fontSize: rf(9), fontWeight: '800' },
  withdrawButton: { alignItems: 'center', borderRadius: 5, elevation: 2, height: 30, justifyContent: 'center', paddingHorizontal: 18, shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 3 },
  withdrawText: { color: '#FFFFFF', fontSize: rf(9), fontWeight: '800' },
});

export default MyEearningScreen;
