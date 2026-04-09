import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fontFamilies } from '../constants/fonts'
import { colors } from '../constants/colors'
import LinearGradient from 'react-native-linear-gradient'
import IndiaProudCard from '../components/IndiaProudCard'

export default function LoginScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.outermost}>
      <View style={styles.noticeContainer} >
        <Text style={[styles.noticeText, styles.headerText]}>Verify your details</Text>
        <View>
          <Text style={styles.noticeText} >Tether will need to verify your phone number & your Email Id.</Text>
        </View>
        <LinearGradient
          // colors={['#0000FF', '#800080']}
          colors={['#B8860B', '#A67C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerMsg}
        >
          <Text style={styles.noticeText}>
            Tether is only available in India
          </Text>
        </LinearGradient>
      </View>

      <IndiaProudCard />

      <TouchableOpacity activeOpacity={0.4} onPress={() => navigation.navigate('SignUp_Screen')} >
        <LinearGradient style={styles.btnCover} colors={['#4facfe', '#5f6afc', '#8e44ad']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} >
          <Text style={styles.button} >Proceed to Sign UP</Text>
        </LinearGradient>
      </TouchableOpacity>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outermost: {
    backgroundColor: '#020818',
    flex: 1,
  },
  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 50,
    marginBottom: 25,
  },
  headerText: {
    fontSize: 25,
    marginBottom: 15,
    borderBottomColor: 'white',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerMsg: {
    backgroundColor: '#121212',
    paddingHorizontal: 2,
    paddingVertical: 8,
    marginVertical: 25,
    borderRadius: 13,
  },
  gradient: {
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    backgroundColor: "#4facfe",
    paddingVertical: 10,
    borderRadius: 15,
  },
  button: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  }
})