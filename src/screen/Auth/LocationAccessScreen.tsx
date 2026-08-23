import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Geolocation, { GeoError, PositionError } from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { LocalizedText as Text } from '../../localization/AppLocalization';
import { updateCurrentUser } from '../../services/firebaseUser';
import { reverseGeocode } from '../../services/reverseGeocode';
import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp } from '../../utils/responsive';

type LocationPhase = 'intro' | 'fetching' | 'success' | 'error';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationAccess'>;

const isGeoError = (error: unknown): error is GeoError =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  'message' in error;

const getPosition = (highAccuracy: boolean) =>
  new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      reject,
      {
        accuracy: highAccuracy
          ? { android: 'high', ios: 'best' }
          : { android: 'balanced', ios: 'nearestTenMeters' },
        enableHighAccuracy: highAccuracy,
        forceRequestLocation: true,
        maximumAge: 0,
        showLocationDialog: true,
        timeout: highAccuracy ? 20000 : 12000,
      },
    );
  });

function LocationAccessScreen({ navigation, route }: Props) {
  const { colors, isDark } = useAppTheme();
  const shouldSaveLocation = route.params?.saveLocation === true;
  const pulse = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState<LocationPhase>('fetching');
  const [locationName, setLocationName] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        duration: 1800,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.65],
        }),
      },
    ],
  };

  const getCurrentAddress = useCallback(
    async (latitude: number, longitude: number) => {
      let address = `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      let locality = 'Current location';
      let state = '';

      try {
        const resolvedLocation = await reverseGeocode(latitude, longitude);
        locality = resolvedLocation.city;
        address = resolvedLocation.address;
        state = resolvedLocation.state;
      } catch {
        // GPS coordinates are still useful when the reverse-geocoding service is unavailable.
      }

      setLocationName(locality);
      setLocationLabel(address);
      setPhase('success');

      if (shouldSaveLocation) {
        await updateCurrentUser({
          address,
          city: locality,
          state,
          latitude,
          longitude,
          isProfileCompleted: true,
        });
      }

      navigation.replace('Main', { address });
    },
    [navigation, shouldSaveLocation],
  );

  const fetchLocation = useCallback(async () => {
    setPhase('fetching');
    setErrorMessage('');

    try {
      let coordinates: { latitude: number; longitude: number };
      try {
        coordinates = await getPosition(true);
      } catch {
        coordinates = await getPosition(false);
      }

      await getCurrentAddress(coordinates.latitude, coordinates.longitude);
    } catch (error) {
      if (isGeoError(error) && error.code === PositionError.SETTINGS_NOT_SATISFIED) {
        setErrorMessage('Turn on GPS or device location services, then try again.');
      } else if (isGeoError(error) && error.code === PositionError.PERMISSION_DENIED) {
        setErrorMessage('Location permission was denied. Please allow it in Settings.');
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to save your current location. Please try again.',
        );
      }
      setPhase('error');
    }
  }, [getCurrentAddress]);

  const requestCurrentLocation = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const allowed =
          permissions[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED;

        if (!allowed) {
          setErrorMessage(
            'Location permission is needed to show services near you.',
          );
          setPhase('error');
          return;
        }
      } else {
        const authorization = await Geolocation.requestAuthorization(
          'whenInUse',
        );

        if (authorization !== 'granted') {
          setErrorMessage(
            authorization === 'disabled'
              ? 'Turn on device location services, then reopen QuickArn.'
              : 'Location permission is needed to show services near you.',
          );
          setPhase('error');
          return;
        }
      }

      fetchLocation();
    } catch {
      setErrorMessage(
        'Unable to request location permission. Please try again.',
      );
      setPhase('error');
    }
  }, [fetchLocation]);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  const title =
    phase === 'fetching'
      ? 'Fetching location...'
      : phase === 'success'
      ? locationName
      : 'Location unavailable';
  const description =
    phase === 'fetching'
      ? 'Please wait while we find your current location.'
      : phase === 'success'
      ? locationLabel
      : errorMessage;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.animationArea}>
          <View
            style={[
              styles.outerRing,
              { borderColor: isDark ? '#19375D' : '#E6F3FF' },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: isDark ? '#2C72B7' : '#CFE9FF' },
              pulseStyle,
            ]}
          />
          <View
            style={[
              styles.mapCircle,
              { backgroundColor: isDark ? '#102A4C' : '#E6F3FF' },
            ]}
          >
            <View style={styles.pin}>
              <View style={styles.pinDot} />
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {description}
        </Text>
        {phase === 'error' ? (
          <Pressable
            accessibilityRole="button"
            onPress={requestCurrentLocation}
            style={[styles.retryButton, { backgroundColor: brandColors.blue }]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  animationArea: {
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
    marginTop: 30,
  },
  content: { flex: 1, paddingHorizontal: 28 ,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  mapCircle: {
    alignItems: 'center',
    borderRadius: 72,
    height: 144,
    justifyContent: 'center',
    width: 144,
  },
  outerRing: {
    borderRadius: 112,
    borderWidth: 2,
    height: 224,
    position: 'absolute',
    width: 224,
  },
  pin: {
    alignItems: 'center',
    backgroundColor: brandColors.orange,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  pinDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  pulseRing: {
    borderRadius: 84,
    borderWidth: 2,
    height: hp(20),
    position: 'absolute',
    width: hp(20),
  },
  retryButton: {
    alignSelf: 'center',
    borderRadius: 12,
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  safeArea: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
});

export default LocationAccessScreen;
