import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getFirestore, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from '@react-native-firebase/firestore';

import { getCachedUserProfile } from './firebaseUser';
import { ensureInternetConnection } from './internetCheck';

export type ChatConversation = {
  chatId: string;
  createdAt?: Date;
  jobId?: string;
  jobTitle?: string;
  lastMessage: string;
  lastMessageAt?: Date;
  otherUserId: string;
  otherUserName: string;
};

export type ChatMessage = {
  chatId: string;
  createdAt?: Date;
  id: string;
  latitude?: number;
  longitude?: number;
  senderId: string;
  text: string;
  type: 'location' | 'text';
};

type TimestampValue = { toDate?: () => Date };
const asDate = (value: unknown) => value && typeof (value as TimestampValue).toDate === 'function'
  ? (value as TimestampValue).toDate!()
  : value instanceof Date ? value : undefined;

const chatIdForUsers = (firstUserId: string, secondUserId: string) => [firstUserId, secondUserId].sort().join('_');

/** Creates or returns a single direct chat shared by the two users. */
export async function createOrGetDirectChat(otherUserId: string, otherUserName: string, job?: { id: string; title: string }) {
  await ensureInternetConnection();
  const currentUser = getAuth().currentUser;
  if (!currentUser) throw new Error('Your login session has expired. Please sign in again.');
  if (!otherUserId || otherUserId === currentUser.uid) throw new Error('A chat recipient is required.');

  const currentProfile = await getCachedUserProfile();
  const chatId = chatIdForUsers(currentUser.uid, otherUserId);
  const reference = doc(getFirestore(), 'chats', chatId);
  await setDoc(reference, {
    chatId,
    participantIds: [currentUser.uid, otherUserId],
    participantNames: {
      [currentUser.uid]: currentProfile?.fullName?.trim() || 'User',
      [otherUserId]: otherUserName.trim() || 'User',
    },
    ...(job ? { jobId: job.id, jobTitle: job.title } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return chatId;
}

/** Subscribes to chats that include the signed-in user. */
export function subscribeToMyChats(onChange: (chats: ChatConversation[]) => void, onError: (error: Error) => void) {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    onChange([]);
    return () => {};
  }

  return onSnapshot(query(collection(getFirestore(), 'chats'), where('participantIds', 'array-contains', currentUser.uid)), snapshot => {
    const chats = snapshot.docs.map(item => {
      const data = item.data() as Record<string, unknown>;
      const participantIds = Array.isArray(data.participantIds) ? data.participantIds.filter((id): id is string => typeof id === 'string') : [];
      const otherUserId = participantIds.find(id => id !== currentUser.uid) ?? '';
      const names = data.participantNames && typeof data.participantNames === 'object' ? data.participantNames as Record<string, unknown> : {};
      return {
        chatId: typeof data.chatId === 'string' ? data.chatId : item.id,
        createdAt: asDate(data.createdAt),
        jobId: typeof data.jobId === 'string' ? data.jobId : undefined,
        jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : undefined,
        lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
        lastMessageAt: asDate(data.lastMessageAt),
        otherUserId,
        otherUserName: typeof names[otherUserId] === 'string' ? names[otherUserId] : 'User',
      } satisfies ChatConversation;
    }).sort((first, second) => (second.lastMessageAt?.getTime() ?? second.createdAt?.getTime() ?? 0) - (first.lastMessageAt?.getTime() ?? first.createdAt?.getTime() ?? 0));
    onChange(chats);
  }, error => onError(error as Error));
}

/** Subscribes to all messages in one direct chat. */
export function subscribeToChatMessages(chatId: string, onChange: (messages: ChatMessage[]) => void, onError: (error: Error) => void) {
  return onSnapshot(query(collection(getFirestore(), 'messages'), where('chatId', '==', chatId)), snapshot => {
    const messages = snapshot.docs.map(item => {
      const data = item.data() as Record<string, unknown>;
      return {
        chatId: typeof data.chatId === 'string' ? data.chatId : chatId,
        createdAt: asDate(data.createdAt),
        id: item.id,
        latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
        longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
        senderId: typeof data.senderId === 'string' ? data.senderId : '',
        text: typeof data.text === 'string' ? data.text : '',
        type: data.type === 'location' ? 'location' : 'text',
      } satisfies ChatMessage;
    }).sort((first, second) => (first.createdAt?.getTime() ?? 0) - (second.createdAt?.getTime() ?? 0));
    onChange(messages);
  }, error => onError(error as Error));
}

/** Creates a root `messages` document and updates the direct-chat preview. */
export async function sendChatMessage(chat: ChatConversation, text: string) {
  const value = text.trim();
  if (!value) return;
  await ensureInternetConnection();
  const currentUser = getAuth().currentUser;
  if (!currentUser) throw new Error('Your login session has expired. Please sign in again.');

  const database = getFirestore();
  const messageReference = doc(collection(database, 'messages'));
  const chatReference = doc(database, 'chats', chat.chatId);
  const batch = writeBatch(database);
  batch.set(messageReference, {
    chatId: chat.chatId,
    createdAt: serverTimestamp(),
    messageId: messageReference.id,
    recipientId: chat.otherUserId,
    senderId: currentUser.uid,
    text: value,
    type: 'text',
  });
  batch.set(chatReference, {
    lastMessage: value,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

/** Sends the current GPS coordinates as a location message. */
export async function sendChatLocation(chat: ChatConversation, latitude: number, longitude: number) {
  await ensureInternetConnection();
  const currentUser = getAuth().currentUser;
  if (!currentUser) throw new Error('Your login session has expired. Please sign in again.');

  const database = getFirestore();
  const messageReference = doc(collection(database, 'messages'));
  const chatReference = doc(database, 'chats', chat.chatId);
  const batch = writeBatch(database);
  batch.set(messageReference, {
    chatId: chat.chatId,
    createdAt: serverTimestamp(),
    latitude,
    longitude,
    messageId: messageReference.id,
    recipientId: chat.otherUserId,
    senderId: currentUser.uid,
    text: 'Current location',
    type: 'location',
  });
  batch.set(chatReference, {
    lastMessage: '📍 Shared a location',
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}
