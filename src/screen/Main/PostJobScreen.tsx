import { useCallback, useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BackHandler, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { collection, getDocs, getFirestore } from '@react-native-firebase/firestore';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { useCustomAlert } from '../../components/CustomAlert';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { createJob, type PostedJob, updateJob } from '../../services/jobs';
import { hp, rf } from '../../utils/responsive';
import PostJobHeader from './components/PostJobHeader';
import PostLocationDetailsScreen, { type LocationDetails, type PostLocationMode } from './PostLocationDetailsScreen';

type PostJobScreenProps = {
  editingJob?: PostedJob | null;
  onBack: () => void;
  onJobSaved?: () => void;
};

type DatePickerTarget = 'job' | 'close' | null;
type FormField = 'category' | 'jobTitle' | 'description' | 'jobDateTime' | 'closeDateTime' | 'pickupLocation' | 'dropLocation' | 'budget';
type FormErrors = Partial<Record<FormField, string>>;

type JobCategory = {
  icon: string;
  id: string;
  name: string;
};

const priorities = [
  { label: 'High', activeBackground: '#FEE2E2', activeBorder: '#EF4444', activeText: '#DC2626' },
  { label: 'Medium', activeBackground: '#FEF3C7', activeBorder: '#F59E0B', activeText: '#B45309' },
  { label: 'Low', activeBackground: '#DCFCE7', activeBorder: '#22C55E', activeText: '#15803D' },
] as const;

const emptyLocationDetails: LocationDetails = {
  address: '',
  floorDetails: '',
  name: '',
  nearbyLocation: '',
  phoneNumber: '',
  latitude: null,
  longitude: null,
};

const displayLocation = (details: LocationDetails) => [details.address, details.nearbyLocation]
  .filter(Boolean)
  .join(', ');

const displayLocationDetails = (details: LocationDetails) => [
  details.name && details.phoneNumber ? `${details.name} • +91 ${details.phoneNumber}` : details.name || details.phoneNumber,
  displayLocation(details),
  details.floorDetails,
].filter(Boolean).join('\n');

const formatDateTime = (value: Date) => {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

function PostJobScreen({ editingJob, onBack, onJobSaved }: PostJobScreenProps) {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const isEditingJob = Boolean(editingJob);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(editingJob?.category ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(editingJob?.categoryId ?? '');
  const [jobTitle, setJobTitle] = useState(editingJob?.title ?? '');
  const [description, setDescription] = useState(editingJob?.description ?? '');
  const [budget, setBudget] = useState(editingJob ? String(editingJob.budget) : '');
  const [priority, setPriority] = useState<(typeof priorities)[number]['label']>(editingJob?.priority ?? 'Medium');
  const [jobDateTime, setJobDateTime] = useState<Date | null>(editingJob?.jobDateTime ?? null);
  const [closeDateTime, setCloseDateTime] = useState<Date | null>(editingJob?.closeDateTime ?? null);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedJobId, setPublishedJobId] = useState('');
  const [pickupDetails, setPickupDetails] = useState<LocationDetails>(editingJob?.pickupDetails ?? emptyLocationDetails);
  const [dropDetails, setDropDetails] = useState<LocationDetails>(editingJob?.dropDetails ?? emptyLocationDetails);
  const [editingLocation, setEditingLocation] = useState<PostLocationMode | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const pickupLocation = displayLocation(pickupDetails);
  const dropLocation = displayLocation(dropDetails);
  const isDeliveryCategory = selectedCategory.trim().toLowerCase() === 'delivery';

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const snapshot = await getDocs(collection(getFirestore(), 'categories'));
        const nextCategories = snapshot.docs.map(document => {
          const data = document.data() as { icon?: unknown; name?: unknown; title?: unknown };
          const name = typeof data.name === 'string'
            ? data.name
            : typeof data.title === 'string'
            ? data.title
            : document.id;

          return {
            icon: typeof data.icon === 'string' && data.icon.trim() ? data.icon : '▰',
            id: document.id,
            name,
          };
        });

        if (!isMounted) {
          return;
        }

        setCategories(nextCategories);
        setSelectedCategory(current => nextCategories.some(category => category.name === current)
          ? current
          : '');
        setSelectedCategoryId(current => nextCategories.some(category => category.id === current)
          ? current
          : nextCategories.find(category => category.name === editingJob?.category)?.id ?? '');
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    loadCategories().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [editingJob]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return;
    }

    onBack();
  }, [currentStep, onBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPublished) {
        setIsPublished(false);
      } else if (editingLocation) {
        setEditingLocation(null);
      } else if (datePickerTarget) {
        setDatePickerTarget(null);
      } else {
        goBack();
      }

      return true;
    });

    return () => subscription.remove();
  }, [datePickerTarget, editingLocation, goBack, isPublished]);

  const goToNextStep = async () => {
    const nextErrors: FormErrors = {};

    if (currentStep === 1 && (!selectedCategory || !selectedCategoryId)) {
      nextErrors.category = 'Please select a category.';
    }

    if (currentStep === 2) {
      if (jobTitle.trim().length < 3) {
        nextErrors.jobTitle = 'Enter a job title with at least 3 characters.';
      }
      if (description.trim().length < 10) {
        nextErrors.description = 'Enter at least 10 characters for the job description.';
      }
      if (!jobDateTime || Number.isNaN(jobDateTime.getTime())) {
        nextErrors.jobDateTime = 'Please select a valid job date and time.';
      }
      if (!closeDateTime || Number.isNaN(closeDateTime.getTime())) {
        nextErrors.closeDateTime = 'Please select a valid closing date and time.';
      } else if (jobDateTime && closeDateTime.getTime() < jobDateTime.getTime()) {
        nextErrors.closeDateTime = 'Closing date and time must be after the job date and time.';
      }
    }

    if (currentStep === 3) {
      if (!pickupLocation.trim()) {
        nextErrors.pickupLocation = 'Please add the pickup location.';
      }
      if (!dropLocation.trim()) {
        nextErrors.dropLocation = 'Please add the drop location.';
      }
      if (!budget.trim()) {
        nextErrors.budget = isDeliveryCategory ? 'Please enter a fixed budget.' : 'Please enter an hourly budget.';
      } else if (!/^\d+$/.test(budget.trim()) || Number(budget) < 100 || Number(budget) > 10000) {
        nextErrors.budget = isDeliveryCategory
          ? 'Fixed budget must be between ₹100 and ₹10,000.'
          : 'Hourly budget must be between ₹100 and ₹10,000.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (currentStep === 4) {
      if (isPublishing || !jobDateTime || !closeDateTime) {
        return;
      }

      setIsPublishing(true);
      try {
        const jobInput = {
          budget: Number(budget),
          budgetType: isDeliveryCategory ? 'fixed' as const : 'hourly' as const,
          category: selectedCategory,
          categoryId: selectedCategoryId,
          closeDateTime,
          description,
          dropDetails,
          jobDateTime,
          pickupDetails,
          priority,
          title: jobTitle,
        };
        const jobId = isEditingJob && editingJob
          ? await updateJob(editingJob.id, jobInput)
          : await createJob(jobInput);
        setPublishedJobId(jobId);
        setIsPublished(true);
      } catch (error) {
        showAlert(
          isEditingJob ? 'Unable to update job' : 'Unable to publish job',
          error instanceof Error ? error.message : 'Please try again.',
        );
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    setCurrentStep(step => Math.min(step + 1, 4));
  };

  const openDateTimePicker = (target: Exclude<DatePickerTarget, null>) => {
    setDatePickerTarget(target);
    setPickerMode('date');
  };

  const clearError = (field: FormField) => {
    setErrors(current => current[field] ? { ...current, [field]: undefined } : current);
  };

  const handleDateTimeChange = (_event: unknown, selectedValue?: Date) => {
    if (!selectedValue || !datePickerTarget) {
      setDatePickerTarget(null);
      return;
    }

    const currentValue = datePickerTarget === 'job' ? jobDateTime : closeDateTime;
    const nextValue = new Date(selectedValue);

    if (pickerMode === 'date') {
      nextValue.setHours(currentValue?.getHours() ?? new Date().getHours(), currentValue?.getMinutes() ?? new Date().getMinutes());
      if (datePickerTarget === 'job') {
        setJobDateTime(nextValue);
      } else {
        setCloseDateTime(nextValue);
      }
      clearError(datePickerTarget === 'job' ? 'jobDateTime' : 'closeDateTime');
      setPickerMode('time');
      return;
    }

    if (datePickerTarget === 'job') {
      setJobDateTime(nextValue);
    } else {
      setCloseDateTime(nextValue);
    }
    clearError(datePickerTarget === 'job' ? 'jobDateTime' : 'closeDateTime');
    setDatePickerTarget(null);
  };

  if (editingLocation) {
    const isPickup = editingLocation === 'pickup';
    return (
      <PostLocationDetailsScreen
        initialDetails={isPickup ? pickupDetails : dropDetails}
        mode={editingLocation}
        onBack={() => setEditingLocation(null)}
        onConfirm={details => {
          if (isPickup) {
            setPickupDetails(details);
            clearError('pickupLocation');
          } else {
            setDropDetails(details);
            clearError('dropLocation');
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
              {isLoadingCategories ? (
                <Text style={[styles.categoryMessage, { color: colors.textMuted }]}>Loading categories...</Text>
              ) : categories.length === 0 ? (
                <Text style={[styles.categoryMessage, { color: colors.textMuted }]}>No categories available.</Text>
              ) : categories.map(category => {
                const selected = category.name === selectedCategory;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedCategory(category.name);
                      setSelectedCategoryId(category.id);
                      clearError('category');
                    }}
                    style={[styles.categoryCard, selected && styles.categoryCardSelected, errors.category && styles.fieldErrorBorder]}
                  >
                    <Text style={[styles.categoryIcon, { color: selected ? colors.primary : colors.textMuted }]}>{category.icon}</Text>
                    <Text style={[styles.categoryName, { color: selected ? colors.primary : colors.textMuted }]}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </>
        ) : currentStep === 2 ? (
          <View style={styles.detailsForm}>
            <Text style={[styles.title, { color: colors.text }]}>Job Details</Text>

            <View style={styles.selectedCategoryBanner}>
              <Text style={[styles.selectedCategoryLabel, { color: colors.textMuted }]}>Selected Category</Text>
              <Text style={[styles.selectedCategoryValue, { color: colors.primary }]}>{selectedCategory}</Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Title</Text>
            <TextInput
              value={jobTitle}
              onChangeText={value => {
                setJobTitle(value);
                clearError('jobTitle');
              }}
              placeholder="Enter job title"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, errors.jobTitle && styles.fieldErrorBorder, { color: colors.text }]}
            />
            {errors.jobTitle ? <Text style={styles.errorText}>{errors.jobTitle}</Text> : null}

            <Text style={[styles.fieldLabel, styles.descriptionLabel, { color: colors.textMuted }]}>Description</Text>
            <TextInput
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={value => {
                setDescription(value);
                clearError('description');
              }}
              placeholder="Describe the work needed"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.descriptionInput, errors.description && styles.fieldErrorBorder, { color: colors.text }]}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

            <Text style={[styles.fieldLabel, styles.dateLabel, { color: colors.textMuted }]}>Date &amp; Time</Text>
            <Pressable accessibilityRole="button" onPress={() => openDateTimePicker('job')} style={[styles.dateInput, errors.jobDateTime && styles.fieldErrorBorder]}>
              <Text style={[styles.dateValue, { color: jobDateTime ? colors.text : colors.textMuted }]}>{jobDateTime ? formatDateTime(jobDateTime) : 'Select job date & time'}</Text>
              <Text style={[styles.dateIcon, { color: colors.text }]}>□</Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>
            {errors.jobDateTime ? <Text style={styles.errorText}>{errors.jobDateTime}</Text> : null}

            <Text style={[styles.fieldLabel, styles.dateLabel, { color: colors.textMuted }]}>Job close Date &amp; Time</Text>
            <Pressable accessibilityRole="button" onPress={() => openDateTimePicker('close')} style={[styles.dateInput, errors.closeDateTime && styles.fieldErrorBorder]}>
              <Text style={[styles.dateValue, { color: closeDateTime ? colors.text : colors.textMuted }]}>{closeDateTime ? formatDateTime(closeDateTime) : 'Select closing date & time'}</Text>
              <Text style={[styles.dateIcon, { color: colors.text }]}>□</Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>
            {errors.closeDateTime ? <Text style={styles.errorText}>{errors.closeDateTime}</Text> : null}

            <Text style={[styles.fieldLabel, styles.priorityLabel, { color: colors.textMuted }]}>Job Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map(option => {
                const selected = priority === option.label;

                return (
                  <Pressable
                    key={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setPriority(option.label)}
                    style={[
                      styles.priorityOption,
                      {
                        backgroundColor: selected ? option.activeBackground : '#F8F8FA',
                        borderColor: selected ? option.activeBorder : '#E3E5E8',
                      },
                    ]}
                  >
                    <View style={[styles.priorityRadio, { borderColor: selected ? option.activeBorder : '#9CA3AF' }]}>
                      {selected && <View style={[styles.priorityDot, { backgroundColor: option.activeBorder }]} />}
                    </View>
                    <Text style={[styles.priorityText, { color: selected ? option.activeText : colors.textMuted }]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

          </View>
        ) : currentStep === 3 ? (
          <View style={styles.locationForm}>
            <Text style={[styles.title, { color: colors.text }]}>Location &amp; Budget</Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Pickup Location</Text>
            <Pressable accessibilityRole="button" onPress={() => setEditingLocation('pickup')} style={[styles.locationInput, errors.pickupLocation && styles.fieldErrorBorder]}>
              <Text numberOfLines={1} style={[styles.locationValue, { color: pickupLocation ? colors.text : colors.textMuted }]}>{pickupLocation || 'Select pickup location'}</Text>
              <Text style={[styles.locationChevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>
            {errors.pickupLocation ? <Text style={styles.errorText}>{errors.pickupLocation}</Text> : null}

            <Text style={[styles.fieldLabel, styles.dropLabel, { color: colors.textMuted }]}>Drop Location</Text>
            <Pressable accessibilityRole="button" onPress={() => setEditingLocation('drop')} style={[styles.locationInput, errors.dropLocation && styles.fieldErrorBorder]}>
              <Text numberOfLines={1} style={[styles.locationValue, { color: dropLocation ? colors.text : colors.textMuted }]}>{dropLocation || 'Select drop location'}</Text>
              <Text style={[styles.locationChevron, { color: colors.textMuted }]}>⌄</Text>
            </Pressable>
            {errors.dropLocation ? <Text style={styles.errorText}>{errors.dropLocation}</Text> : null}

            <View style={styles.mapPreview}>
              <View style={styles.routeLine} />
              <View style={styles.pickupPoint} />
              <View style={styles.dropPoint} />
              <Text style={styles.packageIcon}>▯</Text>
            </View>

            <Text style={[styles.fieldLabel, styles.budgetLabel, { color: colors.textMuted }]}>
              {isDeliveryCategory ? 'Fixed Budget (₹)' : 'Hourly Budget (₹/hour)'}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={budget}
              onChangeText={value => {
                setBudget(value.replace(/[^0-9]/g, ''));
                clearError('budget');
              }}
              placeholder={isDeliveryCategory ? 'Enter total budget' : 'Enter hourly budget'}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.budgetInput, errors.budget && styles.fieldErrorBorder, { color: colors.text }]}
            />
            {errors.budget ? <Text style={styles.errorText}>{errors.budget}</Text> : null}
            <Text style={[styles.budgetHint, { color: colors.textMuted }]}>Min ₹100 - Max ₹10000 {isDeliveryCategory ? 'total' : 'per hour'}</Text>
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
                <Text style={[styles.reviewValue, { color: colors.text }]}>{jobDateTime ? formatDateTime(jobDateTime) : '-'}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Job Close Date &amp; Time</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{closeDateTime ? formatDateTime(closeDateTime) : '-'}</Text>
                
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Job Priority</Text>
              <View style={styles.reviewValueRow}>
                {(() => {
                  const selectedPriority = priorities.find(item => item.label === priority)!;
                  return (
                    <View style={[styles.priorityBadge, { backgroundColor: selectedPriority.activeBackground }]}>
                      <Text style={[styles.priorityBadgeText, { color: selectedPriority.activeText }]}>{priority}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>{isDeliveryCategory ? 'Fixed Budget' : 'Hourly Budget'}</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, { color: colors.text }]}>₹{budget}{isDeliveryCategory ? '' : ' / hour'}</Text>
              </View>
            </View>


            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Pickup Details</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, styles.locationReviewValue, { color: colors.text }]}>{displayLocationDetails(pickupDetails)}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Drop Details</Text>
              <View style={styles.reviewValueRow}>
                <Text style={[styles.reviewValue, styles.locationReviewValue, { color: colors.text }]}>{displayLocationDetails(dropDetails)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={(currentStep === 1 && (!selectedCategory || !selectedCategoryId)) || isPublishing}
        onPress={goToNextStep}
        style={[styles.nextButton, { backgroundColor: currentStep === 1 && (!selectedCategory || !selectedCategoryId) ? '#CBD5E1' : colors.primary }]}
      >
        <Text style={styles.nextLabel}>{isPublishing ? 'Publishing...' : currentStep === 4 ? 'Publish Job' : 'Next'}</Text>
      </Pressable>

      {datePickerTarget && (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode={pickerMode}
          onChange={handleDateTimeChange}
          value={datePickerTarget === 'job' ? jobDateTime ?? new Date() : closeDateTime ?? new Date()}
        />
      )}

      <Modal animationType="fade" onRequestClose={() => setIsPublished(false)} transparent visible={isPublished}>
        <View style={styles.successBackdrop}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={styles.successHalo}>
              <View style={[styles.successIcon, { borderColor: colors.primary }]}>
                <Text style={[styles.successCheck, { color: colors.primary }]}>✓</Text>
              </View>
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>{isEditingJob ? 'Job Updated' : 'Job Posted'}</Text>
            <Text style={[styles.successMessage, { color: colors.textMuted }]}>{isEditingJob ? 'Your job changes have been saved successfully!' : 'Your job has been posted successfully!'}</Text>
            <View style={styles.jobIdBadge}><Text style={[styles.jobIdText, { color: colors.primary }]}>Job ID: #{publishedJobId.slice(0, 8).toUpperCase()}</Text></View>

            <View style={styles.successActions}>
              <Pressable accessibilityRole="button" onPress={() => setIsPublished(false)} style={styles.viewJobButton}>
                <Text style={[styles.viewJobText, { color: colors.textMuted }]}>View Job</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={isEditingJob ? onJobSaved : onBack} style={[styles.homeButton, { backgroundColor: colors.primary }]}> 
                <Text style={styles.homeButtonText}>{isEditingJob ? 'Back to My Jobs' : 'Go to Home'}</Text>
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
  categoryMessage: { fontSize: rf(13), paddingVertical: 18, textAlign: 'center', width: '100%' },
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
  errorText: { color: '#DC2626', fontSize: rf(10), lineHeight: rf(13), marginTop: 4 },
  fieldLabel: { fontSize: rf(11), fontWeight: '500', marginBottom: 6 },
  fieldErrorBorder: { borderColor: '#DC2626' },
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
  selectedCategoryBanner: { alignItems: 'center', backgroundColor: '#F0E8FF', borderRadius: 7, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 11, paddingVertical: 8 },
  selectedCategoryLabel: { fontSize: rf(10), fontWeight: '700' },
  selectedCategoryValue: { fontSize: rf(12), fontWeight: '800' },
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
  priorityDot: { borderRadius: 4, height: 8, width: 8 },
  priorityBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  priorityBadgeText: { fontSize: rf(10), fontWeight: '800' },
  priorityLabel: { marginTop: 17 },
  priorityOption: { alignItems: 'center', borderRadius: 7, borderWidth: 1, flex: 1, flexDirection: 'row', height: 38, justifyContent: 'center', marginHorizontal: 3 },
  priorityRadio: { alignItems: 'center', borderRadius: 8, borderWidth: 1.2, height: 16, justifyContent: 'center', marginRight: 6, width: 16 },
  priorityRow: { flexDirection: 'row', marginHorizontal: -3 },
  priorityText: { fontSize: rf(10), fontWeight: '700' },
  screen: { flex: 1 },
  title: { fontSize: rf(16), fontWeight: '800', textAlign: 'center' },
});

export default PostJobScreen;
