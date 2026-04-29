import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../constants/colors';
import { useChatStore } from '../Store/useChatStore';
import useLayoutStore from '../Store/useLayoutStore';
import useUserStore from '../Store/useUserStore';
import BottomBarNavigator from '../components/BottomBarNavigator'
import formatTimestamp from '../Utils/formatTime';
import AllContactList from '../components/AllContactList';
import { useContactStore } from '../Store/useContactStore';

export default function HomeScreen({navigation}) {
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerms, setSearchTerms] = useState('');

  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { user } = useUserStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [, setTick] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const [selectedChatForDelete, setSelectedChatForDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { getLocalName, syncContacts } = useContactStore();
  const { conversations, deleteConversation } = useChatStore();

  const handleChatPress = (item) => {
    setSelectedContact(item)
    navigation?.navigate('Chat_Screen')
  }

  // Force re-render every minute to update "Just now" timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync contacts on mount to get local names
  useEffect(() => {
    syncContacts();
  }, []);

  // Process conversations
  const convList = Array.isArray(conversations)
    ? conversations
    : conversations?.data || [];

  const contacts = convList.map(conv => {
    const otherUser = conv.participants?.find(p => p._id !== user?._id);
    const unread =
      typeof conv.unreadCount === 'object' && conv.unreadCount !== null
        ? conv.unreadCount?.[user?._id] || 0
        : Number(conv.unreadCount || 0);

    const isLastMsgDeleted = conv.lastMessage?.deletedFor?.includes(user?._id);

    return {
      conversationId: conv._id,
      user: otherUser,
      lastMessage: isLastMsgDeleted ? null : conv.lastMessage,
      unreadCount: unread,
    };
  });

  // Sort by latest message
  const sortedContacts = contacts.sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Filter contacts
  const filteredContacts = sortedContacts?.filter(contact =>
    contact?.user?.fullName?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  // on screen mounted set active tab
   useEffect(() => {
    setActiveTab('chats');
  }, []);

  const renderChatItem = ({ item }) => {
    const isSelected = selectedContact?.conversationId === item.conversationId;
    const localName = getLocalName(item?.user?.phoneNumber);
    const displayName = localName || item?.user?.fullName;
    
    return (
      <TouchableOpacity 
        style={[styles.chatItem, selectedChatForDelete?.conversationId === item.conversationId && styles.chatItemSelected]}
        onPress={() => {
          if (selectedChatForDelete) {
            setSelectedChatForDelete(item.conversationId === selectedChatForDelete.conversationId ? null : item);
          } else {
            handleChatPress({ ...item, fullName: displayName });
          }
        }}
        onLongPress={() => setSelectedChatForDelete(item)}
        activeOpacity={0.3}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item?.user?.profilePicture ? (
            <Image
              source={{ uri: item.user.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatNameRow}>
            <Text
              style={[styles.chatName, isSelected && styles.chatNameSelected]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={styles.chatTime}>
              {formatTimestamp(item?.lastMessage?.createdAt)}
            </Text>
          </View>

          <View style={styles.chatPreviewRow}>
            <Text style={styles.chatPreview} numberOfLines={1}>
              {item?.lastMessage?.content || 'No messages'}
            </Text>

            {item?.unreadCount > 0 && (
              <LinearGradient
                colors={[colors.badgeStart, colors.badgeEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unreadBadge}
              >
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {selectedChatForDelete ? (
        <View style={[styles.header, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
          <TouchableOpacity onPress={() => setSelectedChatForDelete(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { marginLeft: 15 }]}>1 Selected</Text>
          <TouchableOpacity 
            style={styles.newChatButton} 
            activeOpacity={0.7}
            onPress={() => setShowDeleteModal(true)}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.headerText}>Tether</Text>
          <TouchableOpacity 
            style={styles.newChatButton} 
            activeOpacity={0.7}
            onPress={async () => {
              const success = await syncContacts();
              if (success) setShowContacts(true);
            }}
          >
            <Ionicons
              name="chatbox-outline"
              size={22}
              color={colors.iconPrimary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TouchableOpacity
            onPress={() => {
              if (isSearchFocused) {
                setIsSearchFocused(false);
                setSearchTerms('');
                searchInputRef.current?.blur();
              }
            }}
            activeOpacity={0.7}
          >
              <Fontisto name="search" size={16} color={colors.iconPrimary} />
          </TouchableOpacity>

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor={colors.textPlaceholder}
            value={searchTerms}
            onChangeText={setSearchTerms}
            onFocus={() => setIsSearchFocused(true)}
          />

          {/* Cross icon to clear search */}
          {searchTerms.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchTerms('')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredContacts?.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
          <Text style={{ color: 'rgba(147,197,253,0.5)', fontSize: 14, textAlign: 'center' }}>
            {searchTerms.trim() 
              ? `No chat found for "${searchTerms}"`
              : "No conversations yet. Tap the chat icon above to start a new chat!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderChatItem}
          keyExtractor={item => item.conversationId}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomBarNavigator />

      <AllContactList 
        visible={showContacts} 
        onClose={() => setShowContacts(false)} 
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="trash" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Chat?</Text>
            <Text style={styles.modalDesc}>
              Messages will be deleted from your device. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (selectedChatForDelete) {
                    await deleteConversation(selectedChatForDelete.conversationId);
                    setSelectedChatForDelete(null);
                    setShowDeleteModal(false);
                  }
                }}
                style={styles.modalConfirm}
              >
                <Text style={styles.modalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  gradientText: {
    borderRadius: 4,
  },

  headerText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  newChatButton: {
    padding: 8,
    borderRadius: 20,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    padding: 0,
  },

  // Chat List
  chatList: {
    paddingHorizontal: 14,
    paddingBottom: 80,
  },

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },

  chatItemUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Avatar
  avatarContainer: {
    marginRight: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e50ccff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatItemSelected: {
    backgroundColor: 'rgba(37,99,235,0.1)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.3)',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eff6ff',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(6,35,79,0.5)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#93c5fd',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Chat Info
  chatInfo: {
    flex: 1,
  },

  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },

  chatName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },

  chatNameSelected: {
    color: colors.textPrimary,
  },

  chatTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 8,
  },

  chatPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  chatPreview: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    paddingRight: 16,
  },

  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: colors.badgeStart,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  unreadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
