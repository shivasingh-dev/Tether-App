import { io } from "socket.io-client";
import useUserStore from "../Store/useUserStore";
import { API_BASE_URL } from "./UrlService";

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;

  const user = useUserStore.getState().user;

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // connected events of socket

  socket.on("connect", () => {
    console.log("socket connected", socket.id);
    if (user?._id) socket.emit("user_connected", user._id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error", error);
  });

  // disconnected event
  socket.on("disconnect", (reason) => {
    console.log("socket disconnected", reason);
  });

  return socket;
};


export const getSocket = () => {
  if (!socket) {
    return initializeSocket()
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
