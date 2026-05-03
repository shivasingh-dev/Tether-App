import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Animated,
  PermissionsAndroid,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { isToday, isYesterday, format } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useChatStore } from '../Store/useChatStore';
import useLayoutStore from '../Store/useLayoutStore';
import useUserStore from '../Store/useUserStore';
import { getSocket } from '../Services/ChatServices';
import { colors } from '../constants/colors';
import MessageBubble from '../components/MessageBubble';
import EmojiPicker from 'rn-emoji-keyboard';
import useCallStore from '../Store/useCallStore';
import { useContactStore } from '../Store/useContactStore';

// 🎤 Audio recording - try to import, fallback if not available
let useAudioRecorderHook = null;
try {
  const nitroSound = require('react-native-nitro-sound');
  useAudioRecorderHook = nitroSound.useAudioRecorder;
} catch (e) {
  console.warn('🎤 react-native-nitro-sound not available:', e.message);
}

// 📁 File size limits (2MB images, 10MB videos)
const FILE_SIZE_LIMITS = {
  IMAGE: { MAX_SIZE: 2 * 1024 * 1024, LABEL: '2 MB' },
  VIDEO: { MAX_SIZE: 10 * 1024 * 1024, LABEL: '10 MB' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ================================================================
//  Helpers
// ================================================================
const isValidDate = d => d instanceof Date && !isNaN(d);

const formatLastSeen = dateInput => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (!isValidDate(date)) return '';
  const t = format(date, 'HH:mm');
  if (isToday(date)) return `today at ${t}`;
  if (isYesterday(date)) return `yesterday at ${t}`;
  const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diff < 7
    ? `${format(date, 'EEEE')} at ${t}`
    : `${format(date, 'd MMM')} at ${t}`;
};

const formatFileSize = bytes => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = ms => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

// ================================================================
//  ChatScreen
// ================================================================
const ChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUri, setFilePreviewUri] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, type: null });
  const [isClearing, setIsClearing] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [reactionMenuY, setReactionMenuY] = useState(0);

  // 🎤 AUDIO RECORDING STATES
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPath, setAudioPath] = useState(null);

  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const { socket } = getSocket();

  // 🎤 Audio recorder hook — safe fallback if native module not available
  let startRecorder = null;
  let stopRecorder = null;
  try {
    if (useAudioRecorderHook) {
      const audioRecorder = useAudioRecorderHook();
      startRecorder = audioRecorder.startRecorder;
      stopRecorder = audioRecorder.stopRecorder;
    }
  } catch (e) {
    console.warn('🎤 Audio recorder hook failed:', e.message);
  }
  const recordingInterval = useRef(null);

  const { user } = useUserStore();
  const { selectedContact } = useLayoutStore();
  const {
    messages,
    loading,
    sendMessage,
    fetchMessages,
    setCurrentConversation,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    resetChatState,
    addReactions,
    deleteMessage,
    clearChat,
    blockStatus,
    checkBlockStatus,
    blockUser,
    unblockUser,
    reportStatus,
    checkReportStatus,
    reportUser,
    unreportUser,
    setSelectedContactId,
  } = useChatStore();

  const { setSelectedContact } = useLayoutStore();

  const receiverId = selectedContact?.user?._id || selectedContact?._id;
  const online = useChatStore.getState().onlineUsers.has(receiverId)
    ? isUserOnline(receiverId)
    : selectedContact?.user?.isOnline;
  const lastSeen =
    getUserLastSeen(receiverId) || selectedContact?.user?.lastSeen;
  const isTyping = isUserTyping(receiverId);

  const { initiateCall } = useCallStore();
  const { getLocalName } = useContactStore();

  const localName = getLocalName(selectedContact?.user?.phoneNumber);
  const displayName = localName || selectedContact?.user?.fullName || selectedContact?.fullName;

  const handleVideoCall = () => {

    Alert.alert('Coming Soon', 'Video Call feature will be available in upcoming updates.');
    return;

    if (online) {
      initiateCall(
        receiverId,
        displayName,
        selectedContact?.user?.profilePicture || selectedContact?.profilePicture,
        "video"
      );
    } else {
      Alert.alert("User Offline", "Cannot initiate video call while user is offline.");
    }
  };

  const handleVoiceCall = () => {

    Alert.alert('Coming Soon', 'Voice Call feature will be available in upcoming updates.');
    return;

    if (online) {
      initiateCall(
        receiverId,
        displayName,
        selectedContact?.user?.profilePicture || selectedContact?.profilePicture,
        "audio"
      );
    } else {
      Alert.alert("User Offline", "Cannot initiate voice call while user is offline.");
    }
  };

  // ── Selection & Reactions ──
  const handleLongPress = (msg, pageY) => {
    setSelectedMsg(msg);
    setReactionMenuY(pageY || 300);
    setShowReactionMenu(true);
  };

  const handleMessagePress = (msg) => {
    if (selectedMsg) {
      setSelectedMsg(null);
    }
  };

  const handleQuickReact = (emoji) => {
    if (selectedMsg) {
      addReactions(selectedMsg._id, emoji);
      setSelectedMsg(null);
      setShowReactionMenu(false);
    }
  };

  const handleCopy = () => {
    if (selectedMsg && selectedMsg.contentType === 'text') {
      Clipboard.setString(selectedMsg.content);
      setSelectedMsg(null);
    }
  };

  const handleDeleteMsg = () => {
    if (selectedMsg) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteMessage(selectedMsg._id);
              setSelectedMsg(null);
              setShowReactionMenu(false);
            },
          },
        ],
      );
    }
  };

  // ── Init ──
  useEffect(() => {
    const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
    if (convId) {
      setCurrentConversation(convId);
      fetchMessages(convId);

      // Check block and report status
      if (receiverId) {
        setSelectedContactId(receiverId);
        checkBlockStatus(receiverId);
        checkReportStatus(receiverId);
      }
    }
    return () => {
      resetChatState();
      // 🎤 Cleanup: Recording band karo agar chal rahi hai
      if (isRecording) {
        stopRecorder();
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
      }
    };
  }, [selectedContact]);

  // ── Typing ──
  useEffect(() => {
    if (message && selectedContact) {
      startTyping(receiverId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(receiverId), 2000);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [message]);

  // ── Auto scroll ──
  useEffect(() => {
    if (messages?.length) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

  const startRecording = async () => {
    Alert.alert('Coming Soon', 'Audio message feature will be available in upcoming updates.');
    return;
    try {

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "App needs access to your microphone to send audio messages.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Microphone permission is required to record audio.");
          return;
        }
      }

      // Pehle se recording chal rahi hai to return
      if (isRecording) return;

      // Recording path set karo (temp folder mein)
      const path = Platform.select({
        ios: 'voice_message.m4a',
        android: 'voice_message.mp4',
      });

      // Recording start karo
      await startRecorder(path);

      setIsRecording(true);
      setRecordingDuration(0);
      setAudioPath(path);

      // Timer start karo - har 100ms mein duration update
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);

      console.log('🎤 Recording started:', path);
    } catch (error) {
      console.error('Recording start error:', error);
      Alert.alert('Error', 'Voice recording shuru nahi ho saki. Native module missing ho sakta hai.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording) return;

      // Recording stop karo
      const result = await stopRecorder();

      // Timer band karo
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      setIsRecording(false);

      console.log('🎤 Recording stopped:', result);

      // Agar recording bahut choti hai (< 1 second) to send mat karo
      if (recordingDuration < 1000) {
        Alert.alert('Too Short', 'Recording kam se kam 1 second honi chahiye');
        setRecordingDuration(0);
        setAudioPath(null);
        return;
      }

      // Audio file ko send karo
      await sendAudioMessage(result, recordingDuration);

      // Reset state
      setRecordingDuration(0);
      setAudioPath(null);
    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('Error', 'Recording save nahi hui');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    try {
      if (!isRecording) return;

      await stopRecorder();

      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      setIsRecording(false);
      setRecordingDuration(0);
      setAudioPath(null);

      console.log('🎤 Recording cancelled');
    } catch (error) {
      console.error('Recording cancel error:', error);
    }
  };

  const sendAudioMessage = async (audioUri, duration) => {
    if (!selectedContact || !user?._id) return;

    try {
      await sendMessage({
        senderId: user._id,
        receiverId,
        media: {
          uri: Platform.OS === 'ios' ? audioUri : `file://${audioUri}`,
          type: 'audio/mp4',
          name: `voice_${Date.now()}.${Platform.OS === 'ios' ? 'm4a' : 'mp4'}`,
        },
        messageStatus: 'sent',
        conversationId: selectedContact?.conversationId || selectedContact?.conversation?._id
      });
      console.log('🎤 Audio message sent successfully');
    } catch (err) {
      console.error('sendAudioMessage error:', err);
      Alert.alert('Error', 'Audio message send nahi hui');
    }
  };

  const handlePickImage = () => {
    setShowAttachMenu(false);
    Alert.alert("Coming Soon", "Sending image and video will be available soon!");
    return;
    /*
    launchImageLibrary({ mediaType: 'mixed', quality: 0.85 }, async res => {
      if (res.didCancel || res.errorCode) return;
      const asset = res.assets?.[0];
      if (!asset) return;

      const fileSize = asset.fileSize || 0;
      const fileType = asset.type || 'image/jpeg';

      // File size validation
      if (fileType.startsWith('image/')) {
        if (fileSize > FILE_SIZE_LIMITS.IMAGE.MAX_SIZE) {
          Alert.alert(
            'Image Too Large',
            `Selected image is ${formatFileSize(fileSize)}.\nMaximum allowed: ${FILE_SIZE_LIMITS.IMAGE.LABEL}`,
          );
          return;
        }
      } else if (fileType.startsWith('video/')) {
        if (fileSize > FILE_SIZE_LIMITS.VIDEO.MAX_SIZE) {
          Alert.alert(
            'Video Too Large',
            `Selected video is ${formatFileSize(fileSize)}.\nMaximum allowed: ${FILE_SIZE_LIMITS.VIDEO.LABEL}`,
          );
          return;
        }
      }

      setSelectedFile({
        uri: asset.uri,
        type: fileType,
        name: asset.fileName || 'media.jpg',
        size: fileSize,
      });
      setFilePreviewUri(asset.uri);
    });
    */
  };

  // ── Send text/image ──
  const handleSend = async () => {
    if (!selectedContact || !user?._id) return;
    if (!message.trim() && !selectedFile) return;
    try {
      const response = await sendMessage({
        senderId: user._id,
        receiverId,
        content: message.trim(),
        media: selectedFile,
        messageStatus: 'sent',
        conversationId: selectedContact?.conversationId || selectedContact?.conversation?._id
      });

      // Agar ye new conversation thi (Id nahi thi), toh store update hone ke baad response se id nikal kar update karo
      if (response && !selectedContact.conversationId) {
        const newConvId = response.conversation?._id || response.conversation;
        if (newConvId) {
          setSelectedContact({
            ...selectedContact,
            conversationId: newConvId
          });
        }
      }

      setMessage('');
      setSelectedFile(null);
      setFilePreviewUri(null);
    } catch (err) {
      console.error('handleSend:', err);
    }
  };

  // ── Grouped messages → flat array for FlatList ──
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, msg) => {
        if (!msg.createdAt) return acc;
        const d = new Date(msg.createdAt);
        if (isValidDate(d)) {
          const k = format(d, 'yyyy-MM-dd');
          if (!acc[k]) acc[k] = [];
          acc[k].push(msg);
        }
        return acc;
      }, {})
    : {};

  const flatData = Object.entries(groupedMessages).flatMap(([ds, msgs]) => {
    const filtered = msgs.filter(m => {
      const mc = m.conversation?._id?.toString() || m.conversation?.toString();
      const cc =
        selectedContact?.conversationId?.toString() ||
        selectedContact?.conversation?._id?.toString();
      
      // Agar conversation ID match ho jati hai toh simple hai
      if (cc && mc === cc) return true;

      // Agar conversation ID nahi hai (New Chat case), toh sender aur receiver se match karo
      if (!cc) {
        const sId = user?._id?.toString();
        const rId = receiverId?.toString();
        const msgSender = m.sender?._id?.toString() || m.sender?.toString();
        const msgReceiver = m.receiver?._id?.toString() || m.receiver?.toString();
        
        return (msgSender === sId && msgReceiver === rId) || (msgSender === rId && msgReceiver === sId);
      }

      return false;
    });
    if (!filtered.length) return [];
    return [{ type: 'date', id: `d-${ds}`, date: new Date(ds) }, ...filtered];
  });

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === 'date') {
        const lbl = isToday(item.date)
          ? 'Today'
          : isYesterday(item.date)
          ? 'Yesterday'
          : format(item.date, 'EEEE, MMMM d');
        return (
          <View style={styles.dateSep}>
            <Text style={styles.dateText}>{lbl}</Text>
          </View>
        );
      }
      return (
        <MessageBubble
          message={item}
          currentUser={user}
          onReact={(id, e) => addReactions(id, e)}
          deleteMessage={deleteMessage}
          isSelected={selectedMsg?._id === item._id}
          onLongPress={handleLongPress}
          onPress={handleMessagePress}
        />
      );
    },
    [user, addReactions, deleteMessage, selectedMsg],
  );

  // Agar message ya file selected hai to Send button, warna Mic button
  const showSend = message.trim().length > 0 || !!selectedFile;

  const statusText = isTyping
    ? 'Typing...'
    : online
    ? 'Online'
    : lastSeen
    ? `Last seen ${formatLastSeen(lastSeen)}`
    : 'Offline';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.hBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconPrimary} />
          </TouchableOpacity>

          {selectedContact?.user?.profilePicture ? (
            <Image
              source={{ uri: selectedContact.user.profilePicture }}
              style={styles.hAvatar}
            />
          ) : (
            <View style={styles.hAvatarFallback}>
              <Text style={styles.hAvatarText}>
                {(displayName || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            {selectedMsg ? (
              <Text style={styles.hName}>1</Text>
            ) : (
              <>
                <Text style={styles.hName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text
                  style={[
                    styles.hStatus,
                    { color: isTyping || online ? '#4ade80' : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {statusText}
                </Text>
              </>
            )}
          </View>

          {selectedMsg ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.hBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={20} color={colors.iconPrimary} />
              </TouchableOpacity>
              {((selectedMsg.sender?._id?.toString() || selectedMsg.sender?.toString()) === user?._id?.toString()) && (
                <TouchableOpacity style={styles.hBtn} onPress={handleDeleteMsg}>
                  <Ionicons name="trash-outline" size={20} color="#f87171" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.hBtn} onPress={() => setSelectedMsg(null)}>
                <Ionicons name="close" size={22} color={colors.iconPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.hBtn} 
                activeOpacity={0.7}
                onPress={handleVideoCall}
              >
                <Ionicons
                  name="videocam-outline"
                  size={22}
                  color={online ? colors.iconPrimary : colors.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.hBtn} 
                activeOpacity={0.7}
                onPress={handleVoiceCall}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={online ? colors.iconPrimary : colors.textMuted}
                />
              </TouchableOpacity>
            </>
          )}
          
          <View>
            <TouchableOpacity 
              onPress={() => {
                setShowActionMenu(!showActionMenu);
                setShowEmojiPanel(false);
                setShowAttachMenu(false);
              }} 
              style={styles.hBtn} 
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="more-vert"
                size={22}
                color={colors.iconPrimary}
              />
            </TouchableOpacity>

            <Modal
              visible={showActionMenu}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowActionMenu(false)}
            >
              <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={() => setShowActionMenu(false)}
              >
                <View style={styles.actionMenu}>
                  <TouchableOpacity
                    onPress={() => {
                      setConfirmModal({ visible: true, type: 'clear' });
                      setShowActionMenu(false);
                    }}
                    style={styles.actionItem}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#93c5fd" />
                    <Text style={styles.actionLbl}>Clear Chat</Text>
                  </TouchableOpacity>
                  <View style={styles.actionDivider}></View>
                  <TouchableOpacity
                    onPress={() => {
                      if (blockStatus.isBlockedByMe) {
                        unblockUser(receiverId);
                      } else {
                        setConfirmModal({ visible: true, type: 'block' });
                      }
                      setShowActionMenu(false);
                    }}
                    style={styles.actionItem}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={blockStatus.isBlockedByMe ? "checkmark-circle-outline" : "ban-outline"} 
                      size={18} 
                      color={blockStatus.isBlockedByMe ? "#00A884" : "#ef4444"} 
                    />
                    <Text style={[styles.actionLbl, { color: blockStatus.isBlockedByMe ? "#00A884" : '#ef4444' }]}>
                      {blockStatus.isBlockedByMe ? 'Unblock User' : 'Block User'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.actionDivider}></View>
                  <TouchableOpacity
                    onPress={async () => {
                      if (reportStatus.isReportedByMe) {
                        try {
                          await unreportUser(receiverId);
                          Alert.alert("Success", "User unreported successfully");
                        } catch (e) {
                          Alert.alert("Error", "Failed to unreport user");
                        }
                      } else {
                        setConfirmModal({ visible: true, type: 'report' });
                      }
                      setShowActionMenu(false);
                    }}
                    style={styles.actionItem}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={reportStatus.isReportedByMe ? "shield-checkmark-outline" : "warning-outline"} 
                      size={18} 
                      color={reportStatus.isReportedByMe ? "#00A884" : "#eab308"} 
                    />
                    <Text style={[styles.actionLbl, { color: reportStatus.isReportedByMe ? "#00A884" : '#eab308' }]}>
                      {reportStatus.isReportedByMe ? 'Unreport User' : 'Report User'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

        {/* MESSAGES AREA */}
        {loading ? (
          <View style={styles.loadBox}>
            <ActivityIndicator size="large" color={colors.iconPrimary} />
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={flatData}
              keyExtractor={item => item._id || item.id || item.tempId}
              renderItem={renderItem}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
            
            {/* QUICK REACTION OVERLAY */}
            {showReactionMenu && (
              <View style={StyleSheet.absoluteFill}>
                <Pressable 
                  style={styles.reactionOverlay} 
                  onPress={() => {
                    setShowReactionMenu(false);
                    setSelectedMsg(null);
                  }}
                >
                  <View style={[styles.reactionMenuBox, {
                    position: 'absolute',
                    top: Math.max(50, Math.min(reactionMenuY - 70, Dimensions.get('window').height - 150))
                  }]}>
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleQuickReact(emoji)}
                        style={styles.reactionBtn}
                      >
                        <Text style={styles.reactionEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* 🎤 RECORDING BANNER */}
        {isRecording && (
          <View style={styles.recBanner}>
            <View style={styles.recDot}></View>
            <Text style={styles.recText}>Recording...</Text>
            <Text style={styles.recDuration}>
              {formatDuration(recordingDuration)}
            </Text>
            <TouchableOpacity
              onPress={cancelRecording}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* IMAGE PREVIEW */}
        {filePreviewUri && (
          <View style={styles.previewBox}>
            {selectedFile?.type?.startsWith('video') ? (
              <Text style={styles.videoLbl}>🎥 Video selected</Text>
            ) : (
              <Image
                source={{ uri: filePreviewUri }}
                style={styles.previewImg}
                resizeMode="cover"
              />
            )}
            <View style={styles.previewInfo}>
              <Text style={{ fontSize: 18 }}>
                {selectedFile?.type?.startsWith('video') ? '🎥' : '🖼️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {selectedFile?.name}
                </Text>
                <Text style={styles.previewSize}>
                  {formatFileSize(selectedFile?.size)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedFile(null);
                setFilePreviewUri(null);
              }}
              style={styles.removeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* EMOJI PANEL — rn-emoji-keyboard (full emoji support like web) */}
        <EmojiPicker
          onEmojiSelected={emojiObject => setMessage(p => p + emojiObject.emoji)}
          open={showEmojiPanel}
          onClose={() => setShowEmojiPanel(false)}
          theme={{
            backdrop: '#00000050',
            knob: '#93c5fd',
            container: '#06234f',
            header: '#93c5fd',
            skinTonesContainer: '#0a1a3a',
            category: {
              icon: '#93c5fd',
              iconActive: '#60a5fa',
              container: '#06234f',
              containerActive: '#0a1a3a',
            },
            search: {
              text: '#ffffff',
              placeholder: '#93c5fd80',
              icon: '#93c5fd',
              background: '#0a1a3a',
            },
            emoji: {
              selected: '#2563eb40',
            },
          }}
          enableSearchBar
          enableRecentlyUsed
          categoryPosition="top"
          expandable={true}
        />

        {/* BLOCKED BANNER ABOVE INPUT */}
        {!blockStatus.canMessage && (
          <View style={[styles.blockBanner, { marginBottom: 5 }]}>
            <Text style={styles.blockText}>
              {blockStatus.isBlockedByMe ? (
                <Text>
                  You blocked this contact.{" "}
                  <Text 
                    onPress={() => unblockUser(receiverId)}
                    style={styles.unblockLink}
                  >
                    Tap to unblock
                  </Text>
                </Text>
              ) : (
                <Text>You can no longer message this contact.</Text>
              )}
            </Text>
          </View>
        )}


        {/* INPUT BAR */}
        <View style={[styles.inputBar, !blockStatus.canMessage && { opacity: 0.5, pointerEvents: 'none' }]}>
          {/* Attach */}
          <View>
            <TouchableOpacity
              onPress={() => {
                setShowAttachMenu(p => !p);
                setShowEmojiPanel(false);
              }}
              style={styles.iBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="attach" size={22} color={colors.iconPrimary} />
            </TouchableOpacity>
            {showAttachMenu && (
              <View style={styles.attachMenu}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.attachItem}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color={colors.iconPrimary}
                  />
                  <Text style={styles.attachLbl}>Image / Video</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Emoji */}
          <TouchableOpacity
            onPress={() => {
              setShowEmojiPanel(p => !p);
              setShowAttachMenu(false);
            }}
            style={styles.iBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showEmojiPanel ? 'keypad-outline' : 'happy-outline'}
              size={22}
              color={colors.iconPrimary}
            />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            onFocus={() => {
              setShowEmojiPanel(false);
              setShowAttachMenu(false);
            }}
            placeholder={blockStatus.isBlockedByMe ? "Unblock to send" : (blockStatus.isBlockedByThem ? "You are blocked" : "Type a message")}
            placeholderTextColor={colors.textPlaceholder}
            style={styles.textInput}
            multiline
            maxLength={2000}
            editable={blockStatus.canMessage}
          />

          {showSend ? (
            // Send Button (jab message ya image selected ho)
            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={17} color="#fff" />
            </TouchableOpacity>
          ) : (
            // Microphone Button (jab kuch nahi hai)
            <TouchableOpacity
              onPressIn={startRecording} 
              onPressOut={stopRecording} 
              style={[styles.sendBtn, isRecording && styles.sendBtnRec]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={17}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal({ visible: false, type: null })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setConfirmModal({ visible: false, type: null })}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: confirmModal.type === 'clear' ? 'rgba(37,99,235,0.1)' : 'rgba(239,68,68,0.1)' }]}>
              <Ionicons 
                name={confirmModal.type === 'clear' ? 'trash' : (confirmModal.type === 'report' ? 'warning' : 'alert-circle')} 
                size={32} 
                color={confirmModal.type === 'clear' ? '#2563eb' : '#ef4444'} 
              />
            </View>

            <Text style={styles.modalTitle}>
              {confirmModal.type === 'report' ? 'Report this User?' : (confirmModal.type === 'block' ? 'Block this User?' : 'Clear Conversation?')}
            </Text>
            <Text style={styles.modalDesc}>
              {confirmModal.type === 'report'
                ? "Are you sure you want to report this user?"
                : (confirmModal.type === 'block' 
                  ? "Are you sure? You won't be able to send or receive messages from this contact."
                  : "This will permanently delete all messages in this chat. This action cannot be undone.")}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                disabled={isClearing}
                onPress={() => setConfirmModal({ visible: false, type: null })}
                style={[styles.modalCancel, isClearing && { opacity: 0.5 }]}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isClearing}
                onPress={async () => {
                  if (confirmModal.type === 'clear') {
                    setIsClearing(true);
                    const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
                    const success = await clearChat(convId);
                    setIsClearing(false);
                    if (success) {
                      setConfirmModal({ visible: false, type: null });
                    } else {
                      Alert.alert('Error', 'Failed to clear chat');
                    }
                  } else if (confirmModal.type === 'block') {
                    try {
                      await blockUser(receiverId);
                      setConfirmModal({ visible: false, type: null });
                    } catch (error) {
                      Alert.alert('Error', 'Failed to block user');
                    }
                  } else if (confirmModal.type === 'report') {
                    try {
                      await reportUser(receiverId);
                      setConfirmModal({ visible: false, type: null });
                      Alert.alert("Success", "You have successfully reported this user");
                    } catch (error) {
                      Alert.alert('Error', 'Failed to report user');
                    }
                  } else {
                    setConfirmModal({ visible: false, type: null });
                  }
                }}
                style={[
                  styles.modalConfirm, 
                  { backgroundColor: confirmModal.type === 'clear' ? '#2563eb' : '#ef4444' },
                  isClearing && { opacity: 0.7 }
                ]}
                activeOpacity={0.8}
              >
                {isClearing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,138,0.25)',
    gap: 6,
    zIndex: 2,
    elevation: 2,
  },
  hBtn: { padding: 8, borderRadius: 99 },
  hAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  hAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06234f',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hAvatarText: { fontSize: 15, fontWeight: '700', color: colors.iconPrimary },
  hName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#eff6ff',
    letterSpacing: -0.2,
  },
  hStatus: { fontSize: 12, marginTop: 1 },

  // Messages
  loadBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  // Date separator
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(30,58,138,0.25)' },
  dateText: {
    fontSize: 13,
    color: 'rgba(147,197,253,0.55)',
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(6,35,79,0.5)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.25)',
  },

  // 🎤 Recording Banner
  recBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(6,35,79,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,58,138,0.3)',
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recText: { fontSize: 14, color: '#fff', fontWeight: '600', flex: 1 },
  recDuration: {
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cancelBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  cancelText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },

  // Image preview
  previewBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,58,138,0.25)',
    backgroundColor: colors.background,
  },
  previewImg: {
    height: 110,
    width: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
    marginBottom: 8,
  },
  videoLbl: { color: colors.textPrimary, fontSize: 14, marginBottom: 8 },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6,35,79,0.5)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewName: { fontSize: 12, color: '#bfdbfe' },
  previewSize: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 99,
    padding: 4,
  },

  // Emoji
  emojiPanel: {
    backgroundColor: '#06234f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,58,138,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emojiBtn: {
    padding: 6,
    borderRadius: 8,
    width: (SCREEN_WIDTH - 56) / 8,
    alignItems: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginVertical: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0a1a3a',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.2)',
    gap: 2,
  },
  iBtn: { padding: 8, borderRadius: 99, alignSelf: 'flex-end' },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
    alignSelf: 'center',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 99,
    padding: 9,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  sendBtnRec: {
    backgroundColor: '#dc2626', // 🎤 Recording mode mein red color
  },

  // Attach
  attachMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: '#06234f',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
    marginBottom: 8,
  },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachLbl: { fontSize: 13, color: '#bfdbfe' },

  // Action Menu
  actionMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#06234f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    minWidth: 150,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionLbl: { fontSize: 13, color: '#bfdbfe', fontWeight: '500' },
  actionDivider: { height: 1, backgroundColor: 'rgba(30,58,138,0.2)' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#061838',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.1)',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: 'rgba(147,197,253,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.4)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bfdbfe',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Block styles
  blockBanner: {
    backgroundColor: 'rgba(37,99,235,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center',
  },
  blockText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  unblockLink: {
    color: colors.iconPrimary,
    fontWeight: '700',
  },
  // Reaction Modal Styles
  reactionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionMenuBox: {
    flexDirection: 'row',
    backgroundColor: '#0a1f44',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  reactionBtn: {
    padding: 2,
  },
  reactionEmojiText: {
    fontSize: 26,
  },
});

export default ChatScreen;
