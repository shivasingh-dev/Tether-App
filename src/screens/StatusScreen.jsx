import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Svg, { Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import { colors } from '../constants/colors';
import BottomBarNavigator from '../components/BottomBarNavigator';
import StatusList from '../components/StatusList';
import StatusPreview from '../components/StatusPreview';
import useLayoutStore from '../Store/useLayoutStore';
import useStatusStore from '../Store/useStatusStore';
import useUserStore from '../Store/useUserStore';
import formatTimestamp from '../Utils/data';

export default function StatusScreen() {
  const { setActiveTab } = useLayoutStore();
  const { user } = useUserStore();

  // Status Store
  const {
    statuses,
    loading,
    error,
    createStatus,
    viewStatus,
    deleteStatus,
    getUserStatuses,
    getOtherStatuses,
    fetchStatuses,
    clearError,
    initializeSocket,
    cleanupSocket,
  } = useStatusStore();

  // Local State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Preview State
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  const userStatus = getUserStatuses(user?._id);
  const otherStatus = getOtherStatuses(user?._id);

  useEffect(() => {
    setActiveTab('updates');
    fetchStatuses();
    initializeSocket();

    return () => {
      cleanupSocket();
      clearError();
    };
  }, []);

  // File Selection
  const handleFileSelection = async () => {
    Alert.alert(
      'Select Media',
      'Choose media type',
      [
        {
          text: 'Image',
          onPress: () => handleImagePicker(),
        },
        {
          text: 'Video',
          onPress: () => handleVideoPicker(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;
      
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          type: file.type,
          name: file.fileName || 'image.jpg',
          size: file.fileSize,
        });
        setFilePreview(file.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error selecting image',
      });
    }
  };

  const handleVideoPicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
      });

      if (result.didCancel) return;
      
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Video size validation (max 50MB)
        if (file.fileSize && file.fileSize > 50 * 1024 * 1024) {
          Toast.show({
            type: 'error',
            text1: 'Video too large',
            text2: 'Maximum size is 50MB',
          });
          return;
        }

        setSelectedFile({
          uri: file.uri,
          type: file.type,
          name: file.fileName || 'video.mp4',
          size: file.fileSize,
        });
        setFilePreview(file.uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Toast.show({
        type: 'error',
        text1: 'Error selecting video',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Create Status
  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) {
      Toast.show({
        type: 'error',
        text1: 'Please add content or media',
      });
      return;
    }

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile,
      });

      setNewStatus('');
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
      
      Toast.show({
        type: 'success',
        text1: 'Status created successfully!',
      });
    } catch (error) {
      console.error('Error creating status:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create status',
      });
    }
  };

  // Status Preview Handlers
  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);
    setPreviewVisible(true);

    if (contact?.statuses[statusIndex]) {
      viewStatus(contact?.statuses[statusIndex].id);
    }
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact?.statuses?.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOptions(false);
      Toast.show({
        type: 'success',
        text1: 'Status deleted',
      });
    } catch (error) {
      console.error('Error deleting status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Status</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Icon name="times" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* My Status Section */}
          <View style={styles.myStatusContainer}>
            <TouchableOpacity
              style={styles.myStatusCard}
              onPress={() => 
                userStatus 
                  ? handleStatusPreview(userStatus) 
                  : setShowCreateModal(true)
              }
              activeOpacity={0.7}
            >
              <View style={styles.myStatusLeft}>
                <View style={styles.avatarContainer}>
                  {user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}

                  {/* Status Ring */}
                  {userStatus && (
                    <Svg style={styles.statusRing} viewBox="0 0 100 100">
                      {userStatus?.statuses.map((_, index) => {
                        const total = userStatus.statuses.length;
                        const circumference = 2 * Math.PI * 48;
                        const gap = total > 1 ? 6 : 0;
                        const segmentLength = (circumference - gap * total) / total;
                        const offset = index * (segmentLength + gap);

                        return (
                          <Circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke="#2979ff"
                            strokeWidth="4"
                            strokeDasharray={`${segmentLength} ${circumference}`}
                            strokeDashoffset={-offset}
                            rotation="-90"
                            origin="50, 50"
                          />
                        );
                      })}
                    </Svg>
                  )}

                  {/* Add Button */}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowCreateModal(true);
                    }}
                  >
                    <Icon name="plus" size={10} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.myStatusInfo}>
                  <Text style={styles.myStatusTitle}>My Status</Text>
                  <Text style={styles.myStatusSubtitle}>
                    {userStatus
                      ? `${userStatus?.statuses?.length} status${userStatus?.statuses?.length > 1 ? 'es' : ''} ${formatTimestamp(userStatus?.statuses?.[userStatus?.statuses?.length - 1]?.timestamp)}`
                      : 'Tap to add status'}
                  </Text>
                </View>
              </View>

              {userStatus && (
                <TouchableOpacity
                  onPress={() => setShowOptions(!showOptions)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="ellipsis-h" size={20} color="#60a5fa" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Options Menu */}
            {showOptions && userStatus && (
              <View style={styles.optionsMenu}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowCreateModal(true);
                    setShowOptions(false);
                  }}
                >
                  <Icon name="camera" size={16} color="#60a5fa" />
                  <Text style={styles.optionText}>Add Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    handleStatusPreview(userStatus);
                    setShowOptions(false);
                  }}
                >
                  <Icon name="eye" size={16} color="#60a5fa" />
                  <Text style={styles.optionText}>View Status</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2979ff" />
            </View>
          )}

          {/* Recent Updates */}
          {!loading && otherStatus?.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Updates</Text>
              {otherStatus.map((contact) => (
                <StatusList
                  key={contact?.id}
                  contact={contact}
                  onPreview={() => handleStatusPreview(contact)}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loading && otherStatus.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📱</Text>
              <Text style={styles.emptyText}>
                Status updates will appear here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Create Status Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Status</Text>

            {/* File Preview */}
            {filePreview && (
              <View style={styles.filePreviewContainer}>
                {selectedFile?.type?.startsWith('video/') ? (
                  <Video
                    source={{ uri: filePreview }}
                    style={styles.filePreview}
                    controls
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={{ uri: filePreview }}
                    style={styles.filePreview}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.fileInfo}>
                  <View style={styles.fileInfoLeft}>
                    <Text style={styles.fileIcon}>
                      {selectedFile?.type?.startsWith('video/') ? '🎥' : '🖼️'}
                    </Text>
                    <View>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile?.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(selectedFile?.size)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    style={styles.removeFileButton}
                  >
                    <Icon name="times" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              value={newStatus}
              onChangeText={setNewStatus}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(147, 197, 253, 0.3)"
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />

            {/* File Picker Button */}
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={handleFileSelection}
            >
              <Icon name="paperclip" size={16} color="#60a5fa" />
              <Text style={styles.filePickerText}>
                {selectedFile ? 'Change Media' : 'Add Media'}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setSelectedFile(null);
                  setFilePreview(null);
                  setNewStatus('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateStatus}
                disabled={loading || (!newStatus.trim() && !selectedFile)}
                style={[
                  styles.createButton,
                  (loading || (!newStatus.trim() && !selectedFile)) && styles.createButtonDisabled,
                ]}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Preview */}
      {previewContact && (
        <StatusPreview
          visible={previewVisible}
          contact={previewContact}
          currentIndex={currentStatusIndex}
          onClose={handlePreviewClose}
          onNext={handlePreviewNext}
          onPrev={handlePreviewPrev}
          onDelete={handleDeleteStatus}
          currentUser={user}
        />
      )}

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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  myStatusContainer: {
    marginTop: 8,
  },
  myStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(6, 35, 79, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
  },
  myStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  statusRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2979ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2979ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  myStatusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  myStatusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  myStatusSubtitle: {
    fontSize: 13,
    color: 'rgba(147, 197, 253, 0.7)',
    marginTop: 2,
  },
  optionsMenu: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#06234f',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#60a5fa',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  recentSection: {
    marginTop: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(147, 197, 253, 0.5)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#05164a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  filePreviewContainer: {
    marginBottom: 16,
    backgroundColor: '#020818',
    borderRadius: 8,
    padding: 8,
  },
  filePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(6, 35, 79, 0.6)',
    borderRadius: 8,
    padding: 8,
  },
  fileInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileName: {
    fontSize: 12,
    color: '#93c5fd',
    maxWidth: 150,
  },
  fileSize: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  removeFileButton: {
    padding: 4,
  },
  textInput: {
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: '#2979ff',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(41, 121, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    fontSize: 14,
    color: '#93c5fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: '#2979ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});