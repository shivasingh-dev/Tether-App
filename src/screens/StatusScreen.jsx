import {  StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { colors } from '../constants/colors';
import BottomBarNavigator from '../components/BottomBarNavigator';
import useLayoutStore from '../Store/useLayoutStore';

export default function StatusScreen() {
  const { setActiveTab } = useLayoutStore();

  useEffect(() => {
    setActiveTab('updates');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Updates</Text>
        {/* Status/Updates content yahan */}
      </View>
      
      <BottomBarNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 16,
  },
});