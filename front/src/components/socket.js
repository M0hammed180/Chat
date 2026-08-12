import { io } from "socket.io-client";

export const socket = io("https://chat-production-67d2.up.railway.app", {
  transports: ["websocket", "polling"],
});
