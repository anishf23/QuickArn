import { useEffect, useRef, useState, type ComponentRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Modal, PermissionsAndroid, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Geolocation, { PositionError } from 'react-native-geolocation-service';

import { useAppTheme } from '../../theme/AppTheme';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import PostJobHeader from './components/PostJobHeader';
import { rf } from '../../utils/responsive';

type LocationPickerScreenProps = {
  recentAddresses: string[];
  savedAddresses: SavedAddress[];
  onBack: () => void;
  onSaveAddress: (savedAddress: SavedAddress) => void;
  onSelectLocation: (address: string) => void;
};

export type SavedAddress = {
  address: string;
  label: 'Home' | 'Work';
};

type NominatimResult = {
  address?: {
    city_district?: string;
    country?: string;
    county?: string;
    state_district?: string;
  };
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

type NominatimReverseResult = {
  display_name?: string;
};

const nominatimHeaders = {
  Accept: 'application/json',
  'Accept-Language': 'en',
  'User-Agent': 'QuickArn/1.0',
};

const SAVED_ADDRESSES_STORAGE_KEY = '@quickarn/saved-addresses';
const RECENT_ADDRESSES_STORAGE_KEY = '@quickarn/recent-addresses';

function getDistrictAndCountry(result: NominatimResult) {
  const district =
    result.address?.city_district ||
    result.address?.state_district ||
    result.address?.county;
  const country = result.address?.country;

  if (district || country) {
    return [district, country].filter(Boolean).join(', ');
  }

  return result.display_name.split(',').map(part => part.trim()).slice(-2).join(', ');
}

function LocationPickerScreen({ recentAddresses, savedAddresses, onBack, onSaveAddress, onSelectLocation }: LocationPickerScreenProps) {
  const { colors } = useAppTheme();
  const primaryActionColor = { color: colors.primary };
  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [pendingSavedAddress, setPendingSavedAddress] = useState<string | null>(null);
  const [storedAddresses, setStoredAddresses] = useState<SavedAddress[]>([]);
  const [storedRecentAddresses, setStoredRecentAddresses] = useState<string[]>([]);

  const allSavedAddresses = [...savedAddresses, ...storedAddresses.filter(stored => !savedAddresses.some(address => address.label === stored.label))];
  const allRecentAddresses = [...new Set([...recentAddresses, ...storedRecentAddresses])].slice(0, 5);

  useEffect(() => {
    const restoreLocationStorage = async () => {
      try {
        const [savedValue, recentValue] = await Promise.all([
          AsyncStorage.getItem(SAVED_ADDRESSES_STORAGE_KEY),
          AsyncStorage.getItem(RECENT_ADDRESSES_STORAGE_KEY),
        ]);
        const restoredSavedAddresses = savedValue ? JSON.parse(savedValue) : [];
        const restoredRecentAddresses = recentValue ? JSON.parse(recentValue) : [];

        if (Array.isArray(restoredSavedAddresses)) {
          setStoredAddresses(restoredSavedAddresses.filter((item): item is SavedAddress => (
            typeof item?.address === 'string' && (item.label === 'Home' || item.label === 'Work')
          )));
        }
        if (Array.isArray(restoredRecentAddresses)) {
          setStoredRecentAddresses(restoredRecentAddresses.filter((item): item is string => typeof item === 'string').slice(0, 5));
        }
      } catch {
        // A storage read failure should not prevent location search from working.
      }
    };

    restoreLocationStorage().catch(() => {});
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(normalizedQuery)}`,
          { headers: nominatimHeaders, signal: controller.signal },
        );
        setResults((await response.json()) as NominatimResult[]);
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(searchTimer);
    };
  }, [query]);

  const reverseGeocodeAndSelect = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: nominatimHeaders },
      );
      const result = (await response.json()) as NominatimReverseResult;
      const address = result.display_name || 'Current location';
      selectAddress(address);
    } catch {
      selectAddress('Current location');
    } finally {
      setIsLocating(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocationError('');
    try {
      if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const granted =
          permissions[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          permissions[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        if (!granted) {
          setLocationError('Location permission is needed to use your current location.');
          return;
        }
      } else {
        const authorization = await Geolocation.requestAuthorization('whenInUse');
        if (authorization !== 'granted') {
          setLocationError('Location permission is needed to use your current location.');
          return;
        }
      }

      setIsLocating(true);
      Geolocation.getCurrentPosition(
        position => {
          reverseGeocodeAndSelect(position.coords.latitude, position.coords.longitude);
        },
        error => {
          setIsLocating(false);
          setLocationError(
            error.code === PositionError.SETTINGS_NOT_SATISFIED
              ? 'Turn on device location services and try again.'
              : error.message || 'Unable to get your current location.',
          );
        },
        {
          accuracy: { android: 'high', ios: 'best' },
          enableHighAccuracy: true,
          forceRequestLocation: true,
          showLocationDialog: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch {
      setLocationError('Unable to request location permission. Please try again.');
    }
  };

  const addAddress = () => {
    setIsSavingAddress(true);
    setQuery('');
    searchInputRef.current?.focus();
  };

  const selectSearchResult = (address: string) => {
    selectAddress(address);
  };

  const rememberRecentAddress = (address: string) => {
    const nextRecentAddresses = [address, ...allRecentAddresses.filter(item => item !== address)].slice(0, 5);
    setStoredRecentAddresses(nextRecentAddresses);
    AsyncStorage.setItem(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify(nextRecentAddresses)).catch(() => {});
  };

  const selectAddress = (address: string, saveAsRecent = true) => {
    if (isSavingAddress) {
      setPendingSavedAddress(address);
      return;
    }
    if (saveAsRecent) {
      rememberRecentAddress(address);
    }
    onSelectLocation(address);
  };

  const saveAddressWithLabel = (label: SavedAddress['label']) => {
    if (!pendingSavedAddress) {
      return;
    }

    const savedAddress = { address: pendingSavedAddress, label };
    const nextSavedAddresses = [savedAddress, ...allSavedAddresses.filter(item => item.label !== label)];

    setStoredAddresses(nextSavedAddresses);
    AsyncStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(nextSavedAddresses)).catch(() => {});
    onSaveAddress(savedAddress);
    onSelectLocation(pendingSavedAddress);
    setPendingSavedAddress(null);
    setIsSavingAddress(false);
  };

  const isShowingSearchResults = query.trim().length >= 3;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PostJobHeader onBack={onBack} title="Select Location" />
      <View style={styles.content}>
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.searchIcon,{color:colors.primary}]}>⌕</Text>
          <TextInput
            ref={searchInputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search locality, sector, area"
            placeholderTextColor="#8B919A"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {isSearching && <ActivityIndicator color={colors.primary} size="small" />}
        </View>

        {!isShowingSearchResults && <>
          <View style={[styles.actionCard, { backgroundColor: colors.card }]}>
            <Pressable accessibilityRole="button" onPress={addAddress} style={styles.actionRow}>
              <Text style={[styles.actionIcon, primaryActionColor]}>＋</Text>
              <Text style={[styles.actionText, primaryActionColor]}>Add address</Text>
              <Text style={[styles.actionArrow, { color: colors.text }]}>›</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable accessibilityRole="button" onPress={useCurrentLocation} style={styles.actionRow}>
              <Text style={[styles.actionIcon, primaryActionColor]}>⌾</Text>
              <Text style={[styles.actionText, primaryActionColor]}>{isLocating ? 'Getting current location...' : 'Use current location'}</Text>
              {isLocating ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[styles.actionArrow, { color: colors.text }]}>›</Text>}
            </Pressable>
          </View>
          <Text style={styles.savedAddressesTitle}>SAVED ADDRESSES</Text>
          {allSavedAddresses.map(savedAddress => (
            <Pressable key={savedAddress.label} accessibilityRole="button" onPress={() => selectAddress(savedAddress.address, false)} style={[styles.addressRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.addressPin, primaryActionColor]}>●</Text>
              <View style={styles.addressTextWrap}>
                <Text style={[styles.addressLabel, { color: colors.text }]}>{savedAddress.label}</Text>
                <Text numberOfLines={1} style={[styles.addressText, { color: colors.textMuted }]}>{savedAddress.address}</Text>
              </View>
            </Pressable>
          ))}
          {allSavedAddresses.length === 0 && <Text style={[styles.emptySavedText, { color: colors.textMuted }]}>No saved addresses yet.</Text>}
          {allRecentAddresses.length > 0 && <>
            <Text style={styles.recentTitle}>RECENT SEARCHES</Text>
            {allRecentAddresses.map(address => (
              <Pressable key={address} accessibilityRole="button" onPress={() => selectAddress(address, false)} style={[styles.addressRow, { backgroundColor: colors.card }]}>
                <Text style={[styles.addressPin, { color: colors.textMuted }]}>◷</Text>
                <Text numberOfLines={1} style={[styles.addressText, { color: colors.text }]}>{address}</Text>
              </Pressable>
            ))}
          </>}
          {!!locationError && <Text style={styles.errorText}>{locationError}</Text>}
        </>}

        {isShowingSearchResults && <>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>Search Results</Text>
          {results.length === 0 && !isSearching ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching addresses found.</Text>
          ) : (
            <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
              {results.map(result => (
                <Pressable
                  key={result.place_id}
                  accessibilityRole="button"
                  onPress={() => selectSearchResult(result.display_name)}
                  style={styles.result}
                >
                  <Text style={[styles.resultPin,{color:colors.primary}]}>●</Text>
                  <View style={styles.resultTextWrap}>
                    <Text numberOfLines={2} style={[styles.resultAddress, { color: colors.text }]}>{result.display_name}</Text>
                    <Text style={[styles.locationContext, { color: colors.textMuted }]}>{getDistrictAndCountry(result)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>}
      </View>

      <Modal animationType="fade" transparent visible={!!pendingSavedAddress} onRequestClose={() => setPendingSavedAddress(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.saveModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Save address as</Text>
            <Text numberOfLines={2} style={[styles.modalAddress, { color: colors.textMuted }]}>{pendingSavedAddress}</Text>
            <View style={styles.saveOptions}>
              <Pressable accessibilityRole="button" onPress={() => saveAddressWithLabel('Home')} style={[styles.saveOption, { borderColor: colors.primary }]}>
                <Text style={[styles.saveOptionIcon, primaryActionColor]}>⌂</Text>
                <Text style={[styles.saveOptionText, { color: colors.primary }]}>Home</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => saveAddressWithLabel('Work')} style={[styles.saveOption, { borderColor: colors.primary }]}>
                <Text style={[styles.saveOptionIcon, primaryActionColor]}>▣</Text>
                <Text style={[styles.saveOptionText, { color: colors.primary }]}>Work</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" onPress={() => { setPendingSavedAddress(null); setIsSavingAddress(false); }} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionArrow: { fontSize: 25, fontWeight: '300', lineHeight: 22 },
  actionCard: { borderRadius: 14, elevation: 3, marginTop: 16, overflow: 'hidden', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 9 },
  actionDivider: { backgroundColor: '#E5E7EB', height: StyleSheet.hairlineWidth },
  actionIcon: { fontSize: 21, fontWeight: '400', marginRight: 12, width: 25 },
  actionRow: { alignItems: 'center', flexDirection: 'row', height: 73, paddingHorizontal: 16 },
  actionText: { flex: 1, fontSize: 16, fontWeight: '700' },
  addressPin: { fontSize: 14, marginRight: 10 },
  addressLabel: { fontSize: rf(13), fontWeight: '800' },
  addressRow: { alignItems: 'center', borderRadius: 8, elevation: 1, flexDirection: 'row', marginTop: 8, paddingHorizontal: 12, paddingVertical: 11, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
  addressText: { fontSize: rf(12), marginTop: 2 },
  addressTextWrap: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },
  emptyText: { fontSize: 12, marginTop: 12, textAlign: 'center' },
  emptySavedText: { fontSize: 12, marginLeft: -2, marginTop: 9 },
  errorText: { color: '#D14343', fontSize: 12, marginTop: 12 },
  locationContext: { fontSize: 10, marginTop: 3 },
  result: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12 },
  resultAddress: { fontSize: 13, fontWeight: '700' },
  resultPin: { fontSize: 15, marginRight: 10, marginTop: 2 },
  resultTextWrap: { flex: 1 },
  recentTitle: { color: '#8B919A', fontSize: 14, fontWeight: '800', marginLeft: -2, marginTop: 20 },
  resultsCard: { borderRadius: 12, elevation: 2, marginTop: 9, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  resultsTitle: { fontSize: 15, fontWeight: '800', marginTop: 18 },
  savedAddressesTitle: { color: '#8B919A', fontSize: 14, fontWeight: '800', marginLeft: -2, marginTop: 22 },
  cancelButton: { alignItems: 'center', marginTop: 19, paddingVertical: 7 },
  cancelText: { fontSize: 13, fontWeight: '700' },
  modalAddress: { fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: 'center' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.42)', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  modalTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  saveModal: { borderRadius: 16, elevation: 10, maxWidth: 350, padding: 21, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 14, width: '100%' },
  saveOption: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 75, padding: 8 },
  saveOptionIcon: { fontSize: 22 },
  saveOptionText: { fontSize: 13, fontWeight: '800', marginTop: 5 },
  saveOptions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  screen: { flex: 1 },
  searchBox: { alignItems: 'center', borderColor: '#D9D9DF', borderRadius: 13, borderWidth: 1, elevation: 2, flexDirection: 'row', height: 56, paddingHorizontal: 15, shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5 },
  searchIcon: {  fontSize: 21, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
});

export default LocationPickerScreen;
