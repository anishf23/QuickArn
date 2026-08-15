import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors, useAppTheme } from '../../theme/AppTheme';
import { hp, rf } from '../../utils/responsive';

function LocationAccessScreen() {
  const { colors, isDark } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

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

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.animationArea}>
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: brandColors.blue },
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

        <Text style={[styles.title, { color: colors.text }]}>
          Find services near you
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Allow location access to see trusted professionals and services
          available around you.
        </Text>

        <Pressable style={styles.locationButton}>
          <Text style={styles.locationButtonText}>Use current location</Text>
        </Pressable>
        <Pressable style={styles.manualButton}>
          <Text style={[styles.manualButtonText, { color: colors.text }]}>
            Enter location manually
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  animationArea: {
    alignItems: 'center',
    height: hp(32),
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 28 },
  description: {
    fontSize: rf(16),
    lineHeight: hp(3),
    marginTop: hp(1.8),
    textAlign: 'center',
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: brandColors.blue,
    borderRadius: 16,
    height: hp(7),
    justifyContent: 'center',
    marginTop: hp(6),
  },
  locationButtonText: { color: '#FFFFFF', fontSize: rf(17), fontWeight: '700' },
  manualButton: { alignItems: 'center', marginTop: hp(2.5), padding: 10 },
  manualButtonText: {
    fontSize: rf(16),
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  mapCircle: {
    alignItems: 'center',
    borderRadius: hp(11),
    height: hp(22),
    justifyContent: 'center',
    width: hp(22),
  },
  pin: {
    alignItems: 'center',
    backgroundColor: brandColors.orange,
    borderRadius: hp(3),
    height: hp(6),
    justifyContent: 'center',
    width: hp(6),
  },
  pinDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1),
    height: hp(2),
    width: hp(2),
  },
  pulseRing: {
    borderRadius: hp(14),
    borderWidth: 2,
    height: hp(28),
    position: 'absolute',
    width: hp(28),
  },
  safeArea: { flex: 1 },
  title: { fontSize: rf(28), fontWeight: '800', textAlign: 'center' },
});

export default LocationAccessScreen;
