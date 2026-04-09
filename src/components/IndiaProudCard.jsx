import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';

const CARD_RADIUS = 28;

export default function IndiaProudCard() {
  const enterX = useSharedValue(-24);
  const enterOpacity = useSharedValue(0);
  const borderSpin = useSharedValue(0);
  const chakraSpin = useSharedValue(0);

  useEffect(() => {
    enterX.value = withSpring(0, { damping: 14, stiffness: 120 });
    enterOpacity.value = withTiming(1, { duration: 450 });

    borderSpin.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    chakraSpin.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, [chakraSpin, borderSpin, enterOpacity, enterX]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateX: enterX.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderSpin.value * 360}deg` }],
  }));

  const chakraStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chakraSpin.value * 360}deg` }],
  }));

  

  return (
    <Animated.View style={[styles.outer, cardStyle]}>
      <Animated.View style={[styles.glowLayer]}>
        <LinearGradient
          colors={['#FF9933', '#138808', '#FF9933']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[styles.borderLayer]}>
        <LinearGradient
          colors={['#FF9933', '#138808', '#FF9933']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.inner}>
        <View style={styles.tricolorBar}>
          <View style={styles.saffron} />
          <View style={styles.green} />
        </View>

        <Animated.View style={[styles.chakraWrap, chakraStyle]}>
          <Svg width="52" height="52" viewBox="0 0 56 56" fill="none">
            <Circle cx="28" cy="28" r="26" stroke="#1a47b8" strokeWidth="2" />
            <Circle cx="28" cy="28" r="5" stroke="#1a47b8" strokeWidth="2" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const x1 = 28 + 5 * Math.cos(rad);
              const y1 = 28 + 5 * Math.sin(rad);
              const x2 = 28 + 22 * Math.cos(rad);
              const y2 = 28 + 22 * Math.sin(rad);

              return (
                <Line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1a47b8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        </Animated.View>

        <View style={styles.textBlock}>
          <Text style={styles.kicker}>Built with pride</Text>
          <Text style={styles.title}>Made</Text>
          <Text style={styles.subtitle}>In INDIA</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.brandBlock}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Tether Chat</Text>
        </View>

        <View style={styles.tricolorBar}>
          <View style={styles.saffron} />
          <View style={styles.green} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: CARD_RADIUS,
    overflow: 'visible',
    shadowColor: '#00ff80',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'hidden',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
  },
  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    padding: 1.5,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD_RADIUS - 2,
    backgroundColor: '#0e0e0e',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tricolorBar: {
    width: 4,
    height: 64,
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: 14,
  },
  saffron: {
    flex: 1,
    backgroundColor: '#FF9933',
  },
  green: {
    flex: 1,
    backgroundColor: '#138808',
  },
  chakraWrap: {
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    lineHeight: 28,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 12,
  },
  brandBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1E90FF',
    marginBottom: 6,
  },
  brandText: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.50)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});