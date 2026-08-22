import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';

type ChatListScreenProps = {
  onOpenChat: () => void;
};

const conversations = [
  { initials: 'RP', name: 'Ravi Patel', message: 'Sure, I will call you.', time: '10:06 AM', online: true },
  { initials: 'MS', name: 'Meena Shah', message: 'Thank you for the update.', time: 'Yesterday', online: false },
  { initials: 'AK', name: 'Amit Kumar', message: 'Can you reach by 5 PM?', time: 'Yesterday', online: false },
];

function ChatListScreen({ onOpenChat }: ChatListScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
      </View>

      <View style={styles.list}>
        {conversations.map(conversation => (
          <Pressable key={conversation.name} accessibilityRole="button" onPress={onOpenChat} style={[styles.conversation, { backgroundColor: colors.card }]}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}><Text style={styles.avatarInitials}>{conversation.initials}</Text></View>
              {conversation.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.conversationDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }]}>{conversation.name}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>{conversation.time}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.message, { color: colors.textMuted }]}>{conversation.message}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 23, height: 46, justifyContent: 'center', width: 46 },
  avatarInitials: { color: '#64748B', fontSize: rf(13), fontWeight: '800' },
  avatarWrap: { position: 'relative' },
  conversation: { alignItems: 'center', borderRadius: 9, elevation: 1, flexDirection: 'row', marginBottom: 9, padding: 11, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  conversationDetails: { flex: 1, marginLeft: 11 },
  header: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, height: 49, justifyContent: 'center', paddingHorizontal: 13 },
  list: { paddingHorizontal: 10, paddingTop: 11 },
  message: { fontSize: rf(11), marginTop: 5 },
  name: { flex: 1, fontSize: rf(14), fontWeight: '800' },
  nameRow: { alignItems: 'center', flexDirection: 'row' },
  onlineDot: { backgroundColor: '#16C784', borderColor: '#FFFFFF', borderRadius: 6, borderWidth: 2, bottom: -1, height: 12, position: 'absolute', right: -1, width: 12 },
  screen: { flex: 1 },
  time: { fontSize: rf(9), marginLeft: 8 },
  title: { fontSize: rf(18), fontWeight: '800' },
});

export default ChatListScreen;
