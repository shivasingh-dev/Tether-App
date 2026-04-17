import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import BottomBar from '../components/BottomBar';
import { storage } from '../Store/useUserStore';

export default function HomeScreen() {

  
  const [activeTab, setActiveTab] = useState('chats');
  const stored = storage.getString('user-auth-storage');
  console.log('MMKV stored data:', stored);


  return (
    <View>
      <Text>HomeScreen</Text>
      <BottomBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({});
