import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, serverTimestamp, setDoc, where } from '@react-native-firebase/firestore';

import { getCachedUserProfile } from './firebaseUser';
import { ensureInternetConnection } from './internetCheck';

type CreateReviewInput = {
  comment: string;
  jobId: string;
  jobTitle: string;
  providerId: string;
  providerName: string;
  rating: number;
};

/** Saves one customer review for a provider and job. */
export async function createProviderReview({ comment, jobId, jobTitle, providerId, providerName, rating }: CreateReviewInput) {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating between 1 and 5 stars.');

  const profile = await getCachedUserProfile();
  const reference = doc(getFirestore(), 'review', `${jobId}_${user.uid}`);
  await setDoc(reference, {
    reviewId: reference.id,
    jobId,
    jobTitle,
    reviewerId: user.uid,
    reviewerName: profile?.fullName?.trim() || 'Customer',
    providerId,
    providerName,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Returns the rating summary for a provider. */
export async function getProviderReviewStats(providerId: string) {
  await ensureInternetConnection();
  const snapshot = await getDocs(query(collection(getFirestore(), 'review'), where('providerId', '==', providerId)));
  const ratings = snapshot.docs.map(item => item.data().rating).filter((rating): rating is number => typeof rating === 'number');
  return {
    count: ratings.length,
    average: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
  };
}
