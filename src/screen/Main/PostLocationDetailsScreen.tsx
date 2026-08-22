import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { rf } from '../../utils/responsive';
import LocationPickerScreen, { type SavedAddress } from './LocationPickerScreen';
import PostJobHeader from './components/PostJobHeader';

export type PostLocationMode = 'pickup' | 'drop';

type PostLocationDetailsScreenProps = {
  initialAddress: string;
  mode: PostLocationMode;
  onBack: () => void;
  onConfirm: (address: string) => void;
};

function PostLocationDetailsScreen({ initialAddress, mode, onBack, onConfirm }: PostLocationDetailsScreenProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [floorDetails, setFloorDetails] = useState('');
  const [addToFavourites, setAddToFavourites] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);

  if (isSearchingLocation) {
    return (
      <LocationPickerScreen
        recentAddresses={recentAddresses}
        savedAddresses={savedAddresses}
        onBack={() => setIsSearchingLocation(false)}
        onSaveAddress={savedAddress => {
          setSavedAddresses(addresses => [savedAddress, ...addresses.filter(item => item.label !== savedAddress.label)]);
        }}
        onSelectLocation={selectedAddress => {
          setAddress(selectedAddress);
          setRecentAddresses(addresses => [selectedAddress, ...addresses.filter(item => item !== selectedAddress)].slice(0, 5));
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
        <TextInput value={name} onChangeText={setName} placeholder="Enter name" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: '#DED6E8', color: colors.text }]} />

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Phone Number</Text>
        <TextInput keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter phone number" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: '#DED6E8', color: colors.text }]} />

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Address</Text>
        <Pressable accessibilityRole="button" onPress={() => setIsSearchingLocation(true)} style={[styles.addressField, { backgroundColor: colors.card, borderColor: '#DED6E8' }]}>
          <Text numberOfLines={1} style={[styles.addressValue, { color: address ? colors.text : colors.textMuted }]}>{address || 'Search location'}</Text>
          <Text style={[styles.searchIcon, { color: colors.primary }]}>⌕</Text>
        </Pressable>

        <Text style={[styles.label, styles.nextLabel, { color: colors.textMuted }]}>Floor/Door No, Building</Text>
        <TextInput value={floorDetails} onChangeText={setFloorDetails} placeholder="e.g. Flat 402, Shreeji Heights" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: '#DED6E8', color: colors.text }]} />

        
        <Text style={[styles.nearbyTitle, { color: colors.text }]}>Nearby Location</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Enter locality, landmark or area"
          placeholderTextColor={colors.textMuted}
          style={[styles.nearbyInput, { backgroundColor: colors.card, borderColor: '#DED6E8', color: colors.text }]}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => onConfirm(address)} style={[styles.confirmButton, { backgroundColor: colors.primary }]}>
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
