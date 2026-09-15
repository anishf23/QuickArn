import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { subscribeToMyChats, type ChatConversation } from '../../../services/chats';
import { updateCurrentUser } from '../../../services/firebaseUser';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';

type ChatListScreenProps = { onOpenChat: (chat: ChatConversation) => void };

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const timeLabel = (date?: Date) => {
  if (!date) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

function ChatListScreen({ onOpenChat }: ChatListScreenProps) {
  const { colors } = useAppTheme();
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => subscribeToMyChats(items => {
    setChats(items);
    setLoading(false);
  }, loadError => {
    setError(loadError.message || 'Unable to load chats.');
    setLoading(false);
  }), []);

  useEffect(() => {
    updateCurrentUser({ isChatOnline: false }).catch(() => {});
  }, []);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { backgroundColor: colors.card }]}><Text style={[styles.title, { color: colors.text }]}>Chats</Text></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      : error ? <View style={styles.center}><Text style={[styles.state, { color: '#DC2626' }]}>{error}</Text></View>
        : <FlatList data={chats} keyExtractor={item => item.chatId} contentContainerStyle={chats.length ? styles.list : styles.emptyList} ListEmptyComponent={<Text style={[styles.state, { color: colors.textMuted }]}>No chats yet. Start a chat after placing a bid.</Text>} renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => onOpenChat(item)} style={[styles.conversation, { backgroundColor: colors.card }]}><View style={styles.avatar}><Text style={styles.avatarInitials}>{initials(item.otherUserName)}</Text></View><View style={styles.conversationDetails}><View style={styles.nameRow}><Text style={[styles.name, { color: colors.text }]}>{item.otherUserName}</Text><Text style={[styles.time, { color: colors.textMuted }]}>{timeLabel(item.lastMessageAt)}</Text></View><Text numberOfLines={1} style={[styles.message, { color: colors.textMuted }]}>{item.lastMessage || item.jobTitle || 'Tap to start chatting'}</Text></View></Pressable>} />}
  </View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 23, height: 46, justifyContent: 'center', width: 46 }, avatarInitials: { color: '#64748B', fontSize: rf(13), fontWeight: '800' }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 }, conversation: { alignItems: 'center', borderRadius: 9, elevation: 1, flexDirection: 'row', marginBottom: 9, padding: 11, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 }, conversationDetails: { flex: 1, marginLeft: 11 }, emptyList: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 28 }, header: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, height: 49, justifyContent: 'center', paddingHorizontal: 13 }, list: { paddingHorizontal: 10, paddingTop: 11 }, message: { fontSize: rf(11), marginTop: 5 }, name: { flex: 1, fontSize: rf(14), fontWeight: '800' }, nameRow: { alignItems: 'center', flexDirection: 'row' }, screen: { flex: 1 }, state: { fontSize: rf(12), lineHeight: rf(18), textAlign: 'center' }, time: { fontSize: rf(9), marginLeft: 8 }, title: { fontSize: rf(18), fontWeight: '800' },
});

export default ChatListScreen;
