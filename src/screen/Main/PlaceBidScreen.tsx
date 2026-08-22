import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type PlaceBidScreenProps = {
  onBack: () => void;
  onGoToChat: () => void;
  onGoHome: () => void;
};

function PlaceBidScreen({ onBack, onGoHome, onGoToChat }: PlaceBidScreenProps) {
  const { colors } = useAppTheme();
  const [amount, setAmount] = useState('200');
  const [message, setMessage] = useState('I can complete this job on time.');
  const [isAccepted, setIsAccepted] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      <PostJobHeader onBack={onBack} title="Place Your Bid" />

      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>YOUR BID AMOUNT (₹)</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor={colors.textMuted}
          style={[styles.amountInput, { color: colors.text }]}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Min ₹100 - Max ₹1000</Text>

        <Text style={[styles.label, styles.messageLabel, { color: colors.text }]}>ADD MESSAGE (OPTIONAL)</Text>
        <TextInput
          multiline
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
          placeholder="Write a message to the client"
          placeholderTextColor={colors.textMuted}
          style={[styles.messageInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={() => setIsAccepted(true)} style={[styles.submitButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Submit Bid</Text>
        </Pressable>
        <Text style={[styles.footerHint, { color: colors.textMuted }]}>ⓘ  You will be notified if your bid is accepted.</Text>
      </View>

      <Modal animationType="fade" transparent visible={isAccepted} onRequestClose={() => setIsAccepted(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.primary }]}>Bid Submited</Text>
            <View style={styles.successHalo}>
              <View style={styles.successCircle}><Text style={styles.checkIcon}>✓</Text></View>
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Congratulations!</Text>
            <Text style={[styles.successMessage, { color: colors.textMuted }]}>Your bid has been accepted.</Text>

            <View style={styles.jobPreview}>
              <View>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Need Delivery Boy</Text>
                <Text style={[styles.previewLocation, { color: colors.textMuted }]}>⌖  Paldi, Ahmedabad</Text>
              </View>
              <Text style={[styles.previewPrice, { color: colors.primary }]}>₹{amount || '200'}</Text>
            </View>

            <Pressable accessibilityRole="button" onPress={onGoHome} style={[styles.modalPrimaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.modalPrimaryText}>Back To Home</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onGoToChat} style={[styles.modalSecondaryButton, { borderColor: colors.primary }]}>
              <Text style={[styles.modalSecondaryText, { color: colors.primary }]}>Go to Chat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  amountInput: { borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, fontSize: rf(13), fontWeight: '700', height: 43, paddingHorizontal: 12 },
  content: { flex: 1, paddingHorizontal: 11, paddingTop: 23 },
  footer: { paddingBottom: hp(2), paddingHorizontal: 11 },
  footerHint: { fontSize: rf(9), marginTop: 10, textAlign: 'center' },
  hint: { fontSize: rf(9), fontWeight: '600', marginTop: 6 },
  label: { fontSize: rf(10), fontWeight: '800' },
  checkIcon: { color: '#FFFFFF', fontSize: rf(34), fontWeight: '800', marginTop: -4 },
  messageInput: { borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, fontSize: rf(13), height: 119, paddingHorizontal: 12, paddingTop: 11 },
  messageLabel: { marginTop: 27, marginBottom: 8 },
  screen: { flex: 1 },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.42)', flex: 1, justifyContent: 'center', paddingHorizontal: 23 },
  modalCard: { borderRadius: 18, elevation: 12, maxWidth: 350, padding: 18, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, width: '100%' },
  modalHeaderTitle: { fontSize: rf(15), fontWeight: '800', textAlign: 'center' },
  modalPrimaryButton: { alignItems: 'center', borderRadius: 6, height: 39, justifyContent: 'center', marginTop: 14 },
  modalPrimaryText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  modalSecondaryButton: { alignItems: 'center', borderRadius: 6, borderWidth: 2, height: 39, justifyContent: 'center', marginTop: 10 },
  modalSecondaryText: { fontSize: rf(11), fontWeight: '800' },
  jobPreview: { backgroundColor: '#FFFFFF', borderRadius: 9, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', marginTop: 29, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5 },
  previewLocation: { fontSize: rf(9), marginTop: 5 },
  previewPrice: { fontSize: rf(16), fontWeight: '800' },
  previewTitle: { fontSize: rf(14), fontWeight: '800' },
  successCircle: { alignItems: 'center', backgroundColor: '#00E6B1', borderRadius: 50, elevation: 5, height: 100, justifyContent: 'center', shadowColor: '#009879', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 8, width: 100 },
  successHalo: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#D1FFF4', borderRadius: 75, height: 150, justifyContent: 'center', marginTop: 18, width: 150 },
  successMessage: { fontSize: rf(12), marginTop: 9, textAlign: 'center' },
  successTitle: { fontSize: rf(20), fontWeight: '800', marginTop: 25, textAlign: 'center' },
  submitButton: { alignItems: 'center', borderRadius: 6, elevation: 4, height: 39, justifyContent: 'center', shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  submitText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
});

export default PlaceBidScreen;
