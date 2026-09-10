import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getFirestore, onSnapshot, serverTimestamp, updateDoc, where, query } from '@react-native-firebase/firestore';

export type AppNotification = {
  bidId?: string;
  body: string;
  createdAt?: Date;
  id: string;
  isRead: boolean;
  jobId?: string;
  jobTitle?: string;
  recipientId: string;
  recipientRole?: string;
  title: string;
  type: string;
};

type TimestampValue = { toDate?: () => Date };
const asDate = (value: unknown) => value && typeof (value as TimestampValue).toDate === 'function'
  ? (value as TimestampValue).toDate!()
  : value instanceof Date ? value : undefined;

/** Subscribes to the signed-in user's notifications in Firestore. */
export function subscribeToMyNotifications(onChange: (items: AppNotification[]) => void, onError: (error: Error) => void) {
  const user = getAuth().currentUser;
  if (!user) {
    onChange([]);
    return () => {};
  }

  return onSnapshot(query(collection(getFirestore(), 'notifications'), where('recipientId', '==', user.uid)), snapshot => {
    const items = snapshot.docs.map(item => {
      const data = item.data() as Partial<AppNotification> & { createdAt?: unknown };
      return {
        bidId: typeof data.bidId === 'string' ? data.bidId : undefined,
        body: typeof data.body === 'string' ? data.body : '',
        createdAt: asDate(data.createdAt),
        id: item.id,
        isRead: data.isRead === true,
        jobId: typeof data.jobId === 'string' ? data.jobId : undefined,
        jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : undefined,
        recipientId: typeof data.recipientId === 'string' ? data.recipientId : user.uid,
        recipientRole: typeof data.recipientRole === 'string' ? data.recipientRole : undefined,
        title: typeof data.title === 'string' ? data.title : 'Notification',
        type: typeof data.type === 'string' ? data.type : 'general',
      } satisfies AppNotification;
    }).sort((first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0));
    onChange(items);
  }, onError);
}

/** Marks one notification read without changing its content. */
export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(getFirestore(), 'notifications', notificationId), { isRead: true, readAt: serverTimestamp() });
}
