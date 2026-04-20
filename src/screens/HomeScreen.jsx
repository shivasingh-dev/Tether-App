import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Image,
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

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerms, setSearchTerms] = useState('');

  const { conversations } = useChatStore();
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { user } = useUserStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [, setTick] = useState(0);

  // Force re-render every minute to update "Just now" timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
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

    return {
      conversationId: conv._id,
      user: otherUser,
      lastMessage: conv.lastMessage,
      unreadCount: unread,
    };
  });

  // Filter contacts
  const filteredContacts = contacts?.filter(contact =>
    contact?.user?.fullName?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  // on screen mounted set active tab
   useEffect(() => {
    setActiveTab('chats');
  }, []);

  // on screen mounted set active tab
   useEffect(() => {
    setActiveTab('chats');
  }, []);

  const renderChatItem = ({ item }) => {
    const isSelected = selectedContact?.conversationId === item.conversationId;

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          isSelected ? styles.chatItemSelected : styles.chatItemUnselected,
        ]}
        onPress={() => setSelectedContact(item)}
        activeOpacity={0.7}
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
                {item?.user?.fullName?.charAt(0).toUpperCase()}
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
              {item?.user?.fullName}
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
      <View style={styles.header}>
        <Text style={styles.headerText}>Tether</Text>
        <TouchableOpacity style={styles.newChatButton} activeOpacity={0.7}>
          <Ionicons
            name="chatbox-outline"
            size={22}
            color={colors.iconPrimary}
          />
        </TouchableOpacity>
      </View>

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
            {isSearchFocused ? (
              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.iconPrimary}
              />
            ) : (
              <Fontisto name="search" size={16} color={colors.iconPrimary} />
            )}
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

      {/* Chat List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderChatItem}
        keyExtractor={item => item.conversationId}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />

      <BottomBarNavigator />

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
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
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

  chatItemSelected: {
    backgroundColor: colors.backgroundSelected,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.iconPrimary,
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
