import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type ShimmerProps = {
  style?: StyleProp<ViewStyle>;
};

/** Lightweight dependency-free loading placeholder. */
function Shimmer({ style }: ShimmerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(progress, {
      duration: 1050,
      toValue: 1,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-240, 420] });

  return (
    <View style={[styles.base, style]}>
      <Animated.View style={[styles.highlight, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#E8ECF2', overflow: 'hidden' },
  highlight: { backgroundColor: 'rgba(255,255,255,0.62)', bottom: 0, left: 0, position: 'absolute', top: 0, width: '42%' },
});

export default Shimmer;
