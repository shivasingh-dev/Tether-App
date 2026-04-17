// components/BottomTabBar.jsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const tabs = [
  {
    key: 'chats',
    label: 'Chats',
    icon: (active) => (
      <MaterialCommunityIcons
        name={active ? 'message' : 'message-outline'}
        size={26}
        color={active ? '#00A884' : '#8A8A8A'}
      />
    ),
  },
  {
    key: 'status',
    label: 'Updates',
    icon: (active) => (
      <MaterialCommunityIcons
        name={active ? 'circle-slice-8' : 'circle-outline'}
        size={26}
        color={active ? '#00A884' : '#8A8A8A'}
      />
    ),
  },
  {
    key: 'communities',
    label: 'Communities',
    icon: (active) => (
      <MaterialCommunityIcons
        name={active ? 'account-group' : 'account-group-outline'}
        size={26}
        color={active ? '#00A884' : '#8A8A8A'}
      />
    ),
  },
  {
    key: 'calls',
    label: 'Calls',
    icon: (active) => (
      <Ionicons
        name={active ? 'call' : 'call-outline'}
        size={24}
        color={active ? '#00A884' : '#8A8A8A'}
      />
    ),
  },
];

const BottomBar = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {tab.icon(isActive)}
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderTopWidth: 0.5,
    borderTopColor: '#2A2A2A',
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#00A884',
    fontWeight: '700',
  },
});

export default BottomBar;