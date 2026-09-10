import { getAuth } from '@react-native-firebase/auth';
import { arrayUnion, collection, doc, getDocs, getFirestore, increment, query, runTransaction, serverTimestamp, Timestamp, where, writeBatch } from '@react-native-firebase/firestore';

import { getCachedUserProfile } from './firebaseUser';
import { ensureInternetConnection } from './internetCheck';
import { getJobsByIds, invalidateJobCaches, type PostedJob } from './jobs';

type CreateBidInput = {
  amount: number;
  availableDateTime: Date | null;
  expectedResponseTimeMinutes: number;
  isAvailableForJob: boolean;
  job: PostedJob;
  message: string;
};

export type JobBid = {
  agreedHours?: number;
  availableDateTime?: Date;
  availableForJob?: boolean;
  bidAmount: number;
  bidId: string;
  bidMessage: string;
  bidderId: string;
  bidderName: string;
  completedAt?: Date;
  createdAt?: Date;
  expectedResponseTimeMinutes?: number;
  expectedResponseTimeLabel?: string;
  jobId: string;
  status: string;
};

export type ProviderBid = JobBid & {
  job: PostedJob | null;
};

export type OwnerBidRequest = {
  bidAmount: number;
  bidId: string;
  bidderId: string;
  bidderName: string;
  createdAt?: Date;
  jobId: string;
  jobTitle: string;
  platformFee: number;
  requestId: string;
  status: string;
  totalPaid: number;
};

type TimestampValue = { toDate?: () => Date };

const asDate = (value: unknown) => {
  if (value && typeof (value as TimestampValue).toDate === 'function') {
    return (value as TimestampValue).toDate!();
  }
  return value instanceof Date ? value : undefined;
};

const mapBidDocument = (document: { data: () => unknown; id: string }): JobBid => {
  const data = document.data() as Partial<JobBid> & { availableDateTime?: unknown; completedAt?: unknown; createdAt?: unknown };
  return {
    bidAmount: typeof data.bidAmount === 'number' ? data.bidAmount : 0,
    bidId: typeof data.bidId === 'string' ? data.bidId : document.id,
    bidMessage: typeof data.bidMessage === 'string' ? data.bidMessage : '',
    bidderId: typeof data.bidderId === 'string' ? data.bidderId : '',
    bidderName: typeof data.bidderName === 'string' ? data.bidderName : 'Service Provider',
    availableDateTime: asDate(data.availableDateTime),
    availableForJob: typeof data.availableForJob === 'boolean' ? data.availableForJob : undefined,
    agreedHours: typeof data.agreedHours === 'number' ? data.agreedHours : undefined,
    createdAt: asDate(data.createdAt),
    completedAt: asDate(data.completedAt),
    expectedResponseTimeMinutes: typeof data.expectedResponseTimeMinutes === 'number' ? data.expectedResponseTimeMinutes : undefined,
    expectedResponseTimeLabel: typeof data.expectedResponseTimeLabel === 'string' ? data.expectedResponseTimeLabel : undefined,
    jobId: typeof data.jobId === 'string' ? data.jobId : '',
    status: typeof data.status === 'string' ? data.status : 'pending',
  };
};

const mapOwnerBidRequest = (document: { data: () => unknown; id: string }): OwnerBidRequest => {
  const data = document.data() as Partial<OwnerBidRequest> & { bidStatus?: unknown; createdAt?: unknown };
  return {
    bidAmount: typeof data.bidAmount === 'number' ? data.bidAmount : 0,
    bidId: typeof data.bidId === 'string' ? data.bidId : '',
    bidderId: typeof data.bidderId === 'string' ? data.bidderId : '',
    bidderName: typeof data.bidderName === 'string' ? data.bidderName : 'Service Provider',
    createdAt: asDate(data.createdAt),
    jobId: typeof data.jobId === 'string' ? data.jobId : '',
    jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : 'Job request',
    platformFee: typeof data.platformFee === 'number' ? data.platformFee : 0,
    requestId: typeof data.requestId === 'string' ? data.requestId : document.id,
    status: typeof data.status === 'string' ? data.status : typeof data.bidStatus === 'string' ? data.bidStatus : 'requested',
    totalPaid: typeof data.totalPaid === 'number' ? data.totalPaid : 0,
  };
};

