import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';
import PostLocationDetailsScreen, { type PostLocationMode } from './PostLocationDetailsScreen';

type PostJobScreenProps = {
  onBack: () => void;
};

const categories = [
  { icon: '▰', name: 'Delivery' },
  { icon: '⌁', name: 'Plumber' },
  { icon: 'ϟ', name: 'Electrical' },
  { icon: '♧', name: 'Cleaning' },
  { icon: '⌂', name: 'Home\nServices' },
  { icon: '⚒', name: 'Repairs' },
  { icon: '▱', name: 'Moving' },
  { icon: '+', name: 'More' },
];

function PostJobScreen({ onBack }: PostJobScreenProps) {
  const { colors } = useAppTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Delivery');
  const [jobTitle, setJobTitle] = useState('Need Delivery Boy');
  const [description, setDescription] = useState(
    'Need a person to pickup documents from Paldi and deliver to Satellite area.',
  );
  const [budget, setBudget] = useState('200');
  const [isPublished, setIsPublished] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('Paldi, Ahmedabad');
  const [dropLocation, setDropLocation] = useState('Satellite, Ahmedabad');
  const [editingLocation, setEditingLocation] = useState<PostLocationMode | null>(null);

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return;
    }

    onBack();
  };

  const goToNextStep = () => {
    if (currentStep === 4) {
      setIsPublished(true);
      return;
    }

    setCurrentStep(step => Math.min(step + 1, 4));
  };

  if (editingLocation) {
    const isPickup = editingLocation === 'pickup';
    return (
      <PostLocationDetailsScreen
        initialAddress={isPickup ? pickupLocation : dropLocation}
        mode={editingLocation}
        onBack={() => setEditingLocation(null)}
        onConfirm={address => {
          if (isPickup) {
            setPickupLocation(address);
          } else {
            setDropLocation(address);
          }
          setEditingLocation(null);
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.card }]}>
      {/* {currentStep < 3 && <> */}
        <PostJobHeader onBack={goBack} />
        <View style={styles.progressTrack}>
          {[1, 2, 3, 4].map(step => <View key={step} style={[styles.progressSegment, step <= currentStep ? { backgroundColor: colors.primary } : styles.progressPending]} />)}
        </View>
      {/* </>} */}

      <View style={[styles.content, currentStep === 4 && styles.reviewContent]}>
        {currentStep === 1 ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map(category => {
                const selected = category.name === selectedCategory;
                return (
                  <Pressable
                    key={category.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedCategory(category.name)}
                    style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  >
                    <Text style={[styles.categoryIcon, { color: selected ? colors.primary : colors.textMuted }]}>{category.icon}</Text>
                    <Text style={[styles.categoryName, { color: selected ? colors.primary : colors.textMuted }]}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : currentStep === 2 ? (
          <View style={styles.detailsForm}>
            <Text style={[styles.title, { color: colors.text }]}>Job Details</Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Title</Text>
            <TextInput
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="Enter job title"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
            />

            <Text style={[styles.fieldLabel, styles.descriptionLabel, { color: colors.textMuted }]}>Description</Text>
            <TextInput
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the work needed"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.descriptionInput, { color: colors.text }]}
            />

            <Text style={[styles.fieldLabel, styles.dateLabel, { color: colors.textMuted }]}>Date &amp; Time</Text>
            <Pressable accessibilityRole="button" style={styles.dateInput}>
              <Text style={[styles.dateValue, { color: colors.text }]}>24/05/2024, 16:00</Text>
              <Text style={[styles.dateIcon, { color: colors.text }]}>□</Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>

            <Text style={[styles.fieldLabel, styles.dateLabel, { color: colors.textMuted }]}>Job close Date &amp; Time</Text>
            <Pressable accessibilityRole="button" style={styles.dateInput}>
              <Text style={[styles.dateValue, { color: colors.text }]}>24/05/2024, 16:00</Text>
              <Text style={[styles.dateIcon, { color: colors.text }]}>□</Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>

          </View>
        ) : currentStep === 3 ? (
          <View style={styles.locationForm}>
            <Text style={[styles.title, { color: colors.text }]}>Location &amp; Budget</Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Pickup Location</Text>
            <Pressable accessibilityRole="button" onPress={() => setEditingLocation('pickup')} style={styles.locationInput}>
              <Text numberOfLines={1} style={[styles.locationValue, { color: colors.text }]}>{pickupLocation}</Text>
              <Text style={[styles.locationChevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>

            <Text style={[styles.fieldLabel, styles.dropLabel, { color: colors.textMuted }]}>Drop Location</Text>
            <Pressable accessibilityRole="button" onPress={() => setEditingLocation('drop')} style={styles.locationInput}>
              <Text numberOfLines={1} style={[styles.locationValue, { color: colors.text }]}>{dropLocation}</Text>
              <Text style={[styles.locationChevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>

            <View style={styles.mapPreview}>
              <View style={styles.routeLine} />
              <View style={styles.pickupPoint} />
              <View style={styles.dropPoint} />
              <Text style={styles.packageIcon}>▯</Text>
            </View>

            <Text style={[styles.fieldLabel, styles.budgetLabel, { color: colors.textMuted }]}>Budget (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              placeholder="Enter budget"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.budgetInput, { color: colors.text }]}
            />
            <Text style={[styles.budgetHint, { color: colors.textMuted }]}>Min ₹100 - Max ₹10000</Text>
          </View>
        ) : (
          <View style={styles.reviewForm}>
            <Text style={[styles.title, { color: colors.text }]}>Review Your Job</Text>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Category</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewCategoryIcon, { color: colors.primary }]}>▰</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{selectedCategory}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Title</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{jobTitle}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Date &amp; Time</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>25 May 2024 • 04:00 PM</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Job Close Date &amp; Time</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>25 May 2024 • 04:00 PM</Text>
                
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Budget</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>₹{budget}</Text>
              </View>
            </View>


            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Location</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, styles.locationReviewValue, { color: colors.text }]}>{pickupLocation} to {dropLocation}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={goToNextStep} style={[styles.nextButton, { backgroundColor: colors.primary }]}> 
        <Text style={styles.nextLabel}>{currentStep === 4 ? 'Publish Job' : 'Next'}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={isPublished}>
        <View style={styles.successBackdrop}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={styles.successHalo}>
              <View style={[styles.successIcon, { borderColor: colors.primary }]}>
                <Text style={[styles.successCheck, { color: colors.primary }]}>✓</Text>
              </View>
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Job Posted</Text>
            <Text style={[styles.successMessage, { color: colors.textMuted }]}>Your job has been posted successfully!</Text>
            <View style={styles.jobIdBadge}><Text style={[styles.jobIdText, { color: colors.primary }]}>Job ID: #J12345</Text></View>

            <View style={styles.successActions}>
              <Pressable accessibilityRole="button" onPress={() => setIsPublished(false)} style={styles.viewJobButton}>
                <Text style={[styles.viewJobText, { color: colors.textMuted }]}>View Job</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onBack} style={[styles.homeButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.homeButtonText}>Go to Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCard: { alignItems: 'center', backgroundColor: '#F8F8FA', borderRadius: 9, borderWidth: 1, height: 76, justifyContent: 'center', marginBottom: 8, width: '31.8%' },
  categoryCardSelected: { borderColor: brandColors.blue },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2.3%', marginTop: 17 },
  categoryIcon: { fontSize: rf(22), fontWeight: '800', height: 26, textAlign: 'center' },
  categoryName: { fontSize: rf(10), fontWeight: '700', lineHeight: rf(11), marginTop: 4, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 8, paddingTop: 24 },
  budgetHint: { fontSize: rf(9), fontWeight: '600', marginLeft: 2, marginTop: 6 },
  budgetInput: { height: 36 },
  budgetLabel: { marginTop: 17 },
  dateIcon: { fontSize: rf(16), marginRight: 11 },
  dateInput: { alignItems: 'center', borderColor: '#9CA3AF', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 36, paddingLeft: 10 },
  dateLabel: { marginTop: 18 },
  dateValue: { flex: 1, fontSize: rf(12) },
  detailsForm: { flex: 1 },
  descriptionInput: { borderColor: '#E5E7EB', height: 87, paddingTop: 9 },
  descriptionLabel: { marginTop: 17 },
  dropLabel: { marginTop: 13 },
  editIcon: { fontSize: rf(15), marginLeft: 10 },
  fieldLabel: { fontSize: rf(11), fontWeight: '500', marginBottom: 6 },
  input: { borderColor: '#9CA3AF', borderRadius: 6, borderWidth: 1, fontSize: rf(12), height: 36, paddingHorizontal: 10 },
  locationChevron: { fontSize: rf(16), marginRight: 11 },
  locationForm: { flex: 1 },
  locationInput: { alignItems: 'center', borderColor: '#E5E7EB', borderRadius: 6, borderWidth: 1, flexDirection: 'row', height: 36, paddingLeft: 10 },
  locationValue: { flex: 1, fontSize: rf(12) },
  mapPreview: { backgroundColor: '#FCFBFE', borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, height: 92, marginTop: 17, overflow: 'hidden', position: 'relative' },
  packageIcon: { color: '#B39ACF', fontSize: rf(25), left: '47%', position: 'absolute', top: 27 },
  pickupPoint: { backgroundColor: brandColors.blue, borderRadius: 8, bottom: 15, height: 10, left: '16%', position: 'absolute', width: 18 },
  dropPoint: { backgroundColor: '#D60026', borderRadius: 8, height: 10, position: 'absolute', right: '16%', top: 30, width: 18 },
  routeLine: { borderColor: '#A548F7', borderStyle: 'dashed', borderTopWidth: 2, left: '20%', position: 'absolute', top: 47, transform: [{ rotate: '-16deg' }], width: '60%' },
  reviewCategoryIcon: { fontSize: rf(17), marginRight: 7 },
  reviewContent: { paddingTop: 9 },
  reviewForm: { flex: 1, paddingHorizontal: 5 },
  reviewLabel: { fontSize: rf(9), fontWeight: '600', marginBottom: 5 },
  reviewRow: { borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 9, paddingTop: 11 },
  reviewValue: { flex: 1, fontSize: rf(11), fontWeight: '600' },
  reviewValueRow: { alignItems: 'center', flexDirection: 'row' },
  successActions: { marginTop: 28 },
  successBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.42)', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  successCard: { borderRadius: 18, elevation: 12, maxWidth: 360, padding: 24, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, width: '100%' },
  successCheck: { fontSize: rf(42), fontWeight: '700', marginTop: -3 },
  successHalo: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#F0E5FF', borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  successIcon: { alignItems: 'center', backgroundColor: '#D7B3FF', borderRadius: 35, borderWidth: 2, height: 70, justifyContent: 'center', width: 70 },
  successMessage: { fontSize: rf(11), marginTop: 8, textAlign: 'center' },
  successTitle: { fontSize: rf(18), fontWeight: '800', marginTop: 21, textAlign: 'center' },
  jobIdBadge: { alignSelf: 'center', backgroundColor: '#F0E5FF', borderRadius: 12, marginTop: 9, paddingHorizontal: 11, paddingVertical: 4 },
  jobIdText: { fontSize: rf(11), fontWeight: '700' },
  viewJobButton: { alignItems: 'center', borderColor: '#E0D6ED', borderRadius: 6, borderWidth: 1, height: 34, justifyContent: 'center', marginBottom: 7 },
  viewJobText: { fontSize: rf(11), fontWeight: '800' },
  homeButton: { alignItems: 'center', borderRadius: 6, elevation: 3, height: 38, justifyContent: 'center', shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  homeButtonText: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800' },
  locationReviewValue: { lineHeight: rf(15) },
  chevron: { fontSize: rf(16), marginRight: 9 },
  nextButton: { alignItems: 'center', borderRadius: 6, elevation: 3, justifyContent: 'center', marginBottom: hp(1.4), marginHorizontal: 8, minHeight: 40, shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 4 },
  nextLabel: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  progressPending: { backgroundColor: '#E5E7EB' },
  progressSegment: { borderRadius: 10, flex: 1, height: 3, marginHorizontal: 3 },
  progressTrack: { flexDirection: 'row', paddingHorizontal: 5, paddingTop: 8 },
  screen: { flex: 1 },
  title: { fontSize: rf(16), fontWeight: '800', textAlign: 'center' },
});

export default PostJobScreen;
