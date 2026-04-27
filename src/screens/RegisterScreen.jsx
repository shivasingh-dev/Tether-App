import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { fontFamilies } from '../constants/fonts'
import { colors } from '../constants/colors'
import LinearGradient from 'react-native-linear-gradient'
import IndiaProudCard from '../components/IndiaProudCard'

const { width, height } = Dimensions.get('window')

export default function LoginScreen({ navigation }) {

  // Shared values
  const headerOpacity  = useSharedValue(0)
  const headerY        = useSharedValue(30)
  const noticeOpacity  = useSharedValue(0)
  const badgeOpacity   = useSharedValue(0)
  const badgeScale     = useSharedValue(0.85)
  const cardOpacity    = useSharedValue(0)
  const cardY          = useSharedValue(24)
  const btnOpacity     = useSharedValue(0)
  const btnY           = useSharedValue(20)
  const particleOpacity = useSharedValue(0)

  useEffect(() => {
    // Particles
    particleOpacity.value = withTiming(1, { duration: 800 })

    // Header slides up
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    headerY.value       = withSpring(0, { damping: 14, stiffness: 100 })

    // Notice text fades in
    noticeOpacity.value = withDelay(300, withTiming(1, { duration: 450 }))

    // Badge pops in
    badgeOpacity.value = withDelay(550, withTiming(1, { duration: 400 }))
    badgeScale.value   = withDelay(550, withSpring(1, { damping: 12, stiffness: 90 }))

    // Card slides up
    cardOpacity.value = withDelay(700, withTiming(1, { duration: 450 }))
    cardY.value       = withDelay(700, withSpring(0, { damping: 14, stiffness: 100 }))

    // Button fades in last
    btnOpacity.value = withDelay(950, withTiming(1, { duration: 400 }))
    btnY.value       = withDelay(950, withSpring(0, { damping: 14, stiffness: 100 }))
  }, [])

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }))

  const noticeStyle = useAnimatedStyle(() => ({
    opacity: noticeOpacity.value,
  }))

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }))

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }))

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }))

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }))

  return (
    <SafeAreaView style={styles.outermost}>

      {/* Background layers — same as IntroScreen */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />

      {/* Grid lines */}
      <View style={styles.gridContainer}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: (height / 8) * i }]} />
        ))}
      </View>

      {/* Particles */}
      <Animated.View style={[styles.particlesContainer, particleStyle]}>
        <View style={[styles.particle, { top: height * 0.12, left: width * 0.08,  width: 3, height: 3 }]} />
        <View style={[styles.particle, { top: height * 0.22, left: width * 0.88,  width: 2, height: 2 }]} />
        <View style={[styles.particle, { top: height * 0.55, left: width * 0.06,  width: 4, height: 4, opacity: 0.3 }]} />
        <View style={[styles.particle, { top: height * 0.72, left: width * 0.82,  width: 3, height: 3 }]} />
        <View style={[styles.particle, { top: height * 0.85, left: width * 0.20,  width: 2, height: 2 }]} />
      </Animated.View>

      {/* Notice container */}
      <View style={styles.noticeContainer}>
        <Animated.Text style={[styles.noticeText, styles.headerText, headerStyle]}>
          Verify your details
        </Animated.Text>

        <Animated.Text style={[styles.noticeText, noticeStyle]}>
          Tether will need to verify your phone number & your Email Id.
        </Animated.Text>

        <Animated.View style={badgeStyle}>
          <LinearGradient
            colors={['#B8860B', '#A67C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerMsg}
          >
            <Text style={styles.noticeText}>Tether is only available in India</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* India Proud Card */}
      <Animated.View style={cardStyle}>
        <IndiaProudCard />
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={[btnStyle]}>
        <TouchableOpacity activeOpacity={0.4} onPress={() => navigation.navigate('SignUp_Screen')}>
          <LinearGradient
            style={styles.btnCover}
            colors={['#4facfe', '#5f6afc', '#8e44ad']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.button}>Proceed to Sign UP</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outermost: {
    backgroundColor: '#020818',
    flex: 1,
  },

  // Background — matches IntroScreen
  bgLayer1: {
    position: 'absolute',
    top: -height * 0.2,
    left: -width * 0.3,
    width: width * 1.6,
    height: height * 0.7,
    borderRadius: width,
    backgroundColor: '#0a1628',
    opacity: 0.8,
  },
  bgLayer2: {
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

  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 50,
    marginBottom: 25,
  },
  headerText: {
    fontSize: 25,
    marginBottom: 15,
    borderBottomColor: '#2979ff',   // accent color match
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerMsg: {
    paddingHorizontal: 2,
    paddingVertical: 8,
    marginVertical: 25,
    borderRadius: 13,
  },
  noticeText: {
    fontSize: 19,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 27,
  },
  btnCover: {
    marginHorizontal: 18,
    marginVertical: 50,
    paddingVertical: 10,
    borderRadius: 15,
  },
  button: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
})