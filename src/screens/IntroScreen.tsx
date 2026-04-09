import React, { useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

export default function IntroScreen({ navigation }: any) {

  // Shared values
  const logoScale       = useSharedValue(0.3)
  const logoOpacity     = useSharedValue(0)
  const glowOpacity     = useSharedValue(0)
  const titleOpacity    = useSharedValue(0)
  const titleY          = useSharedValue(24)
  const taglineOpacity  = useSharedValue(0)
  const particleOpacity = useSharedValue(0)
  const progressWidth   = useSharedValue(0)
  const progressGlow    = useSharedValue(0.4)

  const navigateToWelcome = () => {
    navigation?.navigate('Welcome_Screen')
  }

  useEffect(() => {
    // 1. Logo + glow appear
    logoOpacity.value     = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    glowOpacity.value     = withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) })
    particleOpacity.value = withTiming(1, { duration: 1000 })
    logoScale.value       = withSpring(1, { damping: 12, stiffness: 80 })

    // 2. Title slides up
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }))
    titleY.value       = withDelay(500, withSpring(0, { damping: 14, stiffness: 100 }))

    // 3. Tagline fades in
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 400 }))

    // 4. Progress bar fills then navigate
    progressWidth.value = withDelay(
      300,
      withTiming(width - 80, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }, (finished) => {
        if (finished) runOnJS(navigateToWelcome)()
      })
    )

    // 5. Progress tip glow pulse
    progressGlow.value = withDelay(700,
      withSequence(
        withTiming(1,   { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
        withTiming(1,   { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
        withTiming(1,   { duration: 600 }),
        withTiming(0.4, { duration: 400 }),
      )
    )
  }, [])

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }))

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }))

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }))

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }))

  const progressTipStyle = useAnimatedStyle(() => ({
    opacity: progressGlow.value,
  }))

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020818" />

      {/* Background layers */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />
      <View style={styles.bgLayer3} />

      {/* Subtle grid */}
      <View style={styles.gridContainer}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: (height / 8) * i }]} />
        ))}
      </View>

      {/* Floating particles */}
      <Animated.View style={[styles.particlesContainer, particleStyle]}>
        <View style={[styles.particle, { top: height * 0.15, left: width * 0.10, width: 3,  height: 3  }]} />
        <View style={[styles.particle, { top: height * 0.20, left: width * 0.85, width: 2,  height: 2  }]} />
        <View style={[styles.particle, { top: height * 0.35, left: width * 0.05, width: 4,  height: 4, opacity: 0.4 }]} />
        <View style={[styles.particle, { top: height * 0.65, left: width * 0.90, width: 3,  height: 3  }]} />
        <View style={[styles.particle, { top: height * 0.75, left: width * 0.15, width: 2,  height: 2  }]} />
        <View style={[styles.particle, { top: height * 0.55, left: width * 0.78, width: 5,  height: 5, opacity: 0.3 }]} />
        <View style={[styles.particle, { top: height * 0.28, left: width * 0.60, width: 2,  height: 2  }]} />
        <View style={[styles.particle, { top: height * 0.82, left: width * 0.45, width: 3,  height: 3, opacity: 0.5 }]} />
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Glow behind logo */}
        <Animated.View style={[styles.logoGlow, glowStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../../assets/ic_launcher.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.titleWrapper, titleStyle]}>
          <Text style={styles.appName}>Tether</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Connect beyond limits
        </Animated.Text>

      </View>

      {/* Bottom — progress bar */}
      <View style={styles.bottomSection}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <Animated.View style={[styles.progressTip, progressTipStyle]} />
          </Animated.View>
        </View>
        <Text style={styles.bottomLabel}>© 2025 Tether. All rights reserved.</Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020818',
  },

  // Background
  bgLayer1: {
    position: 'absolute',
    top: -height * 0.3,
    left: -width * 0.3,
    width: width * 1.6,
    height: height * 0.8,
    borderRadius: width,
    backgroundColor: '#0a1628',
    opacity: 0.8,
  },
  bgLayer2: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width,
    backgroundColor: '#0d2251',
    opacity: 0.25,
  },
  bgLayer3: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width,
    height: height * 0.5,
    borderRadius: width,
    backgroundColor: '#051535',
    opacity: 0.6,
  },

  // Grid
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1a3a6e',
    opacity: 0.15,
  },

  // Particles
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#4d9fff',
    opacity: 0.6,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },

  logoGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1a5ccc',
    opacity: 0.22,
    marginBottom: 120,  // glow circle upar, content neeche
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 0,
    shadowColor: '#2979ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  titleWrapper: {
    alignItems: 'center',
    marginTop: 28,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#2979ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    marginTop: 8,
    width: 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#2979ff',
  },

  tagline: {
    marginTop: 46,
    fontSize: 13,
    color: '#5a8fd4',
    letterSpacing: 3,
    fontWeight: '400',
    textTransform: 'uppercase',
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  progressTrack: {
    width: width - 80,
    height: 3,
    backgroundColor: '#0d2251',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2979ff',
    borderRadius: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  progressTip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#82b4ff',
    marginRight: -4,
    shadowColor: '#82b4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomLabel: {
    fontSize: 11,
    color: '#2a3f6e',
    letterSpacing: 0.5,
  },
})