import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary } from 'react-native-image-picker';
import EmojiPicker from 'rn-emoji-keyboard';
import Toast from 'react-native-toast-message';
import useUserStore from '../Store/useUserStore';
import { updateUserProfile } from '../Services/UserService';
import useThemeStore from '../Store/useThemeStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const UserDetailsScreen = () => {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setAbout(user.about || '');
    }
  }, [user]);

  const handleImageChange = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to select image',
          position: 'top',
        });
      } else {
        const asset = response.assets[0];
        setProfilePicture({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'profile.jpg',
        });
        setPreview(asset.uri);
      }
    });
  };

  const handleSave = async (field) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      if (field === 'name') {
        formData.append('fullName', name);
        setIsEditingName(false);
        setShowNameEmoji(false);
      } else if (field === 'about') {
        formData.append('about', about);
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }

      if (profilePicture && field === 'profile') {
        formData.append('profilePicture', {
          uri: profilePicture.uri,
          type: profilePicture.type,
          name: profilePicture.name,
        });
      }

      const updated = await updateUserProfile(formData);
      const currentToken = useUserStore.getState().token;
      setUser(updated?.data, currentToken);
      setProfilePicture(null);
      setPreview(null);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Error in profile update', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (emojiObject, field) => {
    const emoji = emojiObject.emoji;
    if (field === 'name') {
      setName((prev) => prev + emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji);
      setShowAboutEmoji(false);
    }
  };

  const handleDiscard = () => {
    setProfilePicture(null);
    setPreview(null);
  };

  const handleCancelEdit = (field) => {
    if (field === 'name') {
      setName(user?.fullName || '');
      setIsEditingName(false);
      setShowNameEmoji(false);
    } else {
      setAbout(user?.about || '');
      setIsEditingAbout(false);
      setShowAboutEmoji(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <Text style={[styles.header, isDark ? styles.lightText : styles.darkText]}>
            Profile
          </Text>

          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleImageChange}
              activeOpacity={0.8}
            >
              {preview || user?.profilePicture ? (
                <Image
                  source={{ uri: preview || user.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Icon name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Save/Discard Buttons */}
          {preview && (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSave('profile')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Photo</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardButton}
                onPress={handleDiscard}
                activeOpacity={0.8}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Name Field */}
          <View style={[styles.fieldContainer, isDark ? styles.darkField : styles.lightField]}>
            <Text style={styles.fieldLabel}>Your Name</Text>
            <View style={styles.fieldInputContainer}>
              {isEditingName ? (
                <TextInput
                  style={[styles.textInput, isDark ? styles.darkTextInput : styles.lightTextInput]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#6B7280"
                />
              ) : (
                <Text style={[styles.fieldValue, isDark ? styles.lightText : styles.darkText]}>
                  {user?.fullName || name || 'Not set'}
                </Text>
              )}

              <View style={styles.fieldActions}>
                {isEditingName ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleSave('name')}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="check" size={18} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowNameEmoji(true);
                      }}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="smile-o" size={18} color="#FCD34D" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCancelEdit('name')}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="times" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsEditingName(true)}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <Icon name="pencil" size={18} color="#60A5FA" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* About Field */}
          <View style={[styles.fieldContainer, isDark ? styles.darkField : styles.lightField]}>
            <Text style={styles.fieldLabel}>About</Text>
            <View style={styles.fieldInputContainer}>
              {isEditingAbout ? (
                <TextInput
                  style={[styles.textInput, isDark ? styles.darkTextInput : styles.lightTextInput]}
                  value={about}
                  onChangeText={setAbout}
                  placeholder="Enter your status"
                  placeholderTextColor="#6B7280"
                  multiline
                />
              ) : (
                <Text style={[styles.fieldValue, isDark ? styles.lightText : styles.darkText]}>
                  {user?.about || about || 'Hey there, I am using Tether'}
                </Text>
              )}

              <View style={styles.fieldActions}>
                {isEditingAbout ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleSave('about')}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="check" size={18} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAboutEmoji(true);
                      }}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="smile-o" size={18} color="#FCD34D" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCancelEdit('about')}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="times" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsEditingAbout(true)}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <Icon name="pencil" size={18} color="#60A5FA" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Email Field (Read-only) */}
          <View style={[styles.fieldContainer, isDark ? styles.darkField : styles.lightField]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.fieldInputContainer}>
              <Text style={[styles.fieldValue, isDark ? styles.lightText : styles.darkText, { opacity: 0.7 }]}>
                {user?.email || 'Not set'}
              </Text>
              <View style={styles.fieldActions}>
                <Icon name="lock" size={16} color="#9CA3AF" />
              </View>
            </View>
          </View>

          {/* Phone Field (Read-only) */}
          <View style={[styles.fieldContainer, isDark ? styles.darkField : styles.lightField]}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.fieldInputContainer}>
              <Text style={[styles.fieldValue, isDark ? styles.lightText : styles.darkText, { opacity: 0.7 }]}>
                {user?.phoneNumber || 'Not set'}
              </Text>
              <View style={styles.fieldActions}>
                <Icon name="lock" size={16} color="#9CA3AF" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Emoji Picker for Name */}
      <EmojiPicker
        onEmojiSelected={(emojiObject) => handleEmojiSelect(emojiObject, 'name')}
        open={showNameEmoji}
        onClose={() => setShowNameEmoji(false)}
        theme={isDark ? {
          backdrop: '#00000090',
          knob: '#60A5FA',
          container: '#06234f',
          header: '#60A5FA',
          category: {
            icon: '#60A5FA',
            iconActive: '#FFFFFF',
            container: '#020818',
            containerActive: '#3B82F6',
          },
          search: {
            text: '#FFFFFF',
            placeholder: '#6B7280',
            icon: '#60A5FA',
            background: '#020818',
          },
        } : undefined}
      />

      {/* Emoji Picker for About */}
      <EmojiPicker
        onEmojiSelected={(emojiObject) => handleEmojiSelect(emojiObject, 'about')}
        open={showAboutEmoji}
        onClose={() => setShowAboutEmoji(false)}
        theme={isDark ? {
          backdrop: '#00000090',
          knob: '#60A5FA',
          container: '#06234f',
          header: '#60A5FA',
          category: {
            icon: '#60A5FA',
            iconActive: '#FFFFFF',
            container: '#020818',
            containerActive: '#3B82F6',
          },
          search: {
            text: '#FFFFFF',
            placeholder: '#6B7280',
            icon: '#60A5FA',
            background: '#020818',
          },
        } : undefined}
      />
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
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#000000',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#3B82F630',
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#06234f',
    borderWidth: 2,
    borderColor: '#3B82F630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '600',
    color: '#60A5FA',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#020818',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#06234f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '600',
  },
  fieldContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  darkField: {
    backgroundColor: '#06234f99',
  },
  lightField: {
    backgroundColor: '#F3F4F6',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#60A5FA',
    marginBottom: 8,
  },
  fieldInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1E3A8A50',
  },
  darkTextInput: {
    backgroundColor: '#020818',
    color: '#FFFFFF',
  },
  lightTextInput: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  fieldValue: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  actionButton: {
    padding: 4,
  },
  emojiModalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  emojiContainer: {
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },
  darkModal: {
    backgroundColor: '#06234f',
  },
  lightModal: {
    backgroundColor: '#FFFFFF',
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A30',
  },
  emojiTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UserDetailsScreen;