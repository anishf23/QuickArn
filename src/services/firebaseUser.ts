import { getAuth, signInWithPhoneNumber, type ConfirmationResult, type User } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getMessaging, getToken, onTokenRefresh, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type { AppLanguage } from '../localization/AppLocalization';

let phoneConfirmation: ConfirmationResult | null = null;
let unsubscribeTokenRefresh: (() => void) | null = null;

const userDocument = (uid: string) => doc(getFirestore(), 'users', uid);

export async function requestPhoneOtp(mobileNumber: string) {
  const normalizedNumber = mobileNumber.replace(/\D/g, '');
  phoneConfirmation = await signInWithPhoneNumber(getAuth(), `+91${normalizedNumber}`);
}

export async function confirmPhoneOtp(code: string) {
  if (!phoneConfirmation) {
    throw new Error('Your verification session expired. Please request a new OTP.');
  }

  const credential = await phoneConfirmation.confirm(code);
  phoneConfirmation = null;
  return credential.user;
}

export async function getFcmToken() {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  const firebaseMessaging = getMessaging();
  await registerDeviceForRemoteMessages(firebaseMessaging);
  return getToken(firebaseMessaging);
}

export async function createOrUpdateUserDocument(
  user: User,
  mobileNumber: string,
  language: AppLanguage,
) {
  const userReference = userDocument(user.uid);
  const snapshot = await getDoc(userReference);
  const fcmToken = await getFcmToken().catch(() => '');
  const now = serverTimestamp();

  if (!snapshot.exists) {
    await setDoc(userReference, {
      uid: user.uid,
      mobileNumber: `+91${mobileNumber.replace(/\D/g, '')}`,
      fullName: '',
      profileImage: '',
      role: 'customer',
      language,
      gender: '',
      city: '',
      state: '',
      address: '',
      latitude: null,
      longitude: null,
      isOnline: false,
      isActive: true,
      isProfileCompleted: false,
      isVerified: false,
      fcmToken,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await setDoc(userReference, {
      mobileNumber: `+91${mobileNumber.replace(/\D/g, '')}`,
      language,
      fcmToken,
      updatedAt: now,
    }, { merge: true });
  }

  startFcmTokenSync(user.uid);
}

export async function updateCurrentUser(fields: Record<string, unknown>) {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    return;
  }

  await setDoc(userDocument(currentUser.uid), {
    ...fields,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function startFcmTokenSync(uid: string) {
  unsubscribeTokenRefresh?.();
  unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), token => {
    setDoc(userDocument(uid), {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  });
}
