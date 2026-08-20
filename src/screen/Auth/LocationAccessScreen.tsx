import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Geolocation, { PositionError } from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { brandColors, useAppTheme } from '../../theme/AppTheme';

type LocationPhase = 'intro' | 'fetching' | 'success' | 'error';

type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
  };
  display_name?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'LocationAccess'>;

function LocationAccessScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
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
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        );

        if (!response.ok) {
          throw new Error('Address lookup failed.');
        }

        const result = (await response.json()) as ReverseGeocodeResponse;
        const locality =
          result.address?.suburb ||
          result.address?.city ||
          result.address?.town ||
          result.address?.village ||
          'Current location';

        const address =
          result.display_name ||
          'Your current address could not be identified.';

        setLocationName(locality);
        setLocationLabel(address);
        navigation.replace('Main', { address });
      } catch {
        const address = 'Your current address could not be identified.';

        setLocationName('Current location');
        setLocationLabel(address);
        navigation.replace('Main', { address });
      }

      setPhase('success');
    },
    [navigation],
  );

  const fetchLocation = useCallback(() => {
    setPhase('fetching');
    setErrorMessage('');

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        void getCurrentAddress(latitude, longitude);
      },
      error => {
        if (error.code === PositionError.SETTINGS_NOT_SATISFIED) {
          setErrorMessage(
            'Turn on GPS or device location services, then reopen QuickArn.',
          );
        } else if (error.code === PositionError.PERMISSION_DENIED) {
          setErrorMessage('Location permission was denied.');
        } else {
          setErrorMessage(
            error.message || 'Unable to get your current location.',
          );
        }
        setPhase('error');
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
            PermissionsAndroid.RESULTS.GRANTED ||
          permissions[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
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
  content: { flex: 1, paddingHorizontal: 28 },
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
    height: 168,
    position: 'absolute',
    width: 168,
  },
  safeArea: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
});

export default LocationAccessScreen;
