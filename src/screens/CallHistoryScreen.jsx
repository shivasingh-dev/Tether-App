import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { colors } from '../constants/colors';
import BottomBarNavigator from '../components/BottomBarNavigator';
import useLayoutStore from '../Store/useLayoutStore';
import useCallHistoryStore from '../Store/useCallHistoryStore';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';

export default function CallHistoryScreen() {
  const { setActiveTab } = useLayoutStore();
  const { callHistory, clearHistory } = useCallHistoryStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);

  const searchInputRef = useRef(null);
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setActiveTab('calls');
  }, []);

  // Animate search bar open/close
  useEffect(() => {
    Animated.timing(searchBarAnim, {
      toValue: isSearchOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 220);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return callHistory;
    return callHistory.filter((item) =>
      item.participantName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, callHistory]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleClearConfirm = () => {
    clearHistory();
    setClearModalVisible(false);
    setMenuVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.callItem}>
      {item.participantAvatar ? (
        <Image source={{ uri: item.participantAvatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.participantName?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.callInfo}>
        <Text style={styles.name}>{item.participantName}</Text>
        <View style={styles.statusRow}>
          <Icon
            name={item.callType === 'video' ? 'video' : 'phone'}
            size={14}
            color={item.status === 'completed' ? '#00A884' : '#ef4444'}
          />
          <Text
            style={[
              styles.status,
              { color: item.status === 'completed' ? colors.textMuted : '#ef4444' },
            ]}
          >
            {item.status === 'completed' ? `Connected (${formatDuration(item.duration)})` : 'Missed'} •{' '}
            {format(new Date(item.timestamp), 'dd MMM, HH:mm')}
          </Text>
        </View>
      </View>
      {/* <TouchableOpacity style={styles.callRight}>
        <Icon name="phone" size={20} color={colors.textMuted} />
      </TouchableOpacity> */}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        {!isSearchOpen ? (
          <>
            <Text style={styles.title}>Calls</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setIsSearchOpen(true)}
              >
                <Icon name="search" size={22} color={colors.textPrimary} />
              </TouchableOpacity>

              {/* Three dots */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setMenuVisible(true)}
              >
                <MaterialIcon name="more-vert" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ─── SEARCH BAR ─── */
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={() => setIsSearchOpen(false)}>
              <Icon name="arrow-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search name or number..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor="#00A884"
              cursorColor="#00A884"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ─── CALL LIST ─── */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery.trim() ? (
              <>
                <Icon name="search" size={60} color={colors.iconSecondary} />
                <Text style={styles.emptyText}>
                  No history found for "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <Icon name="phone-off" size={60} color={colors.iconSecondary} />
                <Text style={styles.emptyText}>No call history yet</Text>
              </>
            )}
          </View>
        }
      />

      {/* ─── THREE DOTS DROPDOWN MENU ─── */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setClearModalVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>Clear call log</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ─── CLEAR CONFIRMATION MODAL ─── */}
      <Modal
        transparent
        visible={clearModalVisible}
        animationType="fade"
        onRequestClose={() => setClearModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>
              Do you want to clear your entire call log?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => setClearModalVisible(false)}
              >
                <Text style={styles.confirmBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleClearConfirm}
              >
                <Text style={styles.confirmBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomBarNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },

  /* ── Search Bar ── */
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2a36',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  /* ── List ── */
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.iconPrimary,
  },
  callInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  status: {
    fontSize: 13,
    marginLeft: 5,
  },
  callRight: {
    padding: 8,
  },

  /* ── Empty ── */
  emptyContainer: {
    flex: 1,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },

  /* ── Dropdown Menu ── */
  menuOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 12,
    backgroundColor: '#1e2d3d',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.textPrimary,
  },

  /* ── Confirm Modal ── */
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmModal: {
    backgroundColor: '#1e2d3d',
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 8,
    paddingHorizontal: 24,
    width: '100%',
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 28,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00A884',
    letterSpacing: 0.5,
  },
});