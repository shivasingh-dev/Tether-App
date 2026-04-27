import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { colors } from '../constants/colors';
import BottomBarNavigator from '../components/BottomBarNavigator';
import useLayoutStore from '../Store/useLayoutStore';
import useCallHistoryStore from '../Store/useCallHistoryStore';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';

export default function CallHistoryScreen() {
  const { setActiveTab } = useLayoutStore();
  const { callHistory, clearHistory } = useCallHistoryStore();

  useEffect(() => {
    setActiveTab('calls');
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.callItem}>
      <Image source={{ uri: item.participantAvatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <View style={styles.callInfo}>
        <Text style={styles.name}>{item.participantName}</Text>
        <View style={styles.statusRow}>
          <Icon 
            name={item.callType === 'video' ? 'video' : 'phone'} 
            size={14} 
            color={item.status === 'completed' ? '#00A884' : '#ef4444'} 
          />
          <Text style={[styles.status, { color: item.status === 'completed' ? colors.textMuted : '#ef4444' }]}>
            {item.status === 'completed' ? 'Outgoing' : 'Missed'} • {format(new Date(item.timestamp), 'MMM d, h:mm a')}
          </Text>
        </View>
      </View>
      <View style={styles.callRight}>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
        {callHistory.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={callHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="phone-off" size={60} color={colors.iconSecondary} />
            <Text style={styles.emptyText}>No call history yet</Text>
          </View>
        }
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 14,
    marginLeft: 5,
  },
  callRight: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 13,
    color: colors.textMuted,
  },
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
  },
});