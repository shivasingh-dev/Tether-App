import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useThemeStore from '../Store/useThemeStore';
import { logOutUser } from '../Services/UserService';
import useUserStore from '../Store/useUserStore';
import ThemeDialog from '../components/ThemeDialog';
import BottomBarNavigator from '../components/BottomBarNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const navigation = useNavigation();
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const isDark = theme === 'dark';

  const toggleThemeDialog = () => {
    Alert.alert("Theme Update", "Light theme will be available in the next update")
    return
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
      await logOutUser();
      clearUser();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out',
        position: 'top',
      });
    } catch (error) {
      console.error('Error in logOut', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to logout. Please try again',
        position: 'top',
      });
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const navigateToProfile = () => {
    navigation.navigate('UserDetails');
  };

  const menuItems = [
    { icon: 'user', label: 'Account', onPress: navigateToProfile },
    {
      icon: 'comment',
      label: 'Chats',
      onPress: () => navigation.navigate('Home_Screen'),
    },
    {
      icon: 'question-circle',
      label: 'Help',
      onPress: () => Linking.openURL('https://tether-policy-page.vercel.app/'),
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchText.toLowerCase()),
  );

  const showTheme =
    'theme'.includes(searchText.toLowerCase()) ||
    theme.includes(searchText.toLowerCase()) ||
    searchText === '';

  const showLogout =
    'logout'.includes(searchText.toLowerCase()) ||
    'log out'.includes(searchText.toLowerCase()) ||
    searchText === '';

  return (
    <SafeAreaView
      style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <Text
            style={[styles.header, isDark ? styles.lightText : styles.darkText]}
          >
            Settings
          </Text>

          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              isDark ? styles.darkInput : styles.lightInput,
            ]}
          >
            <Icon
              name="search"
              size={16}
              color="#60A5FA"
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                isDark ? styles.lightText : styles.darkText,
              ]}
              placeholder="Search settings"
              placeholderTextColor="#6B7280"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Profile Section - Clickable */}
          <TouchableOpacity
            style={[
              styles.profileSection,
              isDark ? styles.darkHover : styles.lightHover,
            ]}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  isDark ? styles.lightText : styles.darkText,
                ]}
                numberOfLines={1}
              >
                {user?.fullName || 'User Name'}
              </Text>
              <Text style={styles.profileAbout} numberOfLines={1}>
                {user?.about || 'Hey there, I am using Tether'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {filteredMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  isDark ? styles.darkHover : styles.lightHover,
                ]}
                onPress={item.onPress}
                activeOpacity={0.4}
              >
                <Icon name={item.icon} size={20} color="#60A5FA" />
                <View
                  style={[
                    styles.menuItemContent,
                    isDark ? styles.darkBorder : styles.lightBorder,
                  ]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      isDark ? styles.lightText : styles.darkText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Theme Button */}
            {showTheme && (
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  isDark ? styles.darkHover : styles.lightHover,
                ]}
                onPress={toggleThemeDialog}
                activeOpacity={0.7}
              >
                <Icon
                  name={isDark ? 'moon-o' : 'sun-o'}
                  size={20}
                  color={isDark ? '#60A5FA' : '#FCD34D'}
                />
                <View
                  style={[
                    styles.menuItemContent,
                    isDark ? styles.darkBorder : styles.lightBorder,
                  ]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      isDark ? styles.lightText : styles.darkText,
                    ]}
                  >
                    Theme
                  </Text>
                  <Text style={styles.themeValue}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {/* Tether Web Version Link */}
            {searchText === '' || 'tether web version'.includes(searchText.toLowerCase()) ? (
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  isDark ? styles.darkHover : styles.lightHover,
                ]}
                onPress={() => Linking.openURL('https://tether-inky.vercel.app/')}
                activeOpacity={0.7}
              >
                <Icon
                  name="globe"
                  size={20}
                  color="#60A5FA"
                />
                <View
                  style={[
                    styles.menuItemContent,
                    isDark ? styles.darkBorder : styles.lightBorder,
                    { borderBottomWidth: 0 }, // Last item in menuContainer
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isDark ? styles.lightText : styles.darkText,
                      ]}
                    >
                      Tether Web Version
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      https://tether-inky.vercel.app/
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Logout Button */}
          {showLogout && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Icon name="sign-out" size={20} color="#F87171" />
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          )}


          {/* Empty State */}
          {filteredMenuItems.length === 0 && !showTheme && !showLogout && (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                No settings found for "{searchText}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleLogoutCancel}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              isDark ? styles.darkModal : styles.lightModal,
            ]}
          >
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <Icon name="sign-out" size={32} color="#F87171" />
            </View>

            {/* Title */}
            <Text
              style={[
                styles.modalTitle,
                isDark ? styles.lightText : styles.darkText,
              ]}
            >
              Ready to leave?
            </Text>

            {/* Description */}
            <Text style={styles.modalDescription}>
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleLogoutCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Not Yet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogoutConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Yes, Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Dialog */}
      <ThemeDialog
        visible={isThemeDialogOpen}
        onClose={() => setIsThemeDialogOpen(false)}
      />

      <BottomBarNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: '#020818',
  },
  lightBg: {
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: '#06234f',
  },
  lightInput: {
    backgroundColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  darkHover: {
    backgroundColor: '#06234f40',
  },
  lightHover: {
    backgroundColor: '#F3F4F6',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#3B82F620',
  },
  profilePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#60A5FA',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileAbout: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  menuContainer: {
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#1E3A8A30',
  },
  lightBorder: {
    borderBottomColor: '#E5E7EB',
  },
  menuItemText: {
    fontSize: 14,
  },
  themeValue: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    color: '#F87171',
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 64,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  darkModal: {
    backgroundColor: '#06234f',
  },
  lightModal: {
    backgroundColor: '#FFFFFF',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  webLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  webLinkText: {
    fontSize: 14,
    color: '#60A5FA',
    marginLeft: 16,
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen;
