import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInWithPhoneNumber, type ConfirmationResult, type User } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getMessaging, getToken, onTokenRefresh, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type { AppLanguage } from '../localization/AppLocalization';
import { ensureInternetConnection } from './internetCheck';

let phoneConfirmation: ConfirmationResult | null = null;
let unsubscribeTokenRefresh: (() => void) | null = null;
const USER_PROFILE_STORAGE_KEY = '@quickarn/user-profile';

const userDocument = (uid: string) => doc(getFirestore(), 'users', uid);

export type StoredUserProfile = {
  address?: string;
  about?: string;
  bankAccountDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  documentBackUrl?: string;
  documentFrontUrl?: string;
  documentType?: string;
  city?: string;
  email?: string;
  fullName?: string;
  gender?: string;
  fcmToken?: string;
  isActive?: boolean;
  isOnline?: boolean;
  isProfileCompleted?: boolean;
  isVerified?: boolean;
  language?: AppLanguage;
  latitude?: number | null;
  longitude?: number | null;
  mobileNumber?: string;
  profileImage?: string;
  role?: string;
  skills?: string[];
  state?: string;
  selfieUrl?: string;
  verificationStatus?: string;
  uid: string;
};

export async function getCachedUserProfile() {
  try {
    const storedProfile = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    return storedProfile ? (JSON.parse(storedProfile) as StoredUserProfile) : null;
  } catch {
    return null;
  }
}

async function cacheUserProfile(profile: StoredUserProfile) {
  await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function createDefaultUserProfile(
  uid: string,
  mobileNumber: string,
  language: AppLanguage,
  fcmToken = '',
): StoredUserProfile {
  const digits = mobileNumber.replace(/\D/g, '');
  const normalizedMobileNumber = digits.startsWith('91') && digits.length > 10
    ? `+${digits}`
    : digits
    ? `+91${digits}`
    : '';

  return {
    uid,
    mobileNumber: normalizedMobileNumber,
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
    email: '',
    about: '',
    skills: [],
  };
}

export async function requestPhoneOtp(mobileNumber: string) {
  await ensureInternetConnection();
  const normalizedNumber = mobileNumber.replace(/\D/g, '');
  phoneConfirmation = await signInWithPhoneNumber(getAuth(), `+91${normalizedNumber}`);
}

export async function confirmPhoneOtp(code: string) {
  await ensureInternetConnection();

  if (!phoneConfirmation) {
    throw new Error('Your verification session expired. Please request a new OTP.');
  }

  const credential = await phoneConfirmation.confirm(code);
  phoneConfirmation = null;
  return credential.user;
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  try {
    const auth = getAuth();

    if (typeof auth.onAuthStateChanged !== 'function') {
      callback(auth.currentUser ?? null);
      return () => {};
    }

    return auth.onAuthStateChanged(callback);
  } catch {
    // Firebase native modules may be unavailable in a stale development build.
    // Do not crash Splash; it will safely continue to Login.
    callback(null);
    return () => {};
  }
}

export async function signOutCurrentUser() {
  unsubscribeTokenRefresh?.();
  unsubscribeTokenRefresh = null;
  phoneConfirmation = null;

  try {
    await getAuth().signOut();
  } finally {
    await AsyncStorage.clear();
  }
}

export async function getFcmToken() {
  await ensureInternetConnection();

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
  await ensureInternetConnection();
  const userReference = userDocument(user.uid);
  const fcmToken = await getFcmToken().catch(() => '');
  const profile = createDefaultUserProfile(user.uid, mobileNumber, language, fcmToken);

  // OTPScreen calls this only after confirming that no profile exists. A direct
  // write avoids a second Firestore read and creates `users/{firebaseUid}`.
  await setDoc(userReference, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await cacheUserProfile(profile);

  startFcmTokenSync(user.uid);
}

export async function getExistingUserProfile(uid: string) {
  await ensureInternetConnection();
  const snapshot = await getDoc(userDocument(uid));

  if (!snapshot.exists()) {
    return null;
  }

  const profile = { ...(snapshot.data() as StoredUserProfile), uid };
  await cacheUserProfile(profile);
  return profile;
}

/** Listens to the signed-in user's Firestore profile for verification changes. */
export function subscribeToCurrentUserProfile(callback: (profile: StoredUserProfile | null) => void) {
  const user = getAuth().currentUser;
  if (!user) {
    callback(null);
    return () => {};
  }

  return onSnapshot(userDocument(user.uid), snapshot => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const profile = { ...(snapshot.data() as StoredUserProfile), uid: user.uid };
    cacheUserProfile(profile).catch(() => {});
    callback(profile);
  }, () => callback(null));
}

export async function updateCurrentUser(fields: Record<string, unknown>) {
  await ensureInternetConnection();
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const cachedProfile = await getCachedUserProfile();
  const userReference = userDocument(currentUser.uid);
  const snapshot = await getDoc(userReference);
  const documentExists = snapshot.exists();
  const profile = {
    ...(documentExists ? (snapshot.data() as StoredUserProfile) : createDefaultUserProfile(
      currentUser.uid,
      currentUser.phoneNumber ?? cachedProfile?.mobileNumber ?? '',
      cachedProfile?.language ?? 'en',
      cachedProfile?.fcmToken ?? '',
    )),
    ...fields,
    uid: currentUser.uid,
  } as StoredUserProfile;

  await setDoc(userReference, {
    ...profile,
    ...(documentExists ? {} : { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  }, { merge: documentExists });

  await cacheUserProfile({
    ...cachedProfile,
    ...profile,
  });
}

export function startFcmTokenSync(uid: string) {
  unsubscribeTokenRefresh?.();
  unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), token => {
    ensureInternetConnection()
      .then(() => setDoc(userDocument(uid), {
        fcmToken: token,
        updatedAt: serverTimestamp(),
      }, { merge: true }))
      .catch(() => {});
  });
}
