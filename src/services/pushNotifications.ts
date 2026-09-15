import { getInitialNotification, getMessaging, onMessage, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';

export type PushNotificationPayload = {
  body: string;
  data: Record<string, string>;
  title: string;
};

type RemoteNotificationLike = {
  data?: Record<string, string | object>;
  notification?: { body?: string | null; title?: string | null };
};

const parsePushNotification = (message: RemoteNotificationLike): PushNotificationPayload => {
  const data = Object.entries(message.data ?? {}).reduce<Record<string, string>>((result, [key, value]) => {
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return result;
  }, {});
  return {
    body: message.notification?.body || data.body || 'You have a new notification.',
    data,
    title: message.notification?.title || data.title || 'QuickArn',
  };
};

const logPush = (event: string, message?: RemoteNotificationLike) => {
  if (__DEV__) {
    console.log(`[Push notification] ${event}`, message ?? '');
  }
};

const ANDROID_CHANNEL_ID = 'quickarn_general';

/** Shows a native notification for an FCM message received in the foreground. */
async function displayForegroundNotification(payload: PushNotificationPayload) {
  const settings = await notifee.requestPermission();
  const permissionGranted = settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
    || settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (!permissionGranted) {
    logPush('Foreground display skipped: notification permission is denied');
    return;
  }

  const channelId = await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'QuickArn notifications',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: payload.title,
    body: payload.body,
    data: payload.data,
    android: {
      channelId,
      // Uses the existing Android launcher resource as the notification icon.
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

/** Listens to foreground and notification-tap events from Firebase Cloud Messaging. */
export function subscribeToPushNotifications({ onForeground, onOpen }: {
  onForeground: (notification: PushNotificationPayload) => void;
  onOpen?: (notification: PushNotificationPayload) => void;
}) {
  const messaging = getMessaging();
  logPush('Listener registered');

  const unsubscribeForeground = onMessage(messaging, message => {
    logPush('Received while app is open', message);
    const payload = parsePushNotification(message);
    displayForegroundNotification(payload)
      .then(() => logPush('Foreground notification displayed'))
      .catch(error => {
        if (__DEV__) {
          console.warn('[Push notification] Unable to display foreground notification', error);
        }
      });
    onForeground(payload);
  });
  const unsubscribeOpen = onNotificationOpenedApp(messaging, message => {
    logPush('Opened from notification tap', message);
    onOpen?.(parsePushNotification(message));
  });

  getInitialNotification(messaging)
    .then(message => {
      if (message) {
        logPush('Opened from a closed app', message);
        onOpen?.(parsePushNotification(message));
      } else {
        logPush('No notification opened this app launch');
      }
    })
    .catch(error => {
      if (__DEV__) {
        console.warn('[Push notification] Unable to read initial notification', error);
      }
    });

  return () => {
    logPush('Listener removed');
    unsubscribeForeground();
    unsubscribeOpen();
  };
}
