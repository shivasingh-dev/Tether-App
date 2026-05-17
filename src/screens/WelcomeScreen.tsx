import React, { useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { fontFamilies } from '../constants/fonts'
import LinearGradient from 'react-native-linear-gradient'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }: any) {

  const logoScale = useSharedValue(0.4)
  const logoOpacity = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const titleOpacity = useSharedValue(0)
  const titleY = useSharedValue(20)
  const descOpacity = useSharedValue(0)
  const btnOpacity = useSharedValue(0)
  const btnY = useSharedValue(30)

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 })
    logoScale.value = withSpring(1, { damping: 12, stiffness: 80 })
    glowOpacity.value = withTiming(1, { duration: 900 })

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
    titleY.value = withDelay(400, withSpring(0, { damping: 14, stiffness: 100 }))

    descOpacity.value = withDelay(700, withTiming(1, { duration: 500 }))

    btnOpacity.value = withDelay(900, withTiming(1, { duration: 500 }))
    btnY.value = withDelay(900, withSpring(0, { damping: 14, stiffness: 100 }))
  }, [])

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

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
  }))

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }))

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020818" />

      {/* Background layers */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />
      <View style={styles.bgLayer3} />

      {/* Grid lines */}
      <View style={styles.gridContainer}>
        {[...Array(8)].map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: (height / 8) * i }]} />
        ))}
        {[...Array(5)].map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (width / 5) * i }]} />
        ))}
      </View>

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        <View style={[styles.particle, { top: height * 0.12, left: width * 0.08, width: 3, height: 3 }]} />
        <View style={[styles.particle, { top: height * 0.18, left: width * 0.88, width: 2, height: 2 }]} />
        <View style={[styles.particle, { top: height * 0.30, left: width * 0.04, width: 4, height: 4, opacity: 0.35 }]} />
        <View style={[styles.particle, { top: height * 0.60, left: width * 0.92, width: 3, height: 3 }]} />
        <View style={[styles.particle, { top: height * 0.72, left: width * 0.12, width: 2, height: 2 }]} />
        <View style={[styles.particle, { top: height * 0.50, left: width * 0.80, width: 5, height: 5, opacity: 0.25 }]} />
      </View>

      {/* Center content — Logo */}
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoGlow, glowStyle]} />

        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../../assets/ic_launcher.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>

        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Welcome to Tether</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View style={descStyle}>
          <Text style={styles.description}>
            Read our{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://tether-policy-page.vercel.app/')}>Privacy Policy</Text>
            {'. Tap "Agree and continue"\nto accept our '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://tether-policy-page.vercel.app/')}>Terms of Service</Text>
            {'.'}
          </Text>
        </Animated.View>

        {/* Language selector */}
        {/* <Animated.View style={[styles.langContainer, descStyle]}>
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>English</Text>
          <Text style={styles.langChevron}>⌄</Text>
        </Animated.View> */}

        {/* Agree button */}
        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <TouchableOpacity
            activeOpacity={0.3}
            onPress={() => navigation?.navigate('Register_Screen')}
          >
            <LinearGradient
              colors={['#2979ff', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.agreeButton}
            >
              <Text style={styles.agreeText}>Agree and continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020818',
  },

  // Backgrounds
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
    top: height * 0.05,
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
  gridLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1a3a6e',
    opacity: 0.12,
  },
  gridLineV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#1a3a6e',
    opacity: 0.08,
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
    opacity: 0.55,
  },

  // Center logo
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  logoGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#1a5ccc',
    opacity: 0.2,
  },
  logoContainer: {
    width: 140,
    height: 140,
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

  // Bottom
  bottomContent: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
    position: "relative",
    top: -50
  },

  title: {
    fontSize: 28,
    fontFamily: fontFamilies.bold,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#2979ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  description: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    color: '#5a8fd4',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  link: {
    color: '#4d9fff',
    fontFamily: fontFamilies.semiBold,
    textDecorationLine: 'underline'
  },

  // Language pill
  langContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0d2251',
    borderWidth: 1,
    borderColor: '#1a3a6e',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  langIcon: {
    fontSize: 16,
  },
  langText: {
    fontSize: 15,
    fontFamily: fontFamilies.medium,
    color: '#ffffff',
  },
  langChevron: {
    fontSize: 16,
    color: '#5a8fd4',
    marginTop: -2,
  },

  // Agree button
  btnWrapper: {
    width: '100%',
    marginTop: 8,
  },
  agreeButton: {
    backgroundColor: '#2979ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2979ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  agreeText: {
    fontSize: 19,
    fontFamily: fontFamilies.semiBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
})