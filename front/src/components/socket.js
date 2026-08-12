import { io } from "socket.io-client";

export const socket = io("https://chat-production-7ac6.up.railway.app", {
  withCredentials: true,
  transports: ["websocket", "polling"], // إجبار استخدام الـ websocket أولاً
});
