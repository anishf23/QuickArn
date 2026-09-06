import { getAuth } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import RazorpayCheckout from 'react-native-razorpay';

import { getCachedUserProfile } from './firebaseUser';

export type WalletTopUpQuote = {
  gatewayFee: number;
  gstOnGatewayFee: number;
  totalChargedAmount: number;
  walletCreditAmount: number;
};

type CreateTopUpResponse = WalletTopUpQuote & {
  keyId: string;
  orderId: string;
  totalAmountPaise: number;
};

type VerifyTopUpResponse = { balance: number; transactionId: string };

const toRupees = (value: number) => Math.round(value * 100) / 100;

/** Shows the customer fee estimate; the Cloud Function recalculates it authoritatively. */
export function getWalletTopUpQuote(amount: number): WalletTopUpQuote {
  const walletCreditAmount = toRupees(amount);
  const gatewayFee = toRupees(walletCreditAmount * 0.02);
  const gstOnGatewayFee = toRupees(gatewayFee * 0.18);
  return { gatewayFee, gstOnGatewayFee, totalChargedAmount: toRupees(walletCreditAmount + gatewayFee + gstOnGatewayFee), walletCreditAmount };
}

/** Creates, collects, and server-verifies a Razorpay wallet top-up. */
export async function addMoneyWithRazorpay(amount: number): Promise<VerifyTopUpResponse> {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const createTopUp = httpsCallable<{ amount: number }, CreateTopUpResponse>(getFunctions(undefined, 'asia-south1'), 'createWalletTopUp');
  const order = (await createTopUp({ amount })).data;
  const profile = await getCachedUserProfile();
  const checkout = await RazorpayCheckout.open({
    amount: order.totalAmountPaise,
    currency: 'INR',
    description: `Wallet credit ₹${order.walletCreditAmount.toFixed(2)}`,
    key: order.keyId,
    name: 'QuickArn',
    order_id: order.orderId,
    prefill: {
      contact: profile?.mobileNumber?.replace(/^\+91/, '') || user.phoneNumber?.replace(/^\+91/, ''),
      email: profile?.email,
      name: profile?.fullName,
    },
    theme: { color: '#7D00F5' },
  });

  const verifyTopUp = httpsCallable<{ orderId: string; paymentId: string; signature: string }, VerifyTopUpResponse>(getFunctions(undefined, 'asia-south1'), 'verifyWalletTopUp');
  return (await verifyTopUp({
    orderId: checkout.razorpay_order_id,
    paymentId: checkout.razorpay_payment_id,
    signature: checkout.razorpay_signature,
  })).data;
}
