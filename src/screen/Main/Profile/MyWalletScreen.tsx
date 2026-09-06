import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useCustomAlert } from '../../../components/CustomAlert';
import { getMyWallet, type WalletTransaction } from '../../../services/wallet';
import { addMoneyWithRazorpay, getWalletTopUpQuote } from '../../../services/walletPayments';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type MyWalletScreenProps = {
  onBack: () => void;
};

function MyWalletScreen({ onBack }: MyWalletScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [balance, setBalance] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const enteredAmount = Number(amount);
  const quote = Number.isFinite(enteredAmount) && enteredAmount > 0 ? getWalletTopUpQuote(enteredAmount) : null;

  useEffect(() => {
    getMyWallet().then(wallet => {
      setBalance(wallet.balance);
      setTransactions(wallet.transactions);
    }).catch(() => {});
  }, []);

  const addMoney = async () => {
    if (!Number.isFinite(enteredAmount) || enteredAmount < 10 || enteredAmount > 50_000) {
      setAmountError('Enter an amount between ₹10 and ₹50,000.');
      return;
    }

    setAmountError('');
    setIsPaying(true);
    try {
      const result = await addMoneyWithRazorpay(enteredAmount);
      setBalance(result.balance);
      setTransactions(current => [{ amount: enteredAmount, createdAt: new Date(), id: result.transactionId, title: 'Wallet top-up', type: 'credit' }, ...current]);
      setAmount('');
      setIsAddingMoney(false);
      showAlert('Money added', 'Your payment was verified and your wallet balance has been updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment could not be completed. Please try again.';
      if (!/cancel/i.test(message)) {
        showAlert('Unable to add money', message);
      }
    } finally {
      setIsPaying(false);
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
          {transactions.length === 0 ? <Text style={[styles.emptyTransactions, { color: colors.textMuted }]}>No transactions yet.</Text> : transactions.map((transaction, index) => (
            <View key={transaction.id} style={[styles.transaction, index < transactions.length - 1 && styles.divider]}>
              <View style={[styles.transactionIcon, { backgroundColor: transaction.type === 'credit' ? '#DCFBEA' : '#ECEEF0' }]}><Text style={[styles.transactionSymbol, { color: transaction.type === 'credit' ? '#159B62' : colors.textMuted }]}>{transaction.type === 'credit' ? '₹' : '▤'}</Text></View>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text>
                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{transaction.createdAt ? transaction.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Just now'}</Text>
              </View>
              <Text style={[styles.amount, { color: transaction.type === 'credit' ? '#159B62' : colors.text }]}>{transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={isAddingMoney} onRequestClose={() => setIsAddingMoney(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.addMoneyModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Money</Text>
            <TextInput keyboardType="numeric" value={amount} onChangeText={value => { setAmount(value); setAmountError(''); }} placeholder="Enter wallet credit amount" placeholderTextColor={colors.textMuted} style={[styles.amountInput, { borderColor: amountError ? '#DC2626' : colors.primary, color: colors.text }]} />
            {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
            {quote ? <View style={styles.feeSummary}>
              <View style={styles.feeRow}><Text style={[styles.feeLabel, { color: colors.textMuted }]}>Wallet credit</Text><Text style={[styles.feeValue, { color: colors.text }]}>₹{quote.walletCreditAmount.toFixed(2)}</Text></View>
              <View style={styles.feeRow}><Text style={[styles.feeLabel, { color: colors.textMuted }]}>Gateway fee (2%)</Text><Text style={[styles.feeValue, { color: colors.text }]}>₹{quote.gatewayFee.toFixed(2)}</Text></View>
              <View style={styles.feeRow}><Text style={[styles.feeLabel, { color: colors.textMuted }]}>GST on fee (18%)</Text><Text style={[styles.feeValue, { color: colors.text }]}>₹{quote.gstOnGatewayFee.toFixed(2)}</Text></View>
              <View style={styles.feeRow}><Text style={[styles.feeTotal, { color: colors.text }]}>Total payable</Text><Text style={[styles.feeTotal, { color: colors.primary }]}>₹{quote.totalChargedAmount.toFixed(2)}</Text></View>
            </View> : null}
            <Pressable accessibilityRole="button" disabled={isPaying} onPress={addMoney} style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: isPaying ? 0.7 : 1 }]}><Text style={styles.confirmText}>{isPaying ? 'Opening Razorpay...' : 'Pay with Razorpay'}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={isPaying} onPress={() => setIsAddingMoney(false)} style={styles.cancelButton}><Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text></Pressable>
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
  emptyTransactions: { fontSize: rf(11), padding: 16, textAlign: 'center' },
  errorText: { color: '#DC2626', fontSize: rf(10), fontWeight: '600', marginTop: 5 },
  feeLabel: { fontSize: rf(10) },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  feeSummary: { backgroundColor: '#F8F5FF', borderRadius: 8, marginTop: 12, padding: 11 },
  feeTotal: { fontSize: rf(11), fontWeight: '800' },
  feeValue: { fontSize: rf(10), fontWeight: '700' },
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
