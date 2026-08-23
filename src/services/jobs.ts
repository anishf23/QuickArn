import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, serverTimestamp, setDoc, Timestamp, where } from '@react-native-firebase/firestore';

import { ensureInternetConnection } from './internetCheck';

export type JobLocationDetails = {
  address: string;
  floorDetails: string;
  name: string;
  nearbyLocation: string;
  phoneNumber: string;
  latitude: number | null;
  longitude: number | null;
};

export type CreateJobInput = {
  budget: number;
  budgetType: 'fixed' | 'hourly';
  category: string;
  categoryId: string;
  closeDateTime: Date;
  description: string;
  dropDetails: JobLocationDetails;
  jobDateTime: Date;
  pickupDetails: JobLocationDetails;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
};

export type PostedJob = Omit<CreateJobInput, 'jobDateTime' | 'closeDateTime'> & {
  createdAt?: Date;
  id: string;
  jobId: string;
  jobDateTime: Date;
  closeDateTime: Date;
  ownerId: string;
  status: string;
};

type TimestampValue = { toDate?: () => Date };

const asDate = (value: unknown) => {
  if (value && typeof (value as TimestampValue).toDate === 'function') {
    return (value as TimestampValue).toDate!();
  }

  return value instanceof Date ? value : new Date();
};

/** Creates a public job document in Firestore collection `jobs`. */
export async function createJob(input: CreateJobInput) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const reference = doc(collection(getFirestore(), 'jobs'));
  await setDoc(reference, {
    jobId: reference.id,
    ownerId: user.uid,
    ownerMobileNumber: user.phoneNumber ?? '',
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    budget: input.budget,
    budgetCurrency: 'INR',
    budgetType: input.budgetType,
    jobDateTime: Timestamp.fromDate(input.jobDateTime),
    closeDateTime: Timestamp.fromDate(input.closeDateTime),
    pickupDetails: input.pickupDetails,
    dropDetails: input.dropDetails,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reference.id;
}

/** Loads jobs posted by the currently authenticated user. */
export async function getMyJobs(): Promise<PostedJob[]> {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const jobsQuery = query(collection(getFirestore(), 'jobs'), where('ownerId', '==', user.uid));
  const snapshot = await getDocs(jobsQuery);

  return snapshot.docs.map(document => {
    const data = document.data() as Omit<PostedJob, 'id' | 'jobId' | 'jobDateTime' | 'closeDateTime' | 'createdAt'> & {
      createdAt?: unknown;
      jobDateTime?: unknown;
      closeDateTime?: unknown;
      jobId?: unknown;
    };

    return {
      ...data,
      id: document.id,
      jobId: typeof data.jobId === 'string' ? data.jobId : document.id,
      jobDateTime: asDate(data.jobDateTime),
      closeDateTime: asDate(data.closeDateTime),
      createdAt: data.createdAt ? asDate(data.createdAt) : undefined,
    } as PostedJob;
  }).sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
}
