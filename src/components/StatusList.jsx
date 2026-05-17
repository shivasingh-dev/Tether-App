import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import formatTimestamp from '../Utils/data';
import useUserStore from '../Store/useUserStore';
import { useContactStore } from '../Store/useContactStore';

const StatusList = ({ contact, onPreview }) => {
  const { user } = useUserStore();
  const { contactMapping } = useContactStore();
  
  const cleanPhone = contact?.phoneNumber?.replace(/\D/g, '').slice(-10);
  const displayName = contactMapping[cleanPhone] || contact?.name || contact?.phoneNumber || "Unknown";

  return (
    <TouchableOpacity
      onPress={onPreview}
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Avatar with Status Ring */}
      <View style={styles.avatarContainer}>
        {contact?.avatar ? (
          <Image
            source={{ uri: contact.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* SVG Status Ring */}
        <Svg style={styles.statusRing} viewBox="0 0 100 100">
          {contact?.statuses?.map((_, index) => {
            const total = contact?.statuses?.length || 1;
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
      </View>

      {/* Contact Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(contact?.statuses?.[contact?.statuses?.length - 1]?.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
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
    borderColor: 'rgba(41, 121, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e50ccff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: 'rgba(147, 197, 253, 0.7)',
  },
});

export default StatusList;