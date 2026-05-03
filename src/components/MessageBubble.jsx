import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';       
import { format } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import Clipboard from '@react-native-clipboard/clipboard';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Quick reactions (web se same) ──
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageBubble = ({ 
  message, 
  currentUser, 
  onReact, 
  deleteMessage, 
  isSelected, 
  onLongPress,
  onPress
}) => {
  const isMyMessage = message?.sender?._id === currentUser?._id;

  // ── Reaction press ──
  const handleReact = (emoji) => {
    onReact(message._id, emoji);
  };

  if (!message) return null;

  return (
    <Pressable
      onLongPress={(e) => onLongPress(message, e.nativeEvent.pageY)}
      onPress={() => onPress(message)}
      delayLongPress={300}
      style={[
        styles.wrapper,
        isMyMessage ? styles.wrapperRight : styles.wrapperLeft,
        isSelected && styles.wrapperSelected,
      ]}
    >
      {/* ── Message Bubble ── */}
      <View
        style={[
          styles.bubble,
          isMyMessage ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {/* Text Content */}
        {message.contentType === 'text' && (
          <View style={styles.textContainer}>
            <Text style={styles.messageText}>
              {message.content}
              <Text style={styles.timePlaceholder}> {'               '}{isMyMessage ? '    ' : ''} </Text>
            </Text>
          </View>
        )}

        {/* Image Content */}
        {message.contentType === 'image' && (
          <View>
            <Image
              source={{ uri: message.imageOrVideoUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {message.content ? (
              <Text style={[styles.messageText, { marginTop: 6 }]}>
                {message.content}
                <Text style={styles.timePlaceholder}> {'               '}{isMyMessage ? '    ' : ''} </Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* Video Content */}
        {message.contentType === 'video' && (
          <View>
            <Video
              source={{ uri: message.imageOrVideoUrl }}
              style={styles.mediaVideo}
              controls
              paused
              resizeMode="contain"
            />
            {message.content ? (
              <Text style={[styles.messageText, { marginTop: 6 }]}>
                {message.content}
                <Text style={styles.timePlaceholder}> {'               '}{isMyMessage ? '    ' : ''} </Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* Audio Content */}
        {message.contentType === 'audio' && (
          <View>
            <Video
              source={{ uri: message.imageOrVideoUrl }}
              style={styles.mediaAudio}
              controls
              paused
              audioOnly
            />
          </View>
        )}

        {/* ── Time + Status (Absolute at bottom-right of bubble) ── */}
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isMyMessage ? styles.timeTextMine : styles.timeTextTheirs]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
          {isMyMessage && (
            <View style={styles.statusIcon}>
              {message.messageStatus === 'sent' && (
                <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.5)" />
              )}
              {message.messageStatus === 'delivered' && (
                <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.5)" />
              )}
              {message.messageStatus === 'read' && (
                <Ionicons name="checkmark-done" size={12} color="#38bdf8" />
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Reactions Display ── */}
      {message.reactions?.length > 0 && (
        <View style={[styles.reactionsDisplay, isMyMessage ? styles.reactionsRight : styles.reactionsLeft]}>
          {message.reactions.slice(0, 3).map((r, i) => (
            <Text key={i} style={styles.reactionEmoji}>{r.emoji}</Text>
          ))}
          {message.reactions.length > 1 && (
            <Text style={styles.reactionCount}>{message.reactions.length}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
    width: '100%',
    flexDirection: 'column',
  },
  wrapperRight: {
    alignItems: 'flex-end',
  },
  wrapperLeft: {
    alignItems: 'flex-start',
  },
  wrapperSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Highlight color
  },

  // ── Bubbles ──
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '85%',
    minWidth: 95,
    position: 'relative',
  },
  bubbleMine: {
    backgroundColor: '#1d4ed8', // Darker blue
    borderTopRightRadius: 2,
  },
  bubbleTheirs: {
    backgroundColor: '#1e293b', // Dark gray/blue
    borderTopLeftRadius: 2,
  },

  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#ffffff',
  },
  timePlaceholder: {
    fontSize: 10,
    color: 'transparent',
  },

  // ── Media ──
  mediaImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
    marginBottom: 4,
  },
  mediaVideo: {
    width: 240,
    height: 160,
    borderRadius: 8,
  },
  mediaAudio: {
    width: 240,
    height: 40,
  },

  // ── Time + Status ──
  timeRow: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '400',
  },
  timeTextMine: { color: 'rgba(255,255,255,0.6)' },
  timeTextTheirs: { color: 'rgba(255,255,255,0.4)' },
  statusIcon: {
    marginLeft: 2,
  },

  // ── Reactions Display ──
  reactionsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -10,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionsRight: { alignSelf: 'flex-end', marginRight: 15 },
  reactionsLeft: { alignSelf: 'flex-start', marginLeft: 15 },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, color: '#94a3b8', marginLeft: 2 },
});

export default MessageBubble;