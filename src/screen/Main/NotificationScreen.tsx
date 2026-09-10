import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { markNotificationRead, subscribeToMyNotifications, type AppNotification } from '../../services/notifications';
import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type NotificationScreenProps = { onBack: () => void };

const typeIcon = (type: string) => {
  if (type.includes('bid')) return '▣';
  if (type.includes('payment') || type.includes('wallet')) return '₹';
  if (type.includes('review')) return '★';
  if (type.includes('job')) return '✓';
  return '•';
};
const formatTime = (date?: Date) => {
  if (!date) return 'Just now';
  const difference = Date.now() - date.getTime();
  if (difference < 60_000) return 'Just now';
  if (difference < 3_600_000) return `${Math.floor(difference / 60_000)} min ago`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)} hr ago`;
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function NotificationScreen({ onBack }: NotificationScreenProps) {
  const { colors } = useAppTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToMyNotifications(items => {
      setNotifications(items);
      setLoading(false);
    }, loadError => {
      setError(loadError.message || 'Unable to load notifications.');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openNotification = (item: AppNotification) => {
    if (!item.isRead) {
      setNotifications(current => current.map(notification => notification.id === item.id ? { ...notification, isRead: true } : notification));
      markNotificationRead(item.id).catch(() => {});
    }
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <PostJobHeader onBack={onBack} title="Notifications" />
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.stateText, { color: colors.textMuted }]}>Loading notifications...</Text></View>
      : error ? <View style={styles.center}><Text style={[styles.stateText, { color: '#DC2626' }]}>{error}</Text></View>
        : <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={notifications.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<Text style={[styles.stateText, { color: colors.textMuted }]}>No notifications yet.</Text>}
          renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => openNotification(item)} style={[styles.notification, { backgroundColor: item.isRead ? colors.card : `${colors.primary}12` }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.isRead ? '#F0F2F5' : `${colors.primary}22` }]}><Text style={[styles.icon, { color: item.isRead ? colors.textMuted : colors.primary }]}>{typeIcon(item.type)}</Text></View>
            <View style={styles.details}><View style={styles.titleRow}><Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>{!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}</View><Text style={[styles.message, { color: colors.textMuted }]}>{item.body}</Text>{item.jobTitle ? <Text numberOfLines={1} style={[styles.jobTitle, { color: colors.primary }]}>{item.jobTitle}</Text> : null}<Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text></View>
          </Pressable>}
        />}
  </View>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 }, details: { flex: 1, marginLeft: 11 }, emptyList: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 28 }, icon: { fontSize: rf(16), fontWeight: '800' }, iconWrap: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 }, jobTitle: { fontSize: rf(9), fontWeight: '700', marginTop: 4 }, list: { paddingHorizontal: 11, paddingTop: 15 }, message: { fontSize: rf(10), lineHeight: rf(14), marginTop: 4 }, notification: { alignItems: 'flex-start', borderColor: 'transparent', borderRadius: 10, borderWidth: 0, elevation: 0, flexDirection: 'row', marginBottom: 9, padding: 11, shadowOpacity: 0, shadowRadius: 0 }, screen: { flex: 1 }, stateText: { fontSize: rf(12), lineHeight: rf(17), marginTop: 10, textAlign: 'center' }, time: { fontSize: rf(8), marginTop: 6 }, title: { flex: 1, fontSize: rf(12), fontWeight: '800' }, titleRow: { alignItems: 'center', flexDirection: 'row' }, unreadDot: { borderRadius: 4, height: 8, marginLeft: 7, width: 8 },
});

export default NotificationScreen;
