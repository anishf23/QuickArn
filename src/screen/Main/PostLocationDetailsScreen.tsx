import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { rf } from '../../utils/responsive';
import { getCachedUserProfile } from '../../services/firebaseUser';
import LocationPickerScreen, { type SavedAddress } from './LocationPickerScreen';
import PostJobHeader from './components/PostJobHeader';

export type PostLocationMode = 'pickup' | 'drop';
export type LocationDetails = {
  address: string;
  floorDetails: string;
  name: string;
  nearbyLocation: string;
  phoneNumber: string;
  latitude: number | null;
  longitude: number | null;
};
type FormField = 'name' | 'phoneNumber' | 'address' | 'floorDetails' | 'nearbyLocation';
type FormErrors = Partial<Record<FormField, string>>;

type PostLocationDetailsScreenProps = {
  initialDetails: LocationDetails;
  mode: PostLocationMode;
  onBack: () => void;
  onConfirm: (details: LocationDetails) => void;
};

function PostLocationDetailsScreen({ initialDetails, mode, onBack, onConfirm }: PostLocationDetailsScreenProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState(initialDetails.name);
  const [phoneNumber, setPhoneNumber] = useState(initialDetails.phoneNumber);
  const [address, setAddress] = useState(initialDetails.address);
  const [floorDetails, setFloorDetails] = useState(initialDetails.floorDetails);
  const [nearbyLocation, setNearbyLocation] = useState(initialDetails.nearbyLocation);
  const [latitude, setLatitude] = useState(initialDetails.latitude);
  const [longitude, setLongitude] = useState(initialDetails.longitude);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode !== 'pickup') {
      return;
    }

    getCachedUserProfile().then(profile => {
      if (!profile) {
        return;
      }

      setName(current => current || profile.fullName || '');
      setPhoneNumber(current => current || (profile.mobileNumber ?? '').replace(/\D/g, '').slice(-10));
    }).catch(() => {});
  }, [mode]);

  const clearError = (field: FormField) => {
    setErrors(current => current[field] ? { ...current, [field]: undefined } : current);
  };

  const confirmLocation = () => {
    const nextErrors: FormErrors = {};
    const phoneDigits = phoneNumber.replace(/\D/g, '');

    if (name.trim().length < 2) {
      nextErrors.name = 'Please enter a valid name.';
    }
    if (phoneDigits.length !== 10) {
      nextErrors.phoneNumber = 'Enter a valid 10-digit phone number.';
    }
    if (!address.trim()) {
      nextErrors.address = 'Please search or enter an address.';
    }
    if (!floorDetails.trim()) {
      nextErrors.floorDetails = 'Please enter floor, door number, or building.';
    }
    if (!nearbyLocation.trim()) {
      nextErrors.nearbyLocation = 'Please enter a nearby location or landmark.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onConfirm({
        address: address.trim(),
        floorDetails: floorDetails.trim(),
        name: name.trim(),
        nearbyLocation: nearbyLocation.trim(),
        phoneNumber: phoneDigits,
        latitude,
        longitude,
      });
    }
  };

  if (isSearchingLocation) {
    return (
      <LocationPickerScreen
        recentAddresses={recentAddresses}
        savedAddresses={savedAddresses}
        onBack={() => setIsSearchingLocation(false)}
        onSaveAddress={savedAddress => {
          setSavedAddresses(addresses => [savedAddress, ...addresses.filter(item => item.label !== savedAddress.label)]);
        }}
        onSelectLocation={selectedLocation => {
          setAddress(selectedLocation.address);
          setLatitude(selectedLocation.latitude);
          setLongitude(selectedLocation.longitude);
          clearError('address');
          setRecentAddresses(addresses => [selectedLocation.address, ...addresses.filter(item => item !== selectedLocation.address)].slice(0, 5));
          setIsSearchingLocation(false);
        }}
      />
    );
  }

  const isPickup = mode === 'pickup';
  const actionLabel = isPickup ? 'Confirm Pickup Details' : 'Confirm Drop Details';
  const title = isPickup ? 'Pickup Details' : 'Drop Details';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title={title} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
        <TextInput value={name} onChangeText={value => { setName(value); clearError('name'); }} placeholder="Enter name" placeholderTextColor={colors.textMuted} style={[styles.input, errors.name && styles.fieldErrorBorder, { backgroundColor: colors.card, borderColor: errors.name ? '#DC2626' : '#DED6E8', color: colors.text }]} />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Phone Number</Text>
        <TextInput keyboardType="phone-pad" value={phoneNumber} onChangeText={value => { setPhoneNumber(value.replace(/\D/g, '').slice(0, 10)); clearError('phoneNumber'); }} placeholder="Enter phone number" placeholderTextColor={colors.textMuted} style={[styles.input, errors.phoneNumber && styles.fieldErrorBorder, { backgroundColor: colors.card, borderColor: errors.phoneNumber ? '#DC2626' : '#DED6E8', color: colors.text }]} />
        {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Address</Text>
        <Pressable accessibilityRole="button" onPress={() => setIsSearchingLocation(true)} style={[styles.addressField, errors.address && styles.fieldErrorBorder, { backgroundColor: colors.card, borderColor: errors.address ? '#DC2626' : '#DED6E8' }]}>
          <Text numberOfLines={1} style={[styles.addressValue, { color: address ? colors.text : colors.textMuted }]}>{address || 'Search location'}</Text>
          <Text style={[styles.searchIcon, { color: colors.primary }]}>⌕</Text>
        </Pressable>
        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Floor/Door No, Building</Text>
        <TextInput value={floorDetails} onChangeText={value => { setFloorDetails(value); clearError('floorDetails'); }} placeholder="e.g. Flat 402, Shreeji Heights" placeholderTextColor={colors.textMuted} style={[styles.input, errors.floorDetails && styles.fieldErrorBorder, { backgroundColor: colors.card, borderColor: errors.floorDetails ? '#DC2626' : '#DED6E8', color: colors.text }]} />
        {errors.floorDetails ? <Text style={styles.errorText}>{errors.floorDetails}</Text> : null}

        
        <Text style={[styles.nearbyTitle, { color: colors.text }]}>Nearby Location</Text>
        <TextInput
          value={nearbyLocation}
          onChangeText={value => { setNearbyLocation(value); clearError('nearbyLocation'); }}
          placeholder="Enter locality, landmark or area"
          placeholderTextColor={colors.textMuted}
          style={[styles.nearbyInput, errors.nearbyLocation && styles.fieldErrorBorder, { backgroundColor: colors.card, borderColor: errors.nearbyLocation ? '#DC2626' : '#DED6E8', color: colors.text }]}
        />
        {errors.nearbyLocation ? <Text style={styles.errorText}>{errors.nearbyLocation}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={confirmLocation} style={[styles.confirmButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.confirmText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addressField: { alignItems: 'center', borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 43, paddingLeft: 12 },
  addressValue: { flex: 1, fontSize: rf(12) },
  checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  checkMark: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '800' },
  confirmButton: { alignItems: 'center', borderRadius: 7, elevation: 4, height: 43, justifyContent: 'center', margin: 12, shadowColor: '#4E00A5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.27, shadowRadius: 4 },
  confirmText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 18 },
  errorText: { color: '#DC2626', fontSize: rf(10), lineHeight: rf(13), marginTop: 4 },
  fieldErrorBorder: { borderColor: '#DC2626' },
  favouritesRow: { alignItems: 'center', flexDirection: 'row', marginTop: 21 },
  favouritesText: { fontSize: rf(12), fontWeight: '600', marginLeft: 9 },
  input: { borderRadius: 7, borderWidth: 1, fontSize: rf(12), height: 43, paddingHorizontal: 12 },
  label: { fontSize: rf(10), fontWeight: '700', marginBottom: 7 },
  nearbyInput: { borderRadius: 7, borderWidth: 1, fontSize: rf(12), height: 43, marginTop: 8, paddingHorizontal: 12 },
  nearbyTitle: { fontSize: rf(13), fontWeight: '800', marginTop: 22 },
  nextLabel: { marginTop: 16 },
  screen: { flex: 1 },
  searchIcon: { fontSize: rf(20), marginRight: 11 },
});

export default PostLocationDetailsScreen;
