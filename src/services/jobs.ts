import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, endAt, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, startAt, Timestamp, where } from '@react-native-firebase/firestore';

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
  bidCount?: number;
  bidderIds?: string[];
  createdAt?: Date;
  geohash: string | null;
  id: string;
  jobId: string;
  jobDateTime: Date;
  closeDateTime: Date;
  ownerId: string;
  status: string;
};

export type NearbyJob = PostedJob & {
  distanceKm: number;
};

type TimestampValue = { toDate?: () => Date };

const GEOHASH_CHARACTERS = '0123456789bcdefghjkmnpqrstuvwxyz';
const nearbyJobsCache = new Map<string, NearbyJob[]>();
const myJobsCache = new Map<string, PostedJob[]>();

const getNearbyCacheKey = (latitude: number, longitude: number, radiusKm: number) => `${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}`;

/** Returns loaded non-empty nearby jobs without making a Firestore request. */
export function getCachedNearbyJobs(latitude: number | null, longitude: number | null, radiusKm = 20) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return undefined;
  }
  return nearbyJobsCache.get(getNearbyCacheKey(latitude, longitude, radiusKm));
}

/** Returns loaded non-empty current-user jobs without making a Firestore request. */
export function getCachedMyJobs() {
  const uid = getAuth().currentUser?.uid;
  return uid ? myJobsCache.get(uid) : undefined;
}

/** Clears job lists after a job or bid changes. */
export function invalidateJobCaches() {
  nearbyJobsCache.clear();
  myJobsCache.clear();
}

/** Encodes a coordinate for Firestore geohash range queries. */
const createGeohash = (latitude: number | null, longitude: number | null, precision = 9): string | null => {
  if (
    typeof latitude !== 'number'
    || typeof longitude !== 'number'
    || !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
  ) {
    return null;
  }

  let latitudeRange: [number, number] = [-90, 90];
  let longitudeRange: [number, number] = [-180, 180];
  let bit = 0;
  let characterValue = 0;
  let useLongitude = true;
  let geohash = '';

  while (geohash.length < precision) {
    const range = useLongitude ? longitudeRange : latitudeRange;
    const value = useLongitude ? longitude : latitude;
    const midpoint = (range[0] + range[1]) / 2;

    if (value >= midpoint) {
      characterValue = (characterValue << 1) + 1;
      range[0] = midpoint;
    } else {
      characterValue <<= 1;
      range[1] = midpoint;
    }

    useLongitude = !useLongitude;
    bit += 1;

    if (bit === 5) {
      geohash += GEOHASH_CHARACTERS[characterValue];
      bit = 0;
      characterValue = 0;
    }
  }

  return geohash;
};

const asDate = (value: unknown) => {
  if (value && typeof (value as TimestampValue).toDate === 'function') {
    return (value as TimestampValue).toDate!();
  }

  return value instanceof Date ? value : new Date();
};

const toRadians = (value: number) => value * (Math.PI / 180);

const getDistanceKm = (fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number) => {
  const earthRadiusKm = 6371;
  const latitudeDifference = toRadians(toLatitude - fromLatitude);
  const longitudeDifference = toRadians(toLongitude - fromLongitude);
  const distance = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude)) * Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance)));
};

const getGeohashBounds = (geohash: string) => {
  let latitudeRange: [number, number] = [-90, 90];
  let longitudeRange: [number, number] = [-180, 180];
  let useLongitude = true;

  for (const character of geohash) {
    const characterValue = GEOHASH_CHARACTERS.indexOf(character);
    if (characterValue < 0) {
      continue;
    }

    for (let bit = 4; bit >= 0; bit -= 1) {
      const range = useLongitude ? longitudeRange : latitudeRange;
      const midpoint = (range[0] + range[1]) / 2;

      if ((characterValue & (1 << bit)) !== 0) {
        range[0] = midpoint;
      } else {
        range[1] = midpoint;
      }
      useLongitude = !useLongitude;
    }
  }

  return { latitudeRange, longitudeRange };
};

const getNearbyGeohashPrefixes = (latitude: number, longitude: number, radiusKm: number) => {
  const prefix = createGeohash(latitude, longitude, 4);
  if (!prefix) {
    return [];
  }

  const { latitudeRange, longitudeRange } = getGeohashBounds(prefix);
  const latitudeStep = (latitudeRange[1] - latitudeRange[0]) / 2;
  const longitudeStep = (longitudeRange[1] - longitudeRange[0]) / 2;
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta = radiusKm / Math.max(111.32 * Math.cos(toRadians(latitude)), 0.01);
  const minLatitude = Math.max(-90, latitude - latitudeDelta);
  const maxLatitude = Math.min(90, latitude + latitudeDelta);
  const minLongitude = Math.max(-180, longitude - longitudeDelta);
  const maxLongitude = Math.min(180, longitude + longitudeDelta);
  const prefixes = new Set<string>();

  for (let currentLatitude = minLatitude; currentLatitude <= maxLatitude + latitudeStep / 10; currentLatitude += latitudeStep) {
    for (let currentLongitude = minLongitude; currentLongitude <= maxLongitude + longitudeStep / 10; currentLongitude += longitudeStep) {
      const currentPrefix = createGeohash(
        Math.min(currentLatitude, maxLatitude),
        Math.min(currentLongitude, maxLongitude),
        4,
      );
      if (currentPrefix) {
        prefixes.add(currentPrefix);
      }
    }
  }

  prefixes.add(createGeohash(maxLatitude, maxLongitude, 4)!);
  return [...prefixes];
};

