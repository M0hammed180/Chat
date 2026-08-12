const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const users = require("./controllers/users.controller");
const messages = require("./controllers/messages.controller");
const chats = require("./controllers/chats.controller");
const chatsRoutes = require("./routes/chats.route");
const userRoutes = require("./routes/users.route");

// Mongoose Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected successfully to DB"))
  .catch((e) => console.error(`Error connecting to DB: ${e}`));

// Express App Setup
const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-six-mu-81.vercel.app",
  "https://chat-git-main-m0hammed180s-projects.vercel.app",
  "https://chat-m71c50blp-m0hammed180s-projects.vercel.app",
  "https://chat-4dx5u6s82-m0hammed180s-projects.vercel.app",
];

// 1. تمرير الروابط المسموحة للـ CORS الخاص بـ Express
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/user", userRoutes);
app.use("/chats", chatsRoutes);

// global error handler
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || "error",
    message: error.message,
    code: error.statusCode || 500,
    data: null,
  });
});

// HTTP Server & Socket.IO
const server = http.createServer(app);

// 2. تمرير نفس الروابط للـ CORS الخاص بـ Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
});

io.on("connection", (socket) => {
  // User & Status events
  socket.on("add-user", (userId) => users.connected(socket, io, userId));
  socket.on("join_chat", (chatId) => users.joinChat(socket, chatId));
  socket.on("typing", (data) => users.typing(socket, data));
  socket.on("stop-typing", (data) => users.stopTyping(socket, data));
  socket.on("disconnect", () => users.disconnect(socket, io));
  socket.on("leave_chat", (chatId) => {
    users.leaveChat(socket, chatId);
  });

  // Message events
  socket.on("send_message", (data) => messages.sendMessage(socket, io, data));
  socket.on("edit_message", (data) => messages.editMessage(socket, io, data));
  socket.on("delete_message", (data) => messages.deleteMessage(socket, io, data));
  socket.on("read-messages", (data) => messages.readMessage(socket, io, data));

  // Chat events
  socket.on("block", (data) => chats.block(socket, io, data));
  socket.on("unblock", (data) => chats.unblock(socket, io, data));
});

// 3. تعديل الـ PORT وتوفير بورت بديل للاختبار المحلي
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});