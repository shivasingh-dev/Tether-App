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

const MessageBubble = ({ message, currentUser, onReact, deleteMessage }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions]     = useState(false);

  const isMyMessage = message?.sender?._id === currentUser?._id;

  // ── Reaction press ──
  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
  };

  // ── Copy text ──
  const handleCopy = () => {
    if (message.contentType === 'text') {
      Clipboard.setString(message.content);
    }
    setShowOptions(false);
  };

  // ── Delete message ──
  const handleDelete = () => {
    setShowOptions(false);
    Alert.alert(
      'Delete Message',
      'Kya aap is message ko delete karna chahte hain?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(message?._id),
        },
      ],
    );
  };

  if (!message) return null;

  return (
    <View
      style={[
        styles.wrapper,
        isMyMessage ? styles.wrapperRight : styles.wrapperLeft,
        message.reactions?.length > 0 && styles.wrapperWithReaction,
      ]}
    >
      {/* ── Message Bubble ── */}
      <Pressable
        onLongPress={() => setShowOptions(true)}
        delayLongPress={350}
        style={[
          styles.bubble,
          isMyMessage ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {/* Text Content */}
        {message.contentType === 'text' && (
          <Text style={styles.messageText}>
            {message.content}
            {'  '}
            <Text style={styles.spacer}>{'       '}</Text>
          </Text>
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

        {/* ── Time + Status ── */}
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isMyMessage ? styles.timeTextMine : styles.timeTextTheirs]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
          {isMyMessage && (
            <View style={styles.statusIcon}>
              {message.messageStatus === 'sent' && (
                <Ionicons name="checkmark" size={13} color="rgba(219,234,254,0.7)" />
              )}
              {message.messageStatus === 'delivered' && (
                <Ionicons name="checkmark-done" size={13} color="rgba(219,234,254,0.7)" />
              )}
              {message.messageStatus === 'read' && (
                <Ionicons name="checkmark-done" size={13} color="#38bdf8" />
              )}
            </View>
          )}
        </View>
      </Pressable>

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

      {/* ── Quick Reactions Modal ── */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowReactions(false)}>
          <View style={styles.reactionsMenu}>
            {QUICK_REACTIONS.map((emoji, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleReact(emoji)}
                style={styles.reactionBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionBtnEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Options Modal (Copy / Delete) ── */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.optionsMenu}>
            {/* Copy */}
            {message.contentType === 'text' && (
              <TouchableOpacity onPress={handleCopy} style={styles.optionItem} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={15} color={colors.iconPrimary} />
                <Text style={styles.optionText}>Copy</Text>
              </TouchableOpacity>
            )}

            {/* Delete (sirf apne messages ke liye) */}
            {isMyMessage && (
              <>
                <View style={styles.optionDivider} />
                <TouchableOpacity onPress={handleDelete} style={styles.optionItem} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={15} color="#f87171" />
                  <Text style={[styles.optionText, styles.optionTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
    maxWidth: '75%',
  },
  wrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  wrapperWithReaction: {
    marginBottom: 20,
  },

  // ── Bubbles ──
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 22,   // Space for time row
    borderRadius: 18,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleMine: {
    backgroundColor: '#1d4ed8',  // Blue — same as web
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.3)',
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
    color: '#f0f4ff',
  },
  spacer: {
    opacity: 0,  // Invisible spacer for time overlap
  },

  // ── Media ──
  mediaImage: {
    width: Math.min(SCREEN_WIDTH * 0.55, 240),
    height: Math.min(SCREEN_WIDTH * 0.55, 240),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.2)',
  },
  mediaVideo: {
    width: Math.min(SCREEN_WIDTH * 0.55, 240),
    height: 160,
    borderRadius: 12,
  },
  mediaAudio: {
    width: Math.min(SCREEN_WIDTH * 0.55, 240),
    height: 50,
    borderRadius: 12,
  },

  // ── Time + Status ──
  timeRow: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeTextMine:   { color: 'rgba(219,234,254,0.75)' },
  timeTextTheirs: { color: 'rgba(147,197,253,0.55)' },
  statusIcon: {
    marginBottom: -1,
  },

  // ── Action Buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  actionRowLeft:  { flexDirection: 'row-reverse' },
  actionRowRight: { flexDirection: 'row' },
  actionBtn: {
    padding: 5,
    borderRadius: 99,
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.4)',
  },

  // ── Reactions Display ──
  reactionsDisplay: {
    position: 'absolute',
    bottom: -14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  reactionsRight: { right: 10 },
  reactionsLeft:  { left: 10 },
  reactionEmoji: { fontSize: 12, lineHeight: 14 },
  reactionCount: { fontSize: 10, color: '#90a4be', fontWeight: '600' },

  // ── Modal Overlay ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Quick Reactions Menu ──
  reactionsMenu: {
    flexDirection: 'row',
    backgroundColor: '#0a1f44',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  reactionBtn:      { padding: 4 },
  reactionBtnEmoji: { fontSize: 22 },

  // ── Options Menu ──
  optionsMenu: {
    backgroundColor: '#0a1f44',
    borderRadius: 14,
    width: 160,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  optionText:       { fontSize: 13, color: '#bfdbfe' },
  optionTextDanger: { color: '#f87171' },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(30,58,138,0.4)',
  },
});

export default MessageBubble;