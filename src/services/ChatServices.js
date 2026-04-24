import { io } from "socket.io-client";
import useUserStore from "../Store/useUserStore";
import { API_BASE_URL } from "./UrlService";

let socket = null;

export const initializeSocket = () => {
  if (socket && socket.connected) return socket;

  // Purana disconnected socket cleanup karo
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // connected events of socket
  // ✅ FIX: Har connect/reconnect par FRESH user data read karo
  socket.on("connect", () => {
    const user = useUserStore.getState().user;
    console.log("socket connected", socket.id);
    if (user?._id) socket.emit("user_connected", { userId: user._id, source: "app" });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error", error);
  });
  
  socket.on("force_logout", (data) => {
    // Disconnect and nullify socket FIRST so re-login can create a fresh one
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    useUserStore.getState().clearUser();
    import('react-native').then(({ Alert }) => {
       Alert.alert("Session Expired", data.message || "Logged in from another device");
    });
  });

  // disconnected event
  socket.on("disconnect", (reason) => {
    console.log("socket disconnected", reason);
  });

  return socket;
};


export const getSocket = () => {
  if (!socket || !socket.connected) {
    return initializeSocket()
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect()
    socket = null
  }
}