/** Loads bid requests for jobs owned by the signed-in user. */
export async function getOwnerBidRequests(): Promise<OwnerBidRequest[]> {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');

  const snapshot = await getDocs(query(collection(getFirestore(), 'bidrequest'), where('jobOwnerId', '==', user.uid)));
  return snapshot.docs.map(mapOwnerBidRequest)
    .sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}

/** Loads job requests addressed to the signed-in service provider. */
export async function getProviderBidRequests(): Promise<OwnerBidRequest[]> {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');

  const snapshot = await getDocs(query(collection(getFirestore(), 'bidrequest'), where('bidderId', '==', user.uid)));
  return snapshot.docs.map(mapOwnerBidRequest)
    .sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}

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
export async function createBid({ amount, availableDateTime, expectedResponseTimeMinutes, isAvailableForJob, job, message }: CreateBidInput) {
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
    availableForJob: isAvailableForJob,
    availableDateTime: availableDateTime ? Timestamp.fromDate(availableDateTime) : null,
    expectedResponseTimeMinutes,
    expectedResponseTimeLabel: expectedResponseTimeMinutes < 60 ? `${expectedResponseTimeMinutes} min` : `${expectedResponseTimeMinutes / 60} hr`,
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

/** Accepts a bid. The current user must be the owner of the job. */
export async function acceptBid(job: PostedJob, bid: JobBid, agreedHours?: number) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  const jobId = job.jobId || job.id;
  if (!user || user.uid !== job.ownerId) {
    throw new Error('Only the job owner can accept a bid.');
  }
  if (job.status.toLowerCase() !== 'open') {
    throw new Error('This job is no longer open for bids.');
  }
  if (bid.status.toLowerCase() !== 'pending') {
    throw new Error('This bid has already been processed.');
  }
  const hourlyJob = job.budgetType === 'hourly';
  const totalAmount = hourlyJob ? job.budget * (agreedHours ?? 1) : bid.bidAmount;

  const database = getFirestore();
  const walletReference = doc(database, 'wallets', user.uid);
  const bidReference = doc(database, 'bidlist', bid.bidId);
  const jobReference = doc(database, 'jobs', jobId);
  const transactionReference = doc(collection(database, 'transactions'));
  const bidRequestReference = doc(collection(database, 'bidrequest'));
  const platformFee = Math.round(totalAmount * 0.05 * 100) / 100;
  const gstOnPlatformFee = Math.round(platformFee * 0.18 * 100) / 100;
  const walletDebitAmount = Math.round((totalAmount + platformFee + gstOnPlatformFee) * 100) / 100;

  await runTransaction(database, async transaction => {
    const walletSnapshot = await transaction.get(walletReference);
    const walletData = walletSnapshot.data() as { balance?: unknown } | undefined;
    const balance = typeof walletData?.balance === 'number' ? walletData.balance : 0;
    if (balance < walletDebitAmount) {
      throw new Error(`INSUFFICIENT_WALLET_BALANCE:${walletDebitAmount}`);
    }

    transaction.set(walletReference, {
      balance: Math.round((balance - walletDebitAmount) * 100) / 100,
      updatedAt: serverTimestamp(),
      uid: user.uid,
    }, { merge: true });
    transaction.update(bidReference, {
      status: 'requested',
      agreedHours: hourlyJob ? agreedHours ?? 1 : null,
      agreedTotalAmount: totalAmount,
      platformFee,
      gstOnPlatformFee,
      walletDebitAmount,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(jobReference, {
      acceptedBidId: bid.bidId,
      acceptedBidderId: bid.bidderId,
      acceptedBidderName: bid.bidderName,
      acceptedBidAmount: bid.bidAmount,
      agreedHours: hourlyJob ? agreedHours ?? 1 : null,
      agreedTotalAmount: totalAmount,
      platformFee,
      gstOnPlatformFee,
      status: 'requested',
      updatedAt: serverTimestamp(),
    });
    transaction.set(transactionReference, {
      transactionId: transactionReference.id,
      uid: user.uid,
      type: 'debit',
      title: `Job payment - ${job.title}`,
      jobId,
      jobTitle: job.title,
      bidId: bid.bidId,
      amount: walletDebitAmount,
      jobAmount: totalAmount,
      platformFee,
      gstOnPlatformFee,
      currency: 'INR',
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(bidRequestReference, {
      requestId: bidRequestReference.id,
      jobId,
      jobTitle: job.title,
      jobCategory: job.category,
      jobOwnerId: user.uid,
      jobOwnerName: job.pickupDetails.name || 'Job owner',
      bidderId: bid.bidderId,
      bidderName: bid.bidderName,
      bidId: bid.bidId,
      bidAmount: bid.bidAmount,
      budgetType: job.budgetType,
      agreedHours: hourlyJob ? agreedHours ?? 1 : null,
      jobAmount: totalAmount,
      platformFee,
      gstOnPlatformFee,
      totalPaid: walletDebitAmount,
      currency: 'INR',
      status: 'requested',
      bidStatus: 'requested',
      availableForJob: bid.availableForJob ?? false,
      availableDateTime: bid.availableDateTime ? Timestamp.fromDate(bid.availableDateTime) : null,
      expectedResponseTimeLabel: bid.expectedResponseTimeLabel ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  invalidateJobCaches();
}

/** Cancels a pending owner request, refunds its held amount, and reopens the job for reassignment. */
export async function cancelBidRequest(request: OwnerBidRequest) {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');
  if (request.status.toLowerCase() !== 'requested') throw new Error('This bid request can no longer be cancelled.');

  const database = getFirestore();
  const requestReference = doc(database, 'bidrequest', request.requestId);
  const jobReference = doc(database, 'jobs', request.jobId);
  const bidReference = doc(database, 'bidlist', request.bidId);
  const walletReference = doc(database, 'wallets', user.uid);
  const refundTransactionReference = doc(collection(database, 'transactions'));

  await runTransaction(database, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    const requestData = requestSnapshot.data() as { bidStatus?: unknown; jobOwnerId?: unknown; status?: unknown; totalPaid?: unknown } | undefined;
    if (!requestSnapshot.exists || requestData?.jobOwnerId !== user.uid) throw new Error('You cannot cancel this request.');
    const requestStatus = typeof requestData.status === 'string' ? requestData.status : requestData.bidStatus;
    if (!['requested', 'accepted', 'coming', 'job_started'].includes(String(requestStatus))) throw new Error('A completed job request cannot be cancelled.');
    const refundAmount = typeof requestData.totalPaid === 'number' ? requestData.totalPaid : request.totalPaid;
    const walletSnapshot = await transaction.get(walletReference);
    const walletData = walletSnapshot.data() as { balance?: unknown } | undefined;
    const balance = typeof walletData?.balance === 'number' ? walletData.balance : 0;

    transaction.set(walletReference, { balance: Math.round((balance + refundAmount) * 100) / 100, uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
    transaction.update(requestReference, { status: 'cancelled', bidStatus: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(bidReference, { status: 'pending', updatedAt: serverTimestamp() });
    transaction.update(jobReference, { status: 'open', acceptedBidId: null, acceptedBidderId: null, acceptedBidderName: null, acceptedBidAmount: null, agreedHours: null, agreedTotalAmount: null, platformFee: null, updatedAt: serverTimestamp() });
    transaction.set(refundTransactionReference, {
      transactionId: refundTransactionReference.id,
      uid: user.uid,
      type: 'credit',
      title: `Bid request refund - ${request.jobTitle}`,
      jobId: request.jobId,
      bidId: request.bidId,
      requestId: request.requestId,
      amount: refundAmount,
      currency: 'INR',
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  invalidateJobCaches();
}

/** Lets the requested provider accept or reject a job request. */
export async function respondToBidRequest(request: OwnerBidRequest, accept: boolean) {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');

  const database = getFirestore();
  const requestReference = doc(database, 'bidrequest', request.requestId);
  const bidReference = doc(database, 'bidlist', request.bidId);
  const jobReference = doc(database, 'jobs', request.jobId);

  await runTransaction(database, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    const data = requestSnapshot.data() as { bidStatus?: unknown; bidderId?: unknown; jobOwnerId?: unknown; status?: unknown; totalPaid?: unknown } | undefined;
    if (!requestSnapshot.exists || data?.bidderId !== user.uid) throw new Error('You cannot respond to this job request.');
    const currentStatus = typeof data?.status === 'string' ? data.status : data?.bidStatus;
    if (currentStatus !== 'requested') throw new Error('This job request has already been processed.');

    if (accept) {
      transaction.update(requestReference, { status: 'accepted', bidStatus: 'accepted', respondedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      transaction.update(bidReference, { status: 'accepted', providerAcceptedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      transaction.update(jobReference, { status: 'accepted', updatedAt: serverTimestamp() });
      return;
    }

    const ownerId = typeof data?.jobOwnerId === 'string' ? data.jobOwnerId : '';
    const refundAmount = typeof data?.totalPaid === 'number' ? data.totalPaid : request.totalPaid;
    if (!ownerId) throw new Error('The job owner is unavailable for this request.');
    const walletReference = doc(database, 'wallets', ownerId);
    const refundTransactionReference = doc(collection(database, 'transactions'));
    const walletSnapshot = await transaction.get(walletReference);
    const walletData = walletSnapshot.data() as { balance?: unknown } | undefined;
    const balance = typeof walletData?.balance === 'number' ? walletData.balance : 0;
    transaction.set(walletReference, { balance: Math.round((balance + refundAmount) * 100) / 100, uid: ownerId, updatedAt: serverTimestamp() }, { merge: true });
    transaction.update(requestReference, { status: 'rejected', bidStatus: 'rejected', respondedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(bidReference, { status: 'rejected', updatedAt: serverTimestamp() });
    transaction.update(jobReference, { status: 'open', acceptedBidId: null, acceptedBidderId: null, acceptedBidderName: null, acceptedBidAmount: null, agreedHours: null, agreedTotalAmount: null, platformFee: null, updatedAt: serverTimestamp() });
    transaction.set(refundTransactionReference, {
      transactionId: refundTransactionReference.id,
      uid: ownerId,
      type: 'credit',
      title: `Provider declined - ${request.jobTitle}`,
      jobId: request.jobId,
      bidId: request.bidId,
      requestId: request.requestId,
      amount: refundAmount,
      currency: 'INR',
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  invalidateJobCaches();
}

/** Advances an accepted provider request through the job progress lifecycle. */
export async function updateBidRequestProgress(request: OwnerBidRequest, nextStatus: 'coming' | 'job_started' | 'completed') {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');

  const allowedTransitions: Record<string, typeof nextStatus> = {
    accepted: 'coming',
    coming: 'job_started',
    job_started: 'completed',
  };
  const database = getFirestore();
  const requestReference = doc(database, 'bidrequest', request.requestId);
  const bidReference = doc(database, 'bidlist', request.bidId);
  const jobReference = doc(database, 'jobs', request.jobId);

  await runTransaction(database, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    const data = requestSnapshot.data() as { bidStatus?: unknown; bidderId?: unknown; gstOnPlatformFee?: unknown; jobAmount?: unknown; jobTitle?: unknown; platformFee?: unknown; status?: unknown } | undefined;
    if (!requestSnapshot.exists || data?.bidderId !== user.uid) throw new Error('You cannot update this job request.');
    const currentStatus = typeof data.status === 'string' ? data.status : data?.bidStatus;
    if (typeof currentStatus !== 'string' || allowedTransitions[currentStatus] !== nextStatus) {
      throw new Error('This job status cannot be updated at this time.');
    }
    const timestampField = nextStatus === 'coming' ? 'comingAt' : nextStatus === 'job_started' ? 'startedAt' : 'completedAt';
    const earningAmount = typeof data.jobAmount === 'number' ? data.jobAmount : 0;
    const platformFee = typeof data.platformFee === 'number' ? data.platformFee : 0;
    const gstOnPlatformFee = typeof data.gstOnPlatformFee === 'number' ? data.gstOnPlatformFee : 0;
    const walletReference = nextStatus === 'completed' ? doc(database, 'wallets', user.uid) : null;
    const earningTransactionReference = nextStatus === 'completed' ? doc(collection(database, 'transactions')) : null;
    const walletSnapshot = walletReference ? await transaction.get(walletReference) : null;
    const walletData = walletSnapshot?.data() as { balance?: unknown } | undefined;
    const balance = typeof walletData?.balance === 'number' ? walletData.balance : 0;
    transaction.update(requestReference, { status: nextStatus, bidStatus: nextStatus, [timestampField]: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(bidReference, { status: nextStatus, [timestampField]: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(jobReference, { status: nextStatus, [timestampField]: serverTimestamp(), updatedAt: serverTimestamp() });
    if (nextStatus === 'completed') {
      transaction.set(walletReference!, { balance: Math.round((balance + earningAmount) * 100) / 100, uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
      transaction.set(earningTransactionReference!, {
        transactionId: earningTransactionReference!.id,
        uid: user.uid,
        type: 'credit',
        title: `Job completed - ${typeof data.jobTitle === 'string' ? data.jobTitle : request.jobTitle}`,
        jobId: request.jobId,
        bidId: request.bidId,
        requestId: request.requestId,
        amount: earningAmount,
        jobAmount: earningAmount,
        platformFee,
        gstOnPlatformFee,
        netAmount: earningAmount,
        currency: 'INR',
        status: 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
  invalidateJobCaches();
}

/** Lets the assigned provider cancel before completion so the job can be reassigned. */
export async function cancelProviderBidRequest(request: OwnerBidRequest) {
  await ensureInternetConnection();
  const user = getAuth().currentUser;
  if (!user) throw new Error('Your login session has expired. Please sign in again.');

  const database = getFirestore();
  const requestReference = doc(database, 'bidrequest', request.requestId);
  const bidReference = doc(database, 'bidlist', request.bidId);
  const jobReference = doc(database, 'jobs', request.jobId);
  await runTransaction(database, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    const data = requestSnapshot.data() as { bidStatus?: unknown; bidderId?: unknown; jobOwnerId?: unknown; status?: unknown; totalPaid?: unknown } | undefined;
    if (!requestSnapshot.exists || data?.bidderId !== user.uid) throw new Error('You cannot cancel this job request.');
    const status = typeof data.status === 'string' ? data.status : data?.bidStatus;
    if (!['requested', 'accepted', 'coming', 'job_started'].includes(String(status))) throw new Error('A completed job cannot be cancelled.');
    const ownerId = typeof data.jobOwnerId === 'string' ? data.jobOwnerId : '';
    const refundAmount = typeof data.totalPaid === 'number' ? data.totalPaid : request.totalPaid;
    if (!ownerId) throw new Error('The job owner is unavailable for this request.');
    const walletReference = doc(database, 'wallets', ownerId);
    const refundTransactionReference = doc(collection(database, 'transactions'));
    const walletSnapshot = await transaction.get(walletReference);
    const walletData = walletSnapshot.data() as { balance?: unknown } | undefined;
    const balance = typeof walletData?.balance === 'number' ? walletData.balance : 0;

    transaction.set(walletReference, { balance: Math.round((balance + refundAmount) * 100) / 100, uid: ownerId, updatedAt: serverTimestamp() }, { merge: true });
    transaction.update(requestReference, { status: 'cancelled', bidStatus: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(bidReference, { status: 'cancelled', updatedAt: serverTimestamp() });
    transaction.update(jobReference, { status: 'open', acceptedBidId: null, acceptedBidderId: null, acceptedBidderName: null, acceptedBidAmount: null, agreedHours: null, agreedTotalAmount: null, platformFee: null, updatedAt: serverTimestamp() });
    transaction.set(refundTransactionReference, {
      transactionId: refundTransactionReference.id,
      uid: ownerId,
      type: 'credit',
      title: `Provider cancelled - ${request.jobTitle}`,
      jobId: request.jobId,
      bidId: request.bidId,
      requestId: request.requestId,
      amount: refundAmount,
      currency: 'INR',
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  invalidateJobCaches();
}
