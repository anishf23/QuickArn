import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, where } from '@react-native-firebase/firestore';

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

export type ProviderReview = {
  comment: string;
  createdAt?: Date;
  id: string;
  jobId: string;
  jobTitle: string;
  rating: number;
  reviewerId: string;
  reviewerName: string;
};

const asDate = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') return toDate.call(value) as Date;
  }
  return undefined;
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

/** Checks whether the signed-in customer has already reviewed a specific job. */
export async function hasCurrentUserReviewedJob(jobId: string) {
  const user = getAuth().currentUser;
  if (!user || !jobId) return false;
  await ensureInternetConnection();
  const snapshot = await getDoc(doc(getFirestore(), 'review', `${jobId}_${user.uid}`));
  return snapshot.exists();
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

/** Returns all reviews received by a provider, newest first. */
export async function getProviderReviews(providerId: string): Promise<ProviderReview[]> {
  await ensureInternetConnection();
  const snapshot = await getDocs(query(collection(getFirestore(), 'review'), where('providerId', '==', providerId)));
  return snapshot.docs.map(item => {
    const data = item.data();
    return {
      comment: typeof data.comment === 'string' ? data.comment : '',
      createdAt: asDate(data.createdAt),
      id: item.id,
      jobId: typeof data.jobId === 'string' ? data.jobId : '',
      jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : 'Job review',
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviewerId: typeof data.reviewerId === 'string' ? data.reviewerId : '',
      reviewerName: typeof data.reviewerName === 'string' ? data.reviewerName : 'Customer',
    } satisfies ProviderReview;
  }).sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}
