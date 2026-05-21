import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000";

let socket;

export const connectSocket = (onNotification) => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("notification", onNotification);
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
};
