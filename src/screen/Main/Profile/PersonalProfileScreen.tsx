import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import PostJobHeader from '../components/PostJobHeader';

type PersonalProfileScreenProps = {
  onBack: () => void;
};

const providerSkills = ['Delivery', 'Driving', 'Document handling'];

function PersonalProfileScreen({ onBack }: PersonalProfileScreenProps) {
  const { colors } = useAppTheme();
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittedReview, setSubmittedReview] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const submitReview = () => {
    if (selectedRating > 0) {
      setSubmittedReview(true);
      setReview('');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Personal Profile" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}><Text style={styles.avatarInitials}>RP</Text></View>
          <Text style={[styles.name, { color: colors.text }]}>Ravi Patel</Text>
          <View style={styles.ratingRow}><Text style={styles.ratingStar}>★</Text><Text style={[styles.ratingText, { color: colors.textMuted }]}>4.7 (24 Reviews)</Text></View>
          <View style={[styles.verifiedBadge, { backgroundColor: '#E7F8EE' }]}><Text style={styles.verifiedTick}>✓</Text><Text style={styles.verifiedText}>Verified</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeading}><Text style={[styles.cardTitle, { color: colors.text }]}>Skills</Text><Text style={[styles.rank, { color: colors.primary }]}>Rank #12</Text></View>
          <View style={styles.skillsRow}>{providerSkills.map(skill => <View key={skill} style={[styles.skillChip, { backgroundColor: '#F0E8FF' }]}><Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text></View>)}</View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textMuted }]}>Reliable delivery professional with experience in document pickup, local deliveries, and customer coordination. I always focus on safe and on-time service.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Rate and Review</Text>
          <Text style={[styles.reviewHint, { color: colors.textMuted }]}>How was your experience with Ravi?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => <Pressable key={star} accessibilityLabel={`Rate ${star} stars`} accessibilityRole="button" onPress={() => { setSelectedRating(star); setSubmittedReview(false); }} hitSlop={7}><Text style={[styles.selectableStar, { color: star <= selectedRating ? '#F5B301' : '#D8DCE4' }]}>★</Text></Pressable>)}
          </View>
          <TextInput multiline value={review} onChangeText={setReview} onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)} placeholder="Write a short review (optional)" placeholderTextColor={colors.textMuted} style={[styles.reviewInput, { borderColor: '#E3DCEB', color: colors.text }]} textAlignVertical="top" />
          <Pressable accessibilityRole="button" disabled={selectedRating === 0} onPress={submitReview} style={[styles.submitButton, { backgroundColor: selectedRating > 0 ? colors.primary : '#C9CDD5' }]}><Text style={styles.submitText}>Submit Review</Text></Pressable>
          {submittedReview && <Text style={[styles.thankYou, { color: colors.primary }]}>Thank you for your review!</Text>}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutText: { fontSize: 12, lineHeight: 19, marginTop: 9 },
  avatar: { alignItems: 'center', backgroundColor: '#DCE9F6', borderRadius: 45, height: 90, justifyContent: 'center', width: 90 },
  avatarInitials: { color: '#39516C', fontSize: 22, fontWeight: '800' },
  card: { borderRadius: 12, elevation: 2, marginTop: 12, padding: 14, shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.08, shadowRadius: 5 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  content: { paddingBottom: 28, paddingHorizontal: 12, paddingTop: 10 },
  keyboardAvoidingView: { flex: 1 },
  name: { fontSize: 19, fontWeight: '800', marginTop: 11 },
  profileCard: { alignItems: 'center', borderRadius: 12, elevation: 2, paddingBottom: 18, paddingTop: 19, shadowColor: '#64748B', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.08, shadowRadius: 5 },
  rank: { fontSize: 12, fontWeight: '800' },
  ratingRow: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  ratingStar: { color: '#F5B301', fontSize: 15 },
  ratingText: { fontSize: 12, marginLeft: 5 },
  reviewHint: { fontSize: 11, marginTop: 7 },
  reviewInput: { backgroundColor: '#FCFBFD', borderRadius: 8, borderWidth: 1, fontSize: 12, height: 84, marginTop: 12, padding: 11 },
  screen: { flex: 1 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  selectableStar: { fontSize: 29, marginRight: 7 },
  skillChip: { borderRadius: 14, marginRight: 7, paddingHorizontal: 10, paddingVertical: 6 },
  skillText: { fontSize: 10, fontWeight: '700' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 11 },
  starsRow: { flexDirection: 'row', marginTop: 9 },
  submitButton: { alignItems: 'center', borderRadius: 7, height: 42, justifyContent: 'center', marginTop: 12 },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  thankYou: { fontSize: 11, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  verifiedBadge: { alignItems: 'center', borderRadius: 13, flexDirection: 'row', marginTop: 10, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedText: { color: '#16834A', fontSize: 10, fontWeight: '800', marginLeft: 4 },
  verifiedTick: { color: '#16834A', fontSize: 11, fontWeight: '900' },
});

export default PersonalProfileScreen;
