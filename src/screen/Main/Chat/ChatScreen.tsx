import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, Linking, PermissionsAndroid, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { getAuth } from '@react-native-firebase/auth';
import { useCustomAlert } from '../../../components/CustomAlert';
import { sendChatLocation, sendChatMessage, subscribeToChatMessages, type ChatConversation, type ChatMessage } from '../../../services/chats';
import { updateCurrentUser } from '../../../services/firebaseUser';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { hp, rf } from '../../../utils/responsive';

type ChatScreenProps = { chat: ChatConversation; onBack: () => void };

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const timeLabel = (date?: Date) => date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Sending...';

function ChatScreen({ chat, onBack }: ChatScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [sendingLocation, setSendingLocation] = useState(false);
  const currentUserId = getAuth().currentUser?.uid;
  const messageListRef = useRef<FlatList<ChatMessage>>(null);
  const fullScreenHeightRef = useRef(0);

  useEffect(() => subscribeToChatMessages(chat.chatId, items => {
    setMessages(items);
    setLoading(false);
  }, loadError => {
    setError(loadError.message || 'Unable to load messages.');
    setLoading(false);
  }), [chat.chatId]);

  useEffect(() => {
    updateCurrentUser({ isChatOnline: true }).catch(() => {});
    return () => {
      updateCurrentUser({ isChatOnline: false }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => messageListRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', event => setKeyboardHeight(event.endCoordinates.height));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const send = async () => {
    if (!draft.trim() || sending) return;
    const message = draft;
    setDraft('');
    setSending(true);
    try {
      await sendChatMessage(chat, message);
    } catch (sendError) {
      setDraft(message);
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const sendCurrentLocation = async () => {
    if (sendingLocation) return;
    try {
      if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const granted = permissions[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
          || permissions[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        if (!granted) throw new Error('Location permission is required to share your current location.');
      } else {
        const authorization = await Geolocation.requestAuthorization('whenInUse');
        if (authorization !== 'granted') throw new Error('Location permission is required to share your current location.');
      }

      setSendingLocation(true);
      const position = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          result => resolve({ latitude: result.coords.latitude, longitude: result.coords.longitude }),
          reject,
          { accuracy: { android: 'high', ios: 'best' }, enableHighAccuracy: true, forceRequestLocation: true, showLocationDialog: true, timeout: 20000 },
        );
      });
      await sendChatLocation(chat, position.latitude, position.longitude);
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Unable to share your location.');
    } finally {
      setSendingLocation(false);
    }
  };

  const openGoogleMaps = (message: ChatMessage) => {
    if (typeof message.latitude !== 'number' || typeof message.longitude !== 'number') return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${message.latitude},${message.longitude}`).catch(() => {
      setError('Unable to open Google Maps.');
    });
  };

  const confirmShareLocation = () => {
    showAlert('Share current location', `Send your current location to ${chat.otherUserName}?`, [
      { style: 'cancel', text: 'Cancel' },
      { onPress: () => { sendCurrentLocation().catch(() => {}); }, text: 'Share Location' },
    ]);
  };

  const needsAndroidKeyboardInset = Platform.OS === 'android'
    && keyboardHeight > 0
    && screenHeight >= fullScreenHeightRef.current - 80;
  const composerInset = needsAndroidKeyboardInset ? keyboardHeight : 0;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled onLayout={event => {
    const height = event.nativeEvent.layout.height;
    setScreenHeight(height);
    if (keyboardHeight === 0) fullScreenHeightRef.current = Math.max(fullScreenHeightRef.current, height);
  }} style={[styles.screen, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={styles.backButton}><Image source={require('../../../../images/back.png')} resizeMode="contain" style={[styles.backIcon, { tintColor: colors.textMuted }]} /></Pressable>
      <View style={styles.avatar}><Text style={styles.avatarInitials}>{initials(chat.otherUserName)}</Text></View>
      <View style={styles.contactInfo}><Text style={[styles.name, { color: colors.text }]}>{chat.otherUserName}</Text><Text style={[styles.status, { color: colors.textMuted }]}>{chat.jobTitle || 'Direct message'}</Text></View>
    </View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      : error && messages.length === 0 ? <View style={styles.center}><Text style={[styles.error, { color: '#DC2626' }]}>{error}</Text></View>
        : <FlatList ref={messageListRef} data={messages} keyExtractor={item => item.id} contentContainerStyle={messages.length ? styles.messages : styles.emptyMessages} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Start the conversation with {chat.otherUserName}.</Text>} onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: messages.length > 1 })} renderItem={({ item }) => {
          const mine = item.senderId === currentUserId;
          const locationMessage = item.type === 'location' && typeof item.latitude === 'number' && typeof item.longitude === 'number';
          return <View style={[styles.messageGroup, mine && styles.messageGroupMine]}>{locationMessage ? <Pressable accessibilityRole="link" accessibilityLabel="Open shared location in Google Maps" onPress={() => openGoogleMaps(item)} style={[styles.locationBubble, mine ? [styles.myBubble, { backgroundColor: colors.primary }] : styles.theirBubble]}><Text style={[styles.locationTitle, { color: mine ? '#FFFFFF' : colors.text }]}>📍 Current location</Text><Text style={[styles.locationCoordinates, { color: mine ? '#F1E8FF' : colors.textMuted }]}>{(item.latitude ?? 0).toFixed(5)}, {(item.longitude ?? 0).toFixed(5)}</Text><Text style={[styles.openMapText, { color: mine ? '#FFFFFF' : colors.primary }]}>Open in Google Maps</Text></Pressable> : <View style={[styles.bubble, mine ? [styles.myBubble, { backgroundColor: colors.primary }] : styles.theirBubble]}><Text style={[styles.messageText, { color: mine ? '#FFFFFF' : colors.text }]}>{item.text}</Text></View>}<Text style={[styles.time, mine && styles.timeMine, { color: colors.textMuted }]}>{timeLabel(item.createdAt)}</Text></View>;
        }} style={styles.messageList} />}
    <View style={[styles.composer, { backgroundColor: colors.card, marginBottom: composerInset }]}><Pressable accessibilityLabel="Share current location" accessibilityRole="button" disabled={sendingLocation} onPress={confirmShareLocation} style={[styles.locationButton, { backgroundColor: `${colors.primary}18`, opacity: sendingLocation ? 0.6 : 1 }]}><Text style={[styles.locationButtonText, { color: colors.primary }]}>{sendingLocation ? '…' : '⌖'}</Text></Pressable><View style={styles.composerInputWrap}><TextInput value={draft} onChangeText={setDraft} onFocus={() => requestAnimationFrame(() => messageListRef.current?.scrollToEnd({ animated: true }))} onSubmitEditing={send} placeholder="Type a message..." placeholderTextColor={colors.textMuted} returnKeyType="send" style={[styles.composerInput, { color: colors.text }]} /></View><Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!draft.trim() || sending} onPress={send} style={[styles.sendButton, { backgroundColor: colors.primary, opacity: !draft.trim() || sending ? 0.55 : 1 }]}><Text style={styles.sendIcon}>➤</Text></Pressable></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 16, height: 32, justifyContent: 'center', marginLeft: 2, width: 32 }, avatarInitials: { color: '#6B7280', fontSize: rf(10), fontWeight: '800' }, backButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 36 }, backIcon: { height: 18, width: 18 }, bubble: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 10 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 }, composer: { alignItems: 'center', flexShrink: 0, flexDirection: 'row', paddingBottom: hp(1.3), paddingHorizontal: 7, paddingTop: 8 }, composerInput: { flex: 1, fontSize: rf(11), paddingVertical: 0 }, composerInputWrap: { alignItems: 'center', backgroundColor: '#F1F2F4', borderRadius: 21, flex: 1, flexDirection: 'row', height: 42, paddingHorizontal: 14 }, contactInfo: { flex: 1, marginLeft: 7 }, empty: { fontSize: rf(11), textAlign: 'center' }, emptyMessages: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 28 }, error: { fontSize: rf(11), lineHeight: rf(17), textAlign: 'center' }, header: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 48 }, locationBubble: { borderRadius: 13, minWidth: 185, paddingHorizontal: 12, paddingVertical: 11 }, locationButton: { alignItems: 'center', borderRadius: 21, height: 42, justifyContent: 'center', marginRight: 7, width: 42 }, locationButtonText: { fontSize: rf(19), fontWeight: '800' }, locationCoordinates: { fontSize: rf(8), marginTop: 4 }, locationTitle: { fontSize: rf(11), fontWeight: '800' }, messageGroup: { alignSelf: 'flex-start', marginBottom: 15, maxWidth: '73%' }, messageGroupMine: { alignSelf: 'flex-end' }, messageList: { flex: 1 }, messageText: { fontSize: rf(11), lineHeight: rf(16) }, messages: { paddingHorizontal: 9, paddingTop: 13 }, myBubble: { borderBottomRightRadius: 3 }, name: { fontSize: rf(12), fontWeight: '800' }, openMapText: { fontSize: rf(9), fontWeight: '800', marginTop: 9 }, screen: { flex: 1 }, sendButton: { alignItems: 'center', borderRadius: 21, height: 42, justifyContent: 'center', marginLeft: 7, width: 42 }, sendIcon: { color: '#FFFFFF', fontSize: rf(17), marginLeft: -2 }, status: { fontSize: rf(8), marginTop: 1 }, theirBubble: { backgroundColor: '#ECEEF0', borderBottomLeftRadius: 3 }, time: { fontSize: rf(7), marginLeft: 4, marginTop: 3 }, timeMine: { marginRight: 4, textAlign: 'right' },
});

export default ChatScreen;
