import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type NotificationScreenProps = {
  onBack: () => void;
};

const notifications = [
  { icon: '▣', title: 'New job nearby', message: 'A delivery job is available in Paldi, Ahmedabad.', time: '2 min ago', unread: true },
  { icon: '✓', title: 'Bid accepted', message: 'Ravi Patel accepted your bid for Delivery - Documents.', time: '1 hour ago', unread: true },
  { icon: '₹', title: 'Payment received', message: '₹200 has been added to your wallet.', time: 'Yesterday', unread: false },
  { icon: '★', title: 'Rate your experience', message: 'Tell us about your recent job with Meena Shah.', time: '2 days ago', unread: false },
];

function NotificationScreen({ onBack }: NotificationScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Notifications" />
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.text }]}>Today</Text>
        {notifications.map(notification => (
          <Pressable key={notification.title} accessibilityRole="button" style={[styles.notification, { backgroundColor: notification.unread ? '#F6F0FF' : colors.card }]}>
            <View style={[styles.iconWrap, { backgroundColor: notification.unread ? '#E9D9FF' : '#F0F2F5' }]}>
              <Text style={[styles.icon, { color: notification.unread ? colors.primary : colors.textMuted }]}>{notification.icon}</Text>
            </View>
            <View style={styles.details}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
                {notification.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.message, { color: colors.textMuted }]}>{notification.message}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>{notification.time}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 11, paddingTop: 15 },
  details: { flex: 1, marginLeft: 11 },
  heading: { fontSize: rf(14), fontWeight: '800', marginBottom: 9 },
  icon: { fontSize: rf(16), fontWeight: '800' },
  iconWrap: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  message: { fontSize: rf(10), lineHeight: rf(14), marginTop: 4 },
  notification: { alignItems: 'flex-start', borderRadius: 10, elevation: 1, flexDirection: 'row', marginBottom: 9, padding: 11, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  screen: { flex: 1 },
  time: { fontSize: rf(8), marginTop: 6 },
  title: { flex: 1, fontSize: rf(12), fontWeight: '800' },
  titleRow: { alignItems: 'center', flexDirection: 'row' },
  unreadDot: { borderRadius: 4, height: 8, marginLeft: 7, width: 8 },
});

export default NotificationScreen;
