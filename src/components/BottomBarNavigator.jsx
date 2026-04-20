import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import useLayoutStore from '../Store/useLayoutStore'
import BottomBar from './BottomBar';

export default function BottomBarNavigator() {
  const navigation = useNavigation();
  const route = useRoute();
  const { activeTab, setActiveTab } = useLayoutStore();

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    
    const routes = {
      chats: 'Home_Screen',
      updates: 'Status_Screen',
      calls: 'Call_Screen',
      profile: 'Settings_Screen',
    };

    if (routes[tabKey]) {
      navigation.navigate(routes[tabKey]);
    }

  };

  return <BottomBar activeTab={activeTab} onTabPress={handleTabPress} />;
}