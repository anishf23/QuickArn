import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

import { ensureInternetConnection } from './internetCheck';

export type WalletTransaction = {
  amount: number;
  createdAt?: Date;
  gstOnPlatformFee?: number;
  id: string;
  jobAmount?: number;
  netAmount?: number;
  platformFee?: number;
  title: string;
  type: 'credit' | 'debit';
};

type TimestampValue = { toDate?: () => Date };

const asDate = (value: unknown) => value && typeof (value as TimestampValue).toDate === 'function'
  ? (value as TimestampValue).toDate!()
  : value instanceof Date ? value : undefined;

/** Loads the signed-in user's server-managed wallet balance and transaction history. */
export async function getMyWallet() {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const database = getFirestore();
  const [walletSnapshot, transactionSnapshot] = await Promise.all([
    getDoc(doc(database, 'wallets', user.uid)),
    getDocs(query(collection(database, 'transactions'), where('uid', '==', user.uid))),
  ]);
  const wallet = walletSnapshot.data() as { balance?: unknown } | undefined;
  const transactions = transactionSnapshot.docs.map(document => {
    const data = document.data() as { amount?: unknown; createdAt?: unknown; gstOnPlatformFee?: unknown; jobAmount?: unknown; netAmount?: unknown; platformFee?: unknown; title?: unknown; type?: unknown };
    return {
      amount: typeof data.amount === 'number' ? data.amount : 0,
      createdAt: asDate(data.createdAt),
      gstOnPlatformFee: typeof data.gstOnPlatformFee === 'number' ? data.gstOnPlatformFee : undefined,
      id: document.id,
      jobAmount: typeof data.jobAmount === 'number' ? data.jobAmount : undefined,
      netAmount: typeof data.netAmount === 'number' ? data.netAmount : undefined,
      platformFee: typeof data.platformFee === 'number' ? data.platformFee : undefined,
      title: typeof data.title === 'string' ? data.title : 'Wallet transaction',
      type: data.type === 'debit' ? 'debit' : 'credit',
    } satisfies WalletTransaction;
  }).sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));

  return { balance: typeof wallet?.balance === 'number' ? wallet.balance : 0, transactions };
}