type FirestoreJobDocument = {
  data: () => unknown;
  id: string;
};

const mapJobDocument = (document: FirestoreJobDocument): PostedJob => {
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
};

/** Creates a public job document in Firestore collection `jobs`. */
export async function createJob(input: CreateJobInput) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const reference = doc(collection(getFirestore(), 'jobs'));
  const geohash = createGeohash(input.pickupDetails.latitude, input.pickupDetails.longitude);
  await setDoc(reference, {
    jobId: reference.id,
    ownerId: user.uid,
    ownerMobileNumber: user.phoneNumber ?? '',
    category: input.category,
    categoryId: input.categoryId,
    geohash,
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
    bidCount: 0,
    bidderIds: [],
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  invalidateJobCaches();

  return reference.id;
}

/** Updates a job posted by the currently authenticated owner. */
export async function updateJob(jobId: string, input: CreateJobInput) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  await setDoc(doc(getFirestore(), 'jobs', jobId), {
    jobId,
    ownerId: user.uid,
    category: input.category,
    categoryId: input.categoryId,
    geohash: createGeohash(input.pickupDetails.latitude, input.pickupDetails.longitude),
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
    updatedAt: serverTimestamp(),
  }, { merge: true });
  invalidateJobCaches();

  return jobId;
}

/** Marks a job as closed without deleting its history. */
export async function closeJob(jobId: string) {
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  await setDoc(doc(getFirestore(), 'jobs', jobId), {
    status: 'closed',
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  invalidateJobCaches();
}

/** Loads open jobs within a radius of the supplied pickup-location coordinates. */
export async function getNearbyJobs(latitude: number, longitude: number, radiusKm = 20): Promise<NearbyJob[]> {
  const cacheKey = getNearbyCacheKey(latitude, longitude, radiusKm);
  const cachedJobs = nearbyJobsCache.get(cacheKey);
  if (cachedJobs && cachedJobs.length > 0) {
    return cachedJobs;
  }
  await ensureInternetConnection();

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }

  const prefixes = getNearbyGeohashPrefixes(latitude, longitude, radiusKm);
  if (prefixes.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(prefixes.map(prefix => getDocs(query(
    collection(getFirestore(), 'jobs'),
    orderBy('geohash'),
    startAt(prefix),
    endAt(`${prefix}\uf8ff`),
  ))));
  const uniqueDocuments = new Map<string, FirestoreJobDocument>();
  snapshots.forEach(snapshot => snapshot.docs.forEach(document => uniqueDocuments.set(document.id, document)));
  const now = Date.now();

  const jobs = [...uniqueDocuments.values()]
    .map(mapJobDocument)
    .filter(job => {
      const pickupLatitude = job.pickupDetails?.latitude;
      const pickupLongitude = job.pickupDetails?.longitude;
      return job.status.toLowerCase() === 'open'
        && job.closeDateTime.getTime() >= now
        && typeof pickupLatitude === 'number'
        && typeof pickupLongitude === 'number';
    })
    .map(job => ({
      ...job,
      distanceKm: getDistanceKm(latitude, longitude, job.pickupDetails.latitude as number, job.pickupDetails.longitude as number),
    }))
    .filter(job => job.distanceKm <= radiusKm)
    .sort((first, second) => first.distanceKm - second.distanceKm);
  if (jobs.length > 0) {
    nearbyJobsCache.set(cacheKey, jobs);
  }
  return jobs;
}

/** Loads jobs posted by the currently authenticated user. */
export async function getMyJobs(): Promise<PostedJob[]> {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Your login session has expired. Please sign in again.');
  }
  const cachedJobs = myJobsCache.get(user.uid);
  if (cachedJobs && cachedJobs.length > 0) {
    return cachedJobs;
  }
  await ensureInternetConnection();

  const jobsQuery = query(collection(getFirestore(), 'jobs'), where('ownerId', '==', user.uid));
  const snapshot = await getDocs(jobsQuery);

  const jobs = snapshot.docs.map(mapJobDocument)
    .sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
  if (jobs.length > 0) {
    myJobsCache.set(user.uid, jobs);
  }
  return jobs;
}

/** Loads specific job documents by ID for related data such as bid history. */
export async function getJobsByIds(jobIds: string[]): Promise<PostedJob[]> {
  await ensureInternetConnection();
  const uniqueIds = [...new Set(jobIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(uniqueIds.map(jobId => getDoc(doc(getFirestore(), 'jobs', jobId))));
  return snapshots
    .filter(snapshot => snapshot.exists())
    .map(snapshot => mapJobDocument({ id: snapshot.id, data: () => snapshot.data() }));
}
