import { getAuth } from '@react-native-firebase/auth';
import { arrayUnion, collection, doc, getDocs, getFirestore, increment, query, serverTimestamp, where, writeBatch } from '@react-native-firebase/firestore';

import { getCachedUserProfile } from './firebaseUser';
import { ensureInternetConnection } from './internetCheck';
import { getJobsByIds, invalidateJobCaches, type PostedJob } from './jobs';

type CreateBidInput = {
  amount: number;
  job: PostedJob;
  message: string;
};

export type JobBid = {
  bidAmount: number;
  bidId: string;
  bidMessage: string;
  bidderId: string;
  bidderName: string;
  createdAt?: Date;
  jobId: string;
  status: string;
};

export type ProviderBid = JobBid & {
  job: PostedJob | null;
};

type TimestampValue = { toDate?: () => Date };

const asDate = (value: unknown) => {
  if (value && typeof (value as TimestampValue).toDate === 'function') {
    return (value as TimestampValue).toDate!();
  }
  return value instanceof Date ? value : undefined;
};

const mapBidDocument = (document: { data: () => unknown; id: string }): JobBid => {
  const data = document.data() as Partial<JobBid> & { createdAt?: unknown };
  return {
    bidAmount: typeof data.bidAmount === 'number' ? data.bidAmount : 0,
    bidId: typeof data.bidId === 'string' ? data.bidId : document.id,
    bidMessage: typeof data.bidMessage === 'string' ? data.bidMessage : '',
    bidderId: typeof data.bidderId === 'string' ? data.bidderId : '',
    bidderName: typeof data.bidderName === 'string' ? data.bidderName : 'Service Provider',
    createdAt: asDate(data.createdAt),
    jobId: typeof data.jobId === 'string' ? data.jobId : '',
    status: typeof data.status === 'string' ? data.status : 'pending',
  };
};

/** Loads the bid history for one job. */
export async function getJobBids(jobId: string): Promise<JobBid[]> {
  await ensureInternetConnection();
  const snapshot = await getDocs(query(
    collection(getFirestore(), 'bidlist'),
    where('jobId', '==', jobId),
  ));

  return snapshot.docs.map(mapBidDocument)
    .sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}

/** Loads the current provider's bids together with their related job records. */
export async function getMyBidsWithJobs(): Promise<ProviderBid[]> {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const snapshot = await getDocs(query(
    collection(getFirestore(), 'bidlist'),
    where('bidderId', '==', user.uid),
  ));
  const bids = snapshot.docs.map(mapBidDocument);
  const jobs = await getJobsByIds(bids.map(bid => bid.jobId));
  const jobsById = new Map(jobs.map(job => [job.jobId || job.id, job]));

  return bids
    .map(bid => ({ ...bid, job: jobsById.get(bid.jobId) ?? null }))
    .sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}

/** Returns totals for bids placed by one service provider. */
export async function getProviderBidStats(bidderId: string) {
  await ensureInternetConnection();
  const snapshot = await getDocs(query(
    collection(getFirestore(), 'bidlist'),
    where('bidderId', '==', bidderId),
  ));
  const bids = snapshot.docs.map(document => document.data() as { status?: unknown });

  return {
    accepted: bids.filter(bid => typeof bid.status === 'string' && bid.status.toLowerCase() === 'accepted').length,
    total: bids.length,
  };
}

/** Creates a pending bid document in the Firestore `bidlist` collection. */
export async function createBid({ amount, job, message }: CreateBidInput) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }
  if (user.uid === job.ownerId) {
    throw new Error('You cannot place a bid on your own job.');
  }

  const bidder = await getCachedUserProfile();
  if (bidder?.role !== 'provider' || bidder.verificationStatus !== 'accepted' || !bidder.isOnline) {
    throw new Error('You must be an online provider with accepted verification to place a bid.');
  }
  const reference = doc(collection(getFirestore(), 'bidlist'));
  const database = getFirestore();
  const batch = writeBatch(database);

  batch.set(reference, {
    bidId: reference.id,
    jobId: job.jobId || job.id,
    jobTitle: job.title,
    jobCategory: job.category,
    jobCategoryId: job.categoryId,
    jobOwnerId: job.ownerId,
    jobOwnerName: job.pickupDetails.name || 'Job owner',
    bidderId: user.uid,
    bidderName: bidder?.fullName?.trim() || 'Service Provider',
    bidderMobileNumber: bidder?.mobileNumber ?? user.phoneNumber ?? '',
    bidAmount: amount,
    bidCurrency: 'INR',
    bidMessage: message.trim(),
    status: 'pending',
    jobCloseDateTime: job.closeDateTime,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // This lightweight summary lets job lists show “Already bid” without loading every bid.
  batch.update(doc(database, 'jobs', job.jobId || job.id), {
    bidderIds: arrayUnion(user.uid),
    bidCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  invalidateJobCaches();

  return reference.id;
}
