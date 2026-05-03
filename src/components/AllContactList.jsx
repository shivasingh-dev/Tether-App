import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { useContactStore } from '../Store/useContactStore';
import useLayoutStore from '../Store/useLayoutStore';
import { useNavigation } from '@react-navigation/native';
import { useChatStore } from '../Store/useChatStore';

const AllContactList = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { registeredContacts, contacts, loading, syncContacts, contactMapping } = useContactStore();
  const { setSelectedContact } = useLayoutStore();
  const { conversations } = useChatStore();
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (visible) {
      syncContacts();
    }
  }, [visible]);

  const handleContactPress = (user) => {
    // Correctly handle conversations array (it might be an object with .data)
    const convList = Array.isArray(conversations)
      ? conversations
      : conversations?.data || [];

    // Find existing conversation if any
    const existingConv = convList.find(conv => 
      conv.participants?.some(p => (p._id || p) === user._id)
    );

    const contactData = {
      conversationId: existingConv?._id,
      user: user,
      fullName: contactMapping[user.phoneNumber.slice(-10)] || user.fullName
    };

    setSelectedContact(contactData);
    onClose();
    navigation.navigate('Chat_Screen');
  };

  const getCleanNumber = (phone) => phone.replace(/\D/g, '').slice(-10);

  const filteredRegistered = registeredContacts.filter(c => 
    (contactMapping[c.phoneNumber.slice(-10)] || c.fullName).toLowerCase().includes(search.toLowerCase())
  );

  const invitedContacts = contacts.filter(contact => {
    const phone = contact.phoneNumbers[0]?.number;
    if (!phone) return false;
    const clean = getCleanNumber(phone);
    const isRegistered = registeredContacts.some(rc => rc.phoneNumber.slice(-10) === clean);
    const nameMatch = contact.displayName?.toLowerCase().includes(search.toLowerCase()) || 
                     contact.givenName?.toLowerCase().includes(search.toLowerCase());
    return !isRegistered && nameMatch;
  });

  const handleInvite = async (phone) => {
    if (!phone) return;
    const cleanPhone = getCleanNumber(phone);
    const message = "Hey! Let's connect on Tether. It's a secure and premium messaging app I'm using for all my chats. See you there!";
    
    // Standard format for most platforms
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', 'Could not open SMS app. Please check if an SMS app is installed.');
    }
  };

  const renderContactItem = ({ item, isRegistered }) => {
    const cleanPhone = isRegistered ? item.phoneNumber.slice(-10) : getCleanNumber(item.phoneNumbers[0]?.number);
    const displayName = contactMapping[cleanPhone] || (isRegistered ? item.fullName : item.displayName || `${item.givenName} ${item.familyName}`);

    return (
      <TouchableOpacity 
        style={styles.contactItem} 
        onPress={() => isRegistered ? handleContactPress(item) : null}
        activeOpacity={isRegistered ? 0.7 : 1}
      >
        <View style={styles.avatarContainer}>
          {isRegistered && item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isRegistered ? colors.badgeStart : '#334155' }]}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{displayName}</Text>
          <Text style={styles.contactStatus}>
            {isRegistered ? (item.about || 'Available') : (item.phoneNumbers[0]?.number)}
          </Text>
        </View>

        {!isRegistered && (
          <TouchableOpacity 
            style={styles.inviteBtn}
            onPress={() => handleInvite(item.phoneNumbers[0]?.number)}
          >
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Select contact</Text>
              <Text style={styles.headerSubtitle}>{registeredContacts.length + invitedContacts.length} contacts</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Refresh Menu */}
        {showMenu && (
          <TouchableOpacity 
            style={styles.menuOverlay} 
            activeOpacity={1} 
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuContent}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { syncContacts(); setShowMenu(false); }}>
                <Ionicons name="refresh" size={18} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.badgeStart} />
            <Text style={styles.loaderText}>Syncing contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={[
              ...(filteredRegistered.length > 0 ? [
                { type: 'header', title: 'Contacts on Tether' },
                ...filteredRegistered.map(c => ({ ...c, isRegistered: true }))
              ] : []),
              ...(invitedContacts.length > 0 ? [
                { type: 'header', title: 'Invite to Tether' },
                ...invitedContacts.map(c => ({ ...c, isRegistered: false }))
              ] : []),
            ]}
            ListEmptyComponent={
              search.length > 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No contact found for "{search}"</Text>
                </View>
              ) : null
            }
            keyExtractor={(item, index) => item._id || item.recordID || `header-${index}`}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return <Text style={styles.sectionHeader}>{item.title}</Text>;
              }
              return renderContactItem({ item, isRegistered: item.isRegistered });
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
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
    paddingTop: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    marginRight: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  menuBtn: {
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    margin: 12,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactStatus: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  inviteBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.badgeStart,
  },
  inviteText: {
    color: colors.badgeStart,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 15,
    color: colors.textMuted,
    fontSize: 14,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  menuContent: {
    position: 'absolute',
    top: 50,
    right: 15,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 5,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: 16,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default AllContactList;