import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getCachedUserProfile } from '../../../services/firebaseUser';
import { getProviderCompletedJobs, type PostedJob } from '../../../services/jobs';
import { getMyWallet, type WalletTransaction } from '../../../services/wallet';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type Props = { onBack: () => void };
const PAGE_SIZE = 10;
const jobEarning = (job: PostedJob) => job.agreedTotalAmount ?? (job.budgetType === 'hourly' ? job.budget * (job.agreedHours ?? 1) : job.budget);
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const dateTime = (value?: Date) => value ? value.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function MyEearningScreen({ onBack }: Props) {
  const { colors } = useAppTheme();
  const [role, setRole] = useState('');
  const [jobs, setJobs] = useState<PostedJob[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    getCachedUserProfile().then(async profile => {
      if (!mounted) return;
      setRole(profile?.role ?? '');
      if (profile?.role !== 'provider') return;
      const [completedJobs, wallet] = await Promise.all([getProviderCompletedJobs(), getMyWallet()]);
      if (!mounted) return;
      setJobs(completedJobs);
      setTransactions(wallet.transactions);
      setBalance(wallet.balance);
    }).catch(reason => { if (mounted) setError(reason instanceof Error ? reason.message : 'Unable to load earnings.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    return jobs.reduce((result, job) => {
      const amount = jobEarning(job);
      result.total += amount;
      if (job.completedAt?.getMonth() === now.getMonth() && job.completedAt.getFullYear() === now.getFullYear()) result.month += amount;
      return result;
    }, { month: 0, total: 0 });
  }, [jobs]);
  const completedJobTransactions = useMemo(
    () => transactions.filter(transaction => transaction.type === 'credit' && transaction.title.startsWith('Job completed -')),
    [transactions],
  );
  const visibleTransactions = completedJobTransactions.slice(0, page * PAGE_SIZE);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <PostJobHeader onBack={onBack} title="My Earnings" />
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.state, { color: colors.textMuted }]}>Loading earnings...</Text></View>
      : role !== 'provider' ? <View style={styles.center}><Text style={[styles.emptyTitle, { color: colors.text }]}>Provider earnings only</Text><Text style={[styles.state, { color: colors.textMuted }]}>Complete provider verification to view earnings.</Text></View>
        : error ? <View style={styles.center}><Text style={[styles.state, { color: '#DC2626' }]}>{error}</Text></View>
          : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.balanceCard, { backgroundColor: colors.card }]}><Text style={[styles.label, { color: colors.textMuted }]}>Available Balance</Text><Text style={[styles.balance, { color: colors.text }]}>{money(balance)}</Text><Text style={[styles.hint, { color: colors.textMuted }]}>Available from completed job payments</Text></View>
            <View style={styles.summaryRow}><View style={[styles.summaryCard, { backgroundColor: colors.card }]}><Text style={[styles.label, { color: colors.textMuted }]}>This Month</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{money(totals.month)}</Text></View><View style={[styles.summaryCard, { backgroundColor: colors.card }]}><Text style={[styles.label, { color: colors.textMuted }]}>Total Earnings</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{money(totals.total)}</Text></View></View>
            <Text style={[styles.heading, { color: colors.text }]}>Completed Jobs ({jobs.length})</Text>
            {jobs.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>No completed jobs yet.</Text> : jobs.map(job => <View key={job.id} style={[styles.jobCard, { backgroundColor: colors.card }]}><View style={styles.jobTop}><Text numberOfLines={1} style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text><Text style={styles.jobTotal}>{money(jobEarning(job))}</Text></View><Text style={[styles.jobMeta, { color: colors.textMuted }]}>{job.budgetType === 'hourly' ? `₹${job.budget}/hr × ${job.agreedHours ?? 1} hr` : 'Fixed price'} · Completed {dateTime(job.completedAt)}</Text></View>)}
            <View style={styles.historyHeader}><Text style={[styles.heading, { color: colors.text }]}>Completed Job Transactions</Text><Text style={[styles.count, { color: colors.primary }]}>{completedJobTransactions.length} total</Text></View>
            <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>{visibleTransactions.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>No transactions yet.</Text> : visibleTransactions.map((transaction, index) => <View key={transaction.id} style={[styles.transaction, index < visibleTransactions.length - 1 && styles.divider]}><View style={[styles.icon, { backgroundColor: transaction.type === 'credit' ? '#DCFCE7' : '#FEE2E2' }]}><Text style={[styles.iconText, { color: transaction.type === 'credit' ? '#15803D' : '#DC2626' }]}>{transaction.type === 'credit' ? '₹' : '−'}</Text></View><View style={styles.transactionCopy}><Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text><Text style={[styles.transactionDate, { color: colors.textMuted }]}>{dateTime(transaction.createdAt)}</Text></View><Text style={[styles.transactionAmount, { color: transaction.type === 'credit' ? '#15803D' : '#DC2626' }]}>{transaction.type === 'credit' ? '+' : '-'}{money(transaction.amount)}</Text></View>)}</View>
            {visibleTransactions.length < completedJobTransactions.length ? <Pressable accessibilityRole="button" onPress={() => setPage(value => value + 1)} style={[styles.loadMore, { borderColor: colors.primary }]}><Text style={[styles.loadMoreText, { color: colors.primary }]}>Load More Transactions</Text></Pressable> : null}
          </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  balance: { fontSize: rf(25), fontWeight: '800', marginTop: 8 }, balanceCard: { borderRadius: 10, elevation: 2, padding: 16, shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, shadowRadius: 4 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 }, content: { padding: 12, paddingBottom: 25 }, count: { fontSize: rf(9), fontWeight: '800' }, divider: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth }, empty: { fontSize: rf(11), paddingVertical: 17, textAlign: 'center' }, emptyTitle: { fontSize: rf(16), fontWeight: '800', marginBottom: 7 }, heading: { fontSize: rf(14), fontWeight: '800' }, hint: { fontSize: rf(9), marginTop: 4 }, historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }, icon: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }, iconText: { fontSize: rf(15), fontWeight: '800' }, jobCard: { borderRadius: 8, elevation: 1, marginTop: 8, padding: 11, shadowColor: '#64748B', shadowOffset: { height: 1, width: 0 }, shadowOpacity: 0.08, shadowRadius: 3 }, jobMeta: { fontSize: rf(9), marginTop: 5 }, jobTitle: { flex: 1, fontSize: rf(12), fontWeight: '800' }, jobTop: { alignItems: 'center', flexDirection: 'row' }, jobTotal: { color: '#15803D', fontSize: rf(12), fontWeight: '800', marginLeft: 9 }, label: { fontSize: rf(10), fontWeight: '600' }, loadMore: { alignItems: 'center', borderRadius: 7, borderWidth: 1, height: 40, justifyContent: 'center', marginTop: 14 }, loadMoreText: { fontSize: rf(11), fontWeight: '800' }, screen: { flex: 1 }, state: { fontSize: rf(12), lineHeight: rf(17), marginTop: 10, textAlign: 'center' }, summaryCard: { borderRadius: 8, elevation: 2, flex: 1, marginHorizontal: 4, padding: 14, shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, shadowRadius: 4 }, summaryRow: { flexDirection: 'row', marginHorizontal: -4, marginTop: 16 }, summaryValue: { fontSize: rf(15), fontWeight: '800', marginTop: 7 }, transaction: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 12 }, transactionAmount: { fontSize: rf(11), fontWeight: '800', marginLeft: 7 }, transactionCard: { borderRadius: 8, elevation: 2, marginTop: 12, overflow: 'hidden', shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, shadowRadius: 4 }, transactionCopy: { flex: 1, marginLeft: 10 }, transactionDate: { fontSize: rf(8), marginTop: 3 }, transactionTitle: { fontSize: rf(10), fontWeight: '600' },
});

export default MyEearningScreen;
