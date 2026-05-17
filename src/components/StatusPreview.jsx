import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../constants/colors';
import formatTimestamp from '../Utils/data'
import useUserStore from '../Store/useUserStore';
import { useContactStore } from '../Store/useContactStore';

const { width, height } = Dimensions.get('window');

const StatusPreview = ({
  visible,
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  currentUser,
}) => {
  const { user } = useUserStore();
  const { contactMapping } = useContactStore();
  
  const cleanPhone = contact?.phoneNumber?.replace(/\D/g, '').slice(-10);
  const displayName = contactMapping[cleanPhone] || contact?.name || contact?.phoneNumber || "Unknown";
  
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwner = (contact?._id || contact?.id) === currentUser?._id;

  useEffect(() => {
    setProgress(0);
    progressAnim.setValue(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || showMenu || showViewers || showDeleteConfirm || !visible) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showMenu, showViewers, showDeleteConfirm, visible, onNext]);

  useEffect(() => {
    if (progress >= 100) {
      onNext();
    }
  }, [progress, onNext]);

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete && currentStatus?.id) {
      onDelete(currentStatus.id);
    }
    setShowDeleteConfirm(false);
    if (contact?.statuses?.length === 1) {
      onClose();
    } else {
      onNext();
    }
  };

  if (!currentStatus) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {contact?.statuses?.map((_, index) => (
            <View key={index} style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: index < currentIndex
                      ? '100%'
                      : index === currentIndex
                      ? `${progress}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {contact?.avatar ? (
              <Image
                source={{ uri: contact.avatar }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{displayName}</Text>
              <Text style={styles.headerTime}>
                {formatTimestamp(currentStatus?.timestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setIsPaused(!isPaused)}
              style={styles.headerButton}
            >
              <Icon
                name={isPaused ? 'play' : 'pause'}
                size={16}
                color="#fff"
              />
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity
                onPress={() => setShowMenu(!showMenu)}
                style={styles.headerButton}
              >
                <Icon name="ellipsis-v" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Icon name="times" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Dropdown */}
        {showMenu && (
          <View style={styles.menu}>
            <TouchableOpacity
              onPress={handleDeleteClick}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {currentStatus?.contentType === 'text' ? (
            <View style={styles.textContent}>
              <Text style={styles.textContentText}>{currentStatus?.content || currentStatus?.media}</Text>
            </View>
          ) : currentStatus?.contentType === 'image' ? (
            <Image
              source={{ uri: currentStatus?.media }}
              style={styles.mediaContent}
              resizeMode="contain"
            />
          ) : currentStatus?.contentType === 'video' ? (
            <Video
              source={{ uri: currentStatus?.media }}
              style={styles.mediaContent}
              controls
              resizeMode="contain"
              paused={isPaused}
            />
          ) : null}
        </View>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <TouchableOpacity onPress={onPrev} style={styles.navLeft}>
            <Icon name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {currentIndex < contact?.statuses?.length - 1 && (
          <TouchableOpacity onPress={onNext} style={styles.navRight}>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Viewers Section (Owner only) */}
        {isOwner && (
          <View style={styles.viewersSection}>
            <TouchableOpacity
              onPress={() => setShowViewers(!showViewers)}
              style={styles.viewersButton}
            >
              <View style={styles.viewersButtonLeft}>
                <Icon name="eye" size={16} color="#60a5fa" />
                <Text style={styles.viewersCount}>
                  {(currentStatus?.viewers || []).length} views
                </Text>
              </View>
              <Icon
                name="chevron-down"
                size={16}
                color="#60a5fa"
                style={[
                  styles.viewersChevron,
                  showViewers && styles.viewersChevronRotated,
                ]}
              />
            </TouchableOpacity>

            {showViewers && (
              <ScrollView style={styles.viewersList}>
                {currentStatus?.viewers?.length > 0 ? (
                  currentStatus.viewers.map((viewer) => {
                    const cleanViewerPhone = viewer?.phoneNumber?.replace(/\D/g, '').slice(-10);
                    const viewerName = contactMapping[cleanViewerPhone] || viewer?.fullName || viewer?.phoneNumber || "Unknown";
                    return (
                      <View key={viewer?._id} style={styles.viewerItem}>
                        {viewer?.profilePicture ? (
                          <Image
                            source={{ uri: viewer.profilePicture }}
                            style={styles.viewerAvatar}
                          />
                        ) : (
                          <View style={styles.viewerAvatarPlaceholder}>
                            <Text style={styles.viewerAvatarText}>
                              {viewerName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.viewerName}>{viewerName}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noViewers}>No viewers yet</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete Status?</Text>
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete this status? This action cannot be undone.
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  style={styles.deleteModalCancel}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDelete}
                  style={styles.deleteModalConfirm}
                >
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e50ccff',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerTime: {
    fontSize: 12,
    color: 'rgba(147, 197, 253, 0.7)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    top: 105,
    right: 60,
    backgroundColor: '#06234f',
    borderRadius: 8,
    padding: 4,
    zIndex: 30,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuItemText: {
    color: '#ef4444',
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    padding: 32,
    alignItems: 'center',
  },
  textContentText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  mediaContent: {
    width: width,
    height: height,
  },
  navLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewersSection: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  viewersButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  viewersButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewersCount: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  viewersChevron: {
    transform: [{ rotate: '0deg' }],
  },
  viewersChevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  viewersList: {
    maxHeight: 160,
    backgroundColor: 'rgba(6, 35, 79, 0.9)',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  viewerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e50ccff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewerName: {
    marginLeft: 12,
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  noViewers: {
    color: 'rgba(147, 197, 253, 0.7)',
    textAlign: 'center',
  },
  deleteModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  deleteModalContent: {
    backgroundColor: '#05164a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 14,
    color: 'rgba(147, 197, 253, 0.7)',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteModalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deleteModalCancelText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteModalConfirm: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteModalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StatusPreview;