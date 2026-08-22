import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyWalletScreenProps = {
  onBack: () => void;
};

const transactions = [
  { title: 'Job payment received', date: '25 May 2024', amount: '+₹200', positive: true },
  { title: 'Withdrawal to bank', date: '20 May 2024', amount: '-₹1,500', positive: false },
  { title: 'Job payment received', date: '18 May 2024', amount: '+₹300', positive: true },
];

function MyWalletScreen({ onBack }: MyWalletScreenProps) {
  const { colors } = useAppTheme();
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(2450);

  const addMoney = () => {
    const value = Number(amount);
    if (value > 0) {
      setBalance(current => current + value);
      setAmount('');
      setIsAddingMoney(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="My Wallet" />
      <View style={styles.content}>
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>₹{balance.toLocaleString('en-IN')}</Text>
          <Text style={styles.balanceHint}>Available to withdraw</Text>
          <Pressable accessibilityRole="button" onPress={() => setIsAddingMoney(true)} style={styles.addMoneyButton}>
            <Text style={[styles.addMoneyIcon, { color: colors.primary }]}>＋</Text>
            <Text style={[styles.addMoneyText, { color: colors.primary }]}>Add Money</Text>
          </Pressable>
        </View>

        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Transaction History</Text>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </View>
        <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
          {transactions.map((transaction, index) => (
            <View key={transaction.title + transaction.date} style={[styles.transaction, index < transactions.length - 1 && styles.divider]}>
              <View style={[styles.transactionIcon, { backgroundColor: transaction.positive ? '#DCFBEA' : '#ECEEF0' }]}><Text style={[styles.transactionSymbol, { color: transaction.positive ? '#159B62' : colors.textMuted }]}>{transaction.positive ? '₹' : '▤'}</Text></View>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text>
                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{transaction.date}</Text>
              </View>
              <Text style={[styles.amount, { color: transaction.positive ? '#159B62' : colors.text }]}>{transaction.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={isAddingMoney} onRequestClose={() => setIsAddingMoney(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.addMoneyModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Money</Text>
            <TextInput keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="Enter amount" placeholderTextColor={colors.textMuted} style={[styles.amountInput, { borderColor: colors.primary, color: colors.text }]} />
            <Pressable accessibilityRole="button" onPress={addMoney} style={[styles.confirmButton, { backgroundColor: colors.primary }]}><Text style={styles.confirmText}>Add to Wallet</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setIsAddingMoney(false)} style={styles.cancelButton}><Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addMoneyButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 7, flexDirection: 'row', marginTop: 18, paddingHorizontal: 13, paddingVertical: 8 },
  addMoneyIcon: { fontSize: rf(16), marginRight: 4 },
  addMoneyText: { fontSize: rf(11), fontWeight: '800' },
  addMoneyModal: { borderRadius: 15, elevation: 10, maxWidth: 340, padding: 21, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, width: '100%' },
  amount: { fontSize: rf(13), fontWeight: '800' },
  amountInput: { borderRadius: 7, borderWidth: 1, fontSize: rf(14), height: 43, marginTop: 17, paddingHorizontal: 12 },
  balance: { color: '#FFFFFF', fontSize: rf(27), fontWeight: '800', marginTop: 7 },
  balanceCard: { borderRadius: 14, elevation: 4, padding: 20, shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 8 },
  balanceHint: { color: '#EDE1FF', fontSize: rf(10), marginTop: 4 },
  balanceLabel: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '600' },
  cancelButton: { alignItems: 'center', marginTop: 13, padding: 6 },
  cancelText: { fontSize: rf(12), fontWeight: '700' },
  confirmButton: { alignItems: 'center', borderRadius: 7, height: 39, justifyContent: 'center', marginTop: 13 },
  confirmText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  divider: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth },
  historyCard: { borderRadius: 10, elevation: 2, marginTop: 12, overflow: 'hidden', shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  historyTitle: { fontSize: rf(14), fontWeight: '800' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.42)', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  modalTitle: { fontSize: rf(18), fontWeight: '800', textAlign: 'center' },
  screen: { flex: 1 },
  transaction: { alignItems: 'center', flexDirection: 'row', minHeight: 59, paddingHorizontal: 12 },
  transactionDate: { fontSize: rf(9), marginTop: 3 },
  transactionIcon: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  transactionInfo: { flex: 1, marginLeft: 10 },
  transactionSymbol: { fontSize: rf(14), fontWeight: '800' },
  transactionTitle: { fontSize: rf(11), fontWeight: '600' },
  viewAll: { fontSize: rf(10), fontWeight: '800' },
});

export default MyWalletScreen;
