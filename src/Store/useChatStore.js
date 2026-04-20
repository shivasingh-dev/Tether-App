import { create } from "zustand";
import { disconnectSocket, getSocket } from "../Services/ChatServices";
import { Socket } from "socket.io-client";
import axiosInstance from "../Services/UrlService";
import useUserStore from "./useUserStore";

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  setCurrentConversation: (convId) => set({ currentConversation: convId }),
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  
  // socket event listener setup

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // remove existing listeners to prevent duplicate handlers
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");
    socket.off("reaction_updated");
    socket.off("message_status_update");

    // listen for incoming message
    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    // confirm message delivery
    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg,
        ),
      }));
    });

    // update message status
    socket.on("message_status_update", ({ messageId, messageStatus }) => {

      const { messages, conversations } = get();

      // 1. ✅ Current open chat ke messages update karo
      const msgExists = messages.some((msg) => msg._id === messageId);

      if (msgExists) {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, messageStatus } : msg,
          ),
        }));
      }

      // 2. ✅ Sidebar ka lastMessage status bhi update karo
      // Chahe chat open ho ya band — conversations mein update karo
      const convList = Array.isArray(conversations)
        ? conversations
        : conversations?.data || [];

      if (!convList.length) return;

      const updatedConvList = convList.map((conv) => {
        if (conv.lastMessage === messageId) {
          return {
            ...conv,
            lastMessage: { ...conv.lastMessage, messageStatus },
          };
        }
        return conv;
      });

      set({
        conversations: Array.isArray(conversations)
          ? updatedConvList
          : { ...conversations, data: updatedConvList },
      });
    });

    // handle reaction on message
    socket.on("reaction_updated", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg,
        ),
      }));
    });

    // handle remove message from local state
    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    // handle any message sending error
    socket.on("message_error", (error) => {
      console.error("message error", error);
    });

    // listener for typing users
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }

        return { typingUsers: newTypingUsers };
      });
    });

    // track user's online/offline status
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    // emit status check for all users in conversation list
    const { conversations } = get();
    const convList = Array.isArray(conversations) ? conversations : (conversations?.data || []);
    
    if (convList.length > 0) {
      convList.forEach((conv) => {
        const otherUser = conv.participants?.find(
          (p) => p._id !== get().currentUser?._id,
        );

        if (otherUser && otherUser._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen || otherUser.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chats/conversations");
      set({ conversations: data, loading: false });
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
      });
      return null;
    }
  },

  // fetch message for a conversation
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;

    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`,
      );
      const messageArray = data.data || data || [];
      const currentUser = useUserStore.getState().user;
      
      set((state) => {
        const cList = Array.isArray(state.conversations) ? state.conversations : state.conversations?.data || [];
        const updatedConversations = cList.map(conv => {
           if (conv._id === conversationId) {
              let newUnreadCount = typeof conv.unreadCount === "object" && conv.unreadCount !== null 
                ? { ...conv.unreadCount } : {};
              if (currentUser?._id) {
                newUnreadCount[currentUser?._id] = 0;
              }
              return { ...conv, unreadCount: newUnreadCount };
           }
           return conv;
        });
        
        return {
          messages: messageArray,
          currentConversation: conversationId,
          loading: false,
          conversations: Array.isArray(state.conversations) ? updatedConversations : { ...state.conversations, data: updatedConversations }
        };
      });

      // mark unread message as read
      const { markMessagesAsRead } = get();
      markMessagesAsRead();

      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  // send message in real time
  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();

    const { conversations } = get();
    let conversationId = null;
    const convList = Array.isArray(conversations) ? conversations : (conversations?.data || []);

    if (convList.length > 0) {
      const conversation = convList.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId || p === senderId) &&
          conv.participants.some((p) => p._id === receiverId || p === receiverId),
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    // temp message before actual response
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chats/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const messageData = data.data || data;

      // replace optimistic message with real one and update conversation's last message
      set((state) => {
        const cList = Array.isArray(state.conversations)
          ? state.conversations
          : state.conversations?.data || [];
        const messageConvId = messageData.conversation?._id || messageData.conversation;

        const updatedConversations = cList.map((conv) => {
          if (conv._id === messageConvId || conv._id === conversationId) {
            return { ...conv, lastMessage: messageData };
          }
          return conv;
        });

        return {
          messages: state.messages.map((msg) =>
            msg._id === tempId ? messageData : msg,
          ),
          conversations: Array.isArray(state.conversations)
            ? updatedConversations
            : { ...state.conversations, data: updatedConversations },
        };
      });
    } catch (error) {
      console.error("Error in sending message", error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg,
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  // receive message
  receiveMessage: (message) => {
    if (!message) {
      console.log("❌ ReceiveMessage: No message object received");
      return;
    }

    const { currentConversation, messages, conversations } = get();
    const currentUser = useUserStore.getState().user;
    const incomingConvId =
      message.conversation?._id?.toString() || message.conversation?.toString();
    const activeConvId =
      currentConversation?._id?.toString() || currentConversation?.toString();

    // --- 1. MESSAGE AREA UPDATE ---
    if (activeConvId && activeConvId === incomingConvId) { 
  const messageExists = messages.some((msg) => msg._id === message._id);
  if (!messageExists) {
    set((state) => ({
      messages: [...state.messages, message],
    }));

    if (
      message.receiver?._id === currentUser?._id ||
      message.receiver === currentUser?._id
    ) {
      get().markMessagesAsRead(incomingConvId);
    }
  }
}

    // --- 2. SIDEBAR UPDATE ---
    // ✅ FIX: array ya object dono handle karo
    const convList = Array.isArray(conversations)
      ? conversations
      : conversations?.data;

    if (!convList?.length) {
      console.log("⚠️ Sidebar Update Skipped: convList empty");
      return;
    }

    const updatedConversations = convList.map((conv) => {
      const convId = conv._id?.toString();

      if (convId === incomingConvId) {
        const isChatOpen = activeConvId === incomingConvId;
        const isReceiver =
          message.receiver?._id === currentUser?._id ||
          message.receiver === currentUser?._id;
        const shouldIncrement = isReceiver && !isChatOpen;

        let newUnreadCount = typeof conv.unreadCount === "object" && conv.unreadCount !== null
          ? { ...conv.unreadCount } : {};

        if (shouldIncrement && currentUser?._id) {
          const currentCount = newUnreadCount[currentUser._id] || 0;
          newUnreadCount[currentUser._id] = currentCount + 1;
        }

        return {
          ...conv,
          lastMessage: message,
          unreadCount: newUnreadCount,
        };
      }
      return conv;
    });
    
    console.log(
      "=== SET CONVERSATIONS ===",
      Array.isArray(conversations)
        ? updatedConversations
        : { ...conversations, data: updatedConversations },
    );

    // ✅ FIX: original structure preserve karo
    set({
      conversations: Array.isArray(conversations)
        ? updatedConversations
        : { ...conversations, data: updatedConversations },
    });
  },

  // mark as read
  markMessagesAsRead: async () => {
    const { messages, currentUser, currentConversation  } = get();

    // ✅ Agar currentConversation null hai toh mat karo
  if (!messages.length || !currentUser || !currentConversation) return;
    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" &&
          msg.receiver?._id === currentUser?._id,
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    try {
      const { data } = await axiosInstance.put("/chats/messages/read", {
        messageIds: unreadIds,
      });
      console.log(`messages mark as read`, data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg,
        ),
      }));

      const socket = getSocket();
      if (socket) {
        const otherPersonId = messages.find(
          (msg) => msg.sender?._id !== currentUser?._id,
        )?.sender?._id;

        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: otherPersonId,
        });
      }
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  // delete messages
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chats/messages/${messageId}`);
      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.error("Error in deleting message", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  // add or update reactions
  addReactions: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();
    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        userId: currentUser?._id,
      });
    }
  },

  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

  resetChatState: () =>
    set({
      messages: [],
      currentConversation: null,
    }),

  cleanUp: () => {
    disconnectSocket();
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
