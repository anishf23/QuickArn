import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { hp, rf } from '../../../utils/responsive';

type ChatScreenProps = {
  onBack: () => void;
};

const messages = [
  { text: 'Hello, I have accepted your bid.', time: '10:00 AM', mine: false },
  { text: 'Thank you! I will be there on time.', time: '10:02 AM', mine: true },
  { text: 'Please call me when you reach.', time: '10:05 AM', mine: false },
  { text: 'Sure, I will call you.', time: '10:06 AM', mine: true },
  { text: 'Ok, thank you.', time: '10:08 AM', mine: false },
];

function ChatScreen({ onBack }: ChatScreenProps) {
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState('');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Image source={require('../../../../images/back.png')} resizeMode="contain" style={[styles.backIcon, { tintColor: colors.textMuted }]} />
        </Pressable>
        <View style={styles.avatar}><Text style={styles.avatarInitials}>RP</Text></View>
        <View style={styles.contactInfo}>
          <Text style={[styles.name, { color: colors.text }]}>Ravi Patel</Text>
          <Text style={[styles.status, { color: colors.textMuted }]}>Online</Text>
        </View>
      </View>

      <View style={styles.messages}>
        {messages.map(message => (
          <View key={`${message.time}-${message.text}`} style={[styles.messageGroup, message.mine && styles.messageGroupMine]}>
            <View style={[styles.bubble, message.mine ? [styles.myBubble, { backgroundColor: colors.primary }] : styles.theirBubble]}>
              <Text style={[styles.messageText, { color: message.mine ? '#FFFFFF' : colors.text }]}>{message.text}</Text>
            </View>
            <Text style={[styles.time, message.mine && styles.timeMine, { color: colors.textMuted }]}>{message.time}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.composer, { backgroundColor: colors.card }]}>
        <View style={styles.composerInputWrap}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            style={[styles.composerInput, { color: colors.text }]}
          />
          <Text style={[styles.attachment, { color: colors.textMuted }]}>⌕</Text>
        </View>
        <Pressable accessibilityLabel="Send message" accessibilityRole="button" style={[styles.sendButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attachment: { fontSize: rf(19), marginRight: 11, transform: [{ rotate: '-45deg' }] },
  avatar: { alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 16, height: 32, justifyContent: 'center', marginLeft: 2, width: 32 },
  avatarInitials: { color: '#6B7280', fontSize: rf(10), fontWeight: '800' },
  backButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 36 },
  backIcon: { height: 18, width: 18 },
  bubble: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 10 },
  composer: { alignItems: 'center', flexDirection: 'row', paddingBottom: hp(1.3), paddingHorizontal: 7, paddingTop: 8 },
  composerInput: { flex: 1, fontSize: rf(10), paddingVertical: 0 },
  composerInputWrap: { alignItems: 'center', backgroundColor: '#F1F2F4', borderRadius: 18, flex: 1, flexDirection: 'row', height: 35, paddingLeft: 12 },
  contactInfo: { marginLeft: 7 },
  header: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 48 },
  messageGroup: { alignSelf: 'flex-start', marginBottom: 15, maxWidth: '73%' },
  messageGroupMine: { alignSelf: 'flex-end' },
  messageText: { fontSize: rf(11), lineHeight: rf(16) },
  messages: { flex: 1, paddingHorizontal: 9, paddingTop: 13 },
  myBubble: { borderBottomRightRadius: 3 },
  name: { fontSize: rf(12), fontWeight: '800' },
  screen: { flex: 1 },
  sendButton: { alignItems: 'center', borderRadius: 18, height: 35, justifyContent: 'center', marginLeft: 7, width: 35 },
  sendIcon: { color: '#FFFFFF', fontSize: rf(17), marginLeft: -2 },
  status: { fontSize: rf(8), marginTop: 1 },
  theirBubble: { backgroundColor: '#ECEEF0', borderBottomLeftRadius: 3 },
  time: { fontSize: rf(7), marginLeft: 4, marginTop: 3 },
  timeMine: { marginRight: 4, textAlign: 'right' },
});

export default ChatScreen;
