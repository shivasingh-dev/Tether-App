import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import Svg, { Path, Circle } from 'react-native-svg';
import { useChatStore } from '../Store/useChatStore';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_SIZE = width / 3 - 2;

const ContactDetail = ({ visible, onClose, contact, messages = [], statusText, isOnline }) => {
  const { 
    blockStatus, 
    reportStatus, 
    blockUser, 
    unblockUser, 
    reportUser 
  } = useChatStore();

  const receiverId = contact?._id;

  // Filter media from messages
  const mediaMessages = (messages || []).filter(
    msg => msg.contentType === 'image' || msg.contentType === 'video'
  );

  const handleBlockPress = () => {
    if (blockStatus.isBlockedByMe) {
      unblockUser(receiverId);
    } else {
      Alert.alert(
        'Block User?',
        `Are you sure you want to block ${contact?.fullName}? They won't be able to message you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => blockUser(receiverId) },
        ]
      );
    }
  };

  const handleReportPress = () => {
    Alert.alert(
      'Report User?',
      `Are you sure you want to report ${contact?.fullName}? The last few messages will be forwarded to Tether.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {
            reportUser(receiverId);
            Alert.alert("Success", "User has been reported.");
          } 
        },
      ]
    );
  };

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity style={styles.mediaItem}>
      <Image
        source={{ uri: item.imageOrVideoUrl }}
        style={styles.mediaImage}
      />
      {item.contentType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const MediaEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.svgWrapper}>
        <Svg width="80" height="80" viewBox="0 0 24 24" fill="none">
          <Path 
            d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" 
            stroke={colors.textMuted} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={styles.emptyText}>No shared moments yet</Text>
      <Text style={styles.emptySubText}>Images and videos shared in this chat will appear here.</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Info</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {contact?.profilePicture ? (
              <Image 
                source={{ uri: contact.profilePicture }} 
                style={styles.profilePic} 
              />
            ) : (
              <View style={styles.profilePicFallback}>
                <Text style={styles.profileInitial}>
                  {(contact?.fullName || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{contact?.fullName}</Text>
            <Text style={[styles.statusUnderName, { color: isOnline ? '#4ade80' : colors.textMuted }]}>
              {statusText}
            </Text>
            <Text style={styles.phone}>+91 {contact?.phoneNumber}</Text>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{contact?.about || 'Hey there! I am using Tether.'}</Text>
          </View>

          {/* Media Section */}
          <View style={styles.section}>
            <View style={styles.mediaHeader}>
              <Text style={styles.sectionTitle}>Media, Links and Docs</Text>
              {mediaMessages.length > 0 && (
                <Text style={styles.mediaCount}>{mediaMessages.length}</Text>
              )}
            </View>
            
            {mediaMessages.length > 0 ? (
              <FlatList
                data={mediaMessages.slice(0, 6)}
                renderItem={renderMediaItem}
                keyExtractor={item => item._id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.mediaGrid}
              />
            ) : (
              <MediaEmptyState />
            )}
          </View>

          {/* Action Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.actionText}>Mute Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="image-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.actionText}>Media Visibility</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
              <View>
                <Text style={styles.actionText}>Encryption</Text>
                <Text style={styles.actionSubText}>Messages and calls are end-to-end encrypted.</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerSection}>
            <TouchableOpacity style={styles.actionItem} onPress={handleBlockPress}>
              <Ionicons 
                name={blockStatus.isBlockedByMe ? "checkmark-circle-outline" : "ban-outline"} 
                size={22} 
                color={blockStatus.isBlockedByMe ? "#10b981" : "#ef4444"} 
              />
              <Text style={[styles.actionText, { color: blockStatus.isBlockedByMe ? "#10b981" : '#ef4444' }]}>
                {blockStatus.isBlockedByMe ? `Unblock ${contact?.fullName}` : `Block ${contact?.fullName}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleReportPress}>
              <Ionicons name="thumbs-down-outline" size={22} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Report {contact?.fullName}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    backgroundColor: colors.backgroundSecondary,
  },
  backBtn: {
    padding: 5,
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statusUnderName: {
    fontSize: 14,
    marginBottom: 5,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profilePicFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#06234f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.badgeStart,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.background,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.badgeStart,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  aboutText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  mediaGrid: {
    gap: 2,
  },
  mediaItem: {
    width: COLUMN_SIZE,
    height: COLUMN_SIZE,
    margin: 1,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  svgWrapper: {
    backgroundColor: 'rgba(147, 197, 253, 0.05)',
    padding: 20,
    borderRadius: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 15,
  },
  actionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  actionSubText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  dangerSection: {
    backgroundColor: colors.background,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 50,
  },
});

export default ContactDetail;