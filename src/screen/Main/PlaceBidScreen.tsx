import { useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useCustomAlert } from '../../components/CustomAlert';
import { createBid } from '../../services/bids';
import type { PostedJob } from '../../services/jobs';
import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';

type PlaceBidScreenProps = {
  job: PostedJob | null;
  onBack: () => void;
  onGoToChat: () => void;
  onGoHome: () => void;
};

const responseTimes = [
  { label: '30m', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hr', minutes: 120 },
  { label: '3 hr', minutes: 180 },
  { label: '4 hr', minutes: 240 },
];

function PlaceBidScreen({ job, onBack, onGoHome, onGoToChat }: PlaceBidScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [isAvailableForJob, setIsAvailableForJob] = useState(true);
  const [availableDateTime, setAvailableDateTime] = useState(() => new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [expectedResponseTimeMinutes, setExpectedResponseTimeMinutes] = useState(30);

  const onDateTimeChange = (_event: DateTimePickerEvent, value?: Date) => {
    setPickerMode(null);
    if (value) setAvailableDateTime(value);
  };

  const submitBid = async () => {
    const bidAmount = Number(amount);

    if (!job) {
      setAmountError('Job details are unavailable. Please return to the job and try again.');
      return;
    }
    if (!Number.isFinite(bidAmount) || bidAmount < 100 || bidAmount > 10000) {
      setAmountError('Enter a bid amount between ₹100 and ₹10,000.');
      return;
    }

    setAmountError('');
    setIsSubmitting(true);
    try {
      await createBid({ amount: bidAmount, availableDateTime: isAvailableForJob ? availableDateTime : null, expectedResponseTimeMinutes, isAvailableForJob, job, message });
      setIsAccepted(true);
    } catch (error) {
      showAlert('Unable to submit bid', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      <PostJobHeader onBack={onBack} title="Place Your Bid" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.text }]}>YOUR BID AMOUNT (₹)</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={value => {
            setAmount(value);
            if (amountError) {
              setAmountError('');
            }
          }}
          placeholder="Enter amount"
          placeholderTextColor={colors.textMuted}
          style={[styles.amountInput, { borderColor: amountError ? '#DC2626' : '#E0D6ED', color: colors.text }]}
        />
        {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
        <Text style={[styles.hint, { color: colors.textMuted }]}>Min ₹100 - Max ₹10,000</Text>

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

        <View style={styles.availabilityHeader}>
          <View style={styles.availabilityTitleWrap}>
            <Text style={[styles.availabilityTitle, { color: colors.text }]}>🟢 Available for this job</Text>
            <Text style={[styles.availabilityHint, { color: colors.textMuted }]}>Let the customer know when you can start.</Text>
          </View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: isAvailableForJob }} onPress={() => setIsAvailableForJob(value => !value)} style={[styles.switchTrack, { backgroundColor: isAvailableForJob ? colors.primary : '#CBD5E1' }]}>
            <View style={[styles.switchKnob, isAvailableForJob ? styles.switchKnobOn : styles.switchKnobOff]} />
          </Pressable>
        </View>

        {isAvailableForJob ? <>
          <Text style={[styles.fieldTitle, { color: colors.text }]}>📅 Available date & time</Text>
          <View style={styles.dateTimeRow}>
            <Pressable accessibilityRole="button" onPress={() => setPickerMode('date')} style={[styles.dateTimeInput, { borderColor: '#E0D6ED' }]}>
              <Text style={[styles.dateTimeText, { color: colors.text }]}>{availableDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setPickerMode('time')} style={[styles.dateTimeInput, { borderColor: '#E0D6ED' }]}>
              <Text style={[styles.dateTimeText, { color: colors.text }]}>{availableDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </Pressable>
          </View>

          <Text style={[styles.fieldTitle, { color: colors.text }]}>⏱ Expected response time</Text>
          <View style={styles.responseTabs}>
            {responseTimes.map(option => {
              const selected = option.minutes === expectedResponseTimeMinutes;
              return <Pressable key={option.minutes} accessibilityRole="button" onPress={() => setExpectedResponseTimeMinutes(option.minutes)} style={[styles.responseTab, { borderColor: selected ? colors.primary : '#E0D6ED', backgroundColor: selected ? colors.primary : colors.card }]}>
                <Text style={[styles.responseTabText, { color: selected ? '#FFFFFF' : colors.text }]}>{option.label}</Text>
              </Pressable>;
            })}
          </View>
        </> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submitBid} style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}>
          <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit Bid'}</Text>
        </Pressable>
        <Text style={[styles.footerHint, { color: colors.textMuted }]}>ⓘ  You will be notified if your bid is accepted.</Text>
      </View>

      <Modal animationType="fade" transparent visible={isAccepted} onRequestClose={() => setIsAccepted(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.primary }]}>Bid Submitted</Text>
            <View style={styles.successHalo}>
              <View style={styles.successCircle}><Text style={styles.checkIcon}>✓</Text></View>
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Bid submitted!</Text>
            <Text style={[styles.successMessage, { color: colors.textMuted }]}>The job owner will be notified of your bid.</Text>

            <View style={styles.jobPreview}>
              <View style={styles.previewDetails}>
                <Text numberOfLines={2} style={[styles.previewTitle, { color: colors.text }]}>{job?.title || 'Job'}</Text>
                <Text style={[styles.previewLocation, { color: colors.textMuted }]} numberOfLines={1}>⌖  {job?.pickupDetails.address || 'Location unavailable'}</Text>
              </View>
              <Text style={[styles.previewPrice, { color: colors.primary }]}>₹{amount}</Text>
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
      {pickerMode ? <DateTimePicker minimumDate={pickerMode === 'date' ? new Date() : undefined} mode={pickerMode} value={availableDateTime} onChange={onDateTimeChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  amountInput: { borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, fontSize: rf(13), fontWeight: '700', height: 43, paddingHorizontal: 12 },
  availabilityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  availabilityHint: { fontSize: rf(10), marginTop: 3 },
  availabilityTitle: { fontSize: rf(13), fontWeight: '800' },
  availabilityTitleWrap: { flex: 1, paddingRight: 12 },
  content: { flexGrow: 1, paddingBottom: 24, paddingHorizontal: 11, paddingTop: 23 },
  dateTimeInput: { borderRadius: 7, borderWidth: 1, flex: 1, height: 43, justifyContent: 'center', paddingHorizontal: 11 },
  dateTimeRow: { flexDirection: 'row', gap: 9, marginTop: 8 },
  dateTimeText: { fontSize: rf(11), fontWeight: '700' },
  errorText: { color: '#DC2626', fontSize: rf(10), fontWeight: '600', marginTop: 5 },
  footer: { paddingBottom: hp(2), paddingHorizontal: 11 },
  footerHint: { fontSize: rf(9), marginTop: 10, textAlign: 'center' },
  fieldTitle: { fontSize: rf(12), fontWeight: '800', marginTop: 22 },
  hint: { fontSize: rf(9), fontWeight: '600', marginTop: 6 },
  label: { fontSize: rf(10), fontWeight: '800' },
  checkIcon: { color: '#FFFFFF', fontSize: rf(34), fontWeight: '800', marginTop: -4 },
  messageInput: { borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, fontSize: rf(13), height: 119, paddingHorizontal: 12, paddingTop: 11 },
  messageLabel: { marginTop: 27, marginBottom: 8 },
  screen: { flex: 1 },
  responseTabs: { flexDirection: 'row', gap: 6, marginTop: 8 },
  responseTab: { alignItems: 'center', borderRadius: 7, borderWidth: 1, flex: 1, height: 37, justifyContent: 'center' },
  responseTabText: { fontSize: rf(9), fontWeight: '800' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.42)', flex: 1, justifyContent: 'center', paddingHorizontal: 23 },
  modalCard: { borderRadius: 18, elevation: 12, maxWidth: 350, padding: 18, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, width: '100%' },
  modalHeaderTitle: { fontSize: rf(15), fontWeight: '800', textAlign: 'center' },
  modalPrimaryButton: { alignItems: 'center', borderRadius: 6, height: 39, justifyContent: 'center', marginTop: 14 },
  modalPrimaryText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  modalSecondaryButton: { alignItems: 'center', borderRadius: 6, borderWidth: 2, height: 39, justifyContent: 'center', marginTop: 10 },
  modalSecondaryText: { fontSize: rf(11), fontWeight: '800' },
  jobPreview: { alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 9, elevation: 2, flexDirection: 'row', marginTop: 29, padding: 13, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5 },
  previewDetails: { flex: 1, minWidth: 0, paddingRight: 10 },
  previewLocation: { fontSize: rf(9), marginTop: 5 },
  previewPrice: { flexShrink: 0, fontSize: rf(16), fontWeight: '800' },
  previewTitle: { fontSize: rf(14), fontWeight: '800' },
  successCircle: { alignItems: 'center', backgroundColor: '#00E6B1', borderRadius: 50, elevation: 5, height: 100, justifyContent: 'center', shadowColor: '#009879', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 8, width: 100 },
  successHalo: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#D1FFF4', borderRadius: 75, height: 150, justifyContent: 'center', marginTop: 18, width: 150 },
  successMessage: { fontSize: rf(12), marginTop: 9, textAlign: 'center' },
  successTitle: { fontSize: rf(20), fontWeight: '800', marginTop: 25, textAlign: 'center' },
  submitButton: { alignItems: 'center', borderRadius: 6, elevation: 4, height: 39, justifyContent: 'center', shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  submitText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  switchKnob: { backgroundColor: '#FFFFFF', borderRadius: 11, height: 22, width: 22 },
  switchKnobOff: { alignSelf: 'flex-start', marginLeft: 2 },
  switchKnobOn: { alignSelf: 'flex-end', marginRight: 2 },
  switchTrack: { borderRadius: 14, height: 26, justifyContent: 'center', width: 48 },
});

export default PlaceBidScreen;
