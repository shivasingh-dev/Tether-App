import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator'
import Toast from 'react-native-toast-message'

export default function App() {
  return (
    <GestureHandlerRootView>
    <SafeAreaProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
    <Toast />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
})