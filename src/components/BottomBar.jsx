import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../constants/colors';

const tabs = [
  {
    key: 'chats',
    label: 'Chats',
    icon: 'chatbubbles',
    iconOutline: 'chatbubbles-outline',
    type: 'ionicons',
  },
  {
    key: 'updates',
    label: 'Updates',
    icon: 'update',
    iconOutline: 'update',
    type: 'material',
  },
  {
    key: 'calls',
    label: 'Calls',
    icon: 'call',
    iconOutline: 'call-outline',
    type: 'ionicons',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person-circle',
    iconOutline: 'person-circle-outline',
    type: 'ionicons',
  },
];

const BottomBar = ({ activeTab, onTabPress }) => {

  console.log('BottomBar received onTabPress:', typeof onTabPress);

  return (
    <View style={styles.container}>
      {/* Gradient top border */}
      <LinearGradient
        colors={[colors.primary, colors.secondary, colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent =
            tab.type === 'ionicons' ? Ionicons : MaterialCommunityIcons;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => {onTabPress(tab.key)
                console.log('BottomBar tab clicked:', tab.key); 
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}
              >
                <IconComponent
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={24}
                  color={isActive ? colors.primary : colors.iconSecondary}
                />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  topBorder: {
    height: 1.5,
    width: '100%',
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  iconContainer: {
    padding: 4,
    borderRadius: 12,
  },

  iconContainerActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },

  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  activeLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default BottomBar;