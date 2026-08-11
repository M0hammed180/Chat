const onlineUsers = new Map();
const users = require("../models/userSchema");
const chats = require("../models/chatSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const asyncWrapper = require("../middleware/asyncWrapper");

// --- Express HTTP Handlers ---

const register = asyncWrapper(async (req, res) => {
  const { name, username, phone, email, password, bio } = req.body;

  // let pathPhoto = "";
  // if (req.files && req.files["photo"]) {
  //   pathPhoto = req.files["photo"][0].path.replace(/\\/g, "/");
  // }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await users.create({
    name,
    username,
    phone,
    email,
    password: hashedPassword,
    bio,
    avatar: req.file.path,
  });

  return res.status(201).json({
    success: true,
    message: "User created successfully",
    user: newUser,
  });
});

const edit = asyncWrapper(async (req, res) => {
  const { _id, name, username, phone, email, password, bio } = req.body;
  const filter = { _id };
  const update = {
    name,
    username,
    phone,
    email,
    bio,
  };
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    update.password = hashedPassword;
  }
  if (req.file) {
    update.avatar = req.file.path;
  }

  const editedUser = await users.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: "User edited successfully",
    user: editedUser,
  });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  const user = await users.findOne({
    $or: [{ email: email }, { phone: email }, { username: email }],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User does not exist",
    });
  }
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    return res.status(400).json({
      success: false,
      error: "Wrong password",
    });
  }
  const token = await jwt.sign(
    {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" },
  );
  return res.status(200).json({
    success: true,
    message: "Login successful",
    userData: user,
    token,
  });
});

const showUser = asyncWrapper(async (req, res) => {
  const { userId, receiverId } = req.body;

  const chat = await chats.findOne({
    isGroup: false,
    members: { $all: [userId, receiverId] },
  });

  let haveChat = false;
  if (chat) {
    haveChat = true;
  }

  const user = await users.findById(receiverId, "-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User does not exist",
    });
  }

  return res.status(200).json({
    success: true,
    userData: user,
    haveChat,
    chatId: chat?._id || "",
  });
});

// --- Socket Handlers ---

const joinChat = (socket, chatId) => {
  socket.join(chatId);
};

const connected = async (socket, io, userId) => {
  if (!userId) return;
  socket.userId = userId;
  socket.join(userId);
  onlineUsers.set(userId, socket.id);

  await users.findByIdAndUpdate(userId, { state: "online" });
  const user = await users.findOne({ _id: userId }, { _id: 1, avatar: 1 });
  const chatsList = await chats.find(
    { members: userId, isGroup: true },
    { _id: 1 },
  );

  chatsList.forEach((chat) => {
    socket.to(chat._id.toString()).emit("usersOnline", user);
  });
  console.log(
    "USER:",
    userId,
    "GROUPS:",
    chatsList.map((chat) => chat._id.toString()),
  );
  io.emit("user-online", userId);
};

const disconnect = async (socket, io) => {
  const userId = socket.userId;
  if (!userId) return;

  onlineUsers.delete(userId);

  await users.findByIdAndUpdate(userId, { state: "offline" });
  const user = await users.findOne({ _id: userId }, { _id: 1 });
  const chatsList = await chats.find(
    { members: userId, isGroup: true },
    { _id: 1 },
  );

  chatsList.forEach((chat) => {
    socket.to(chat._id.toString()).emit("usersOffline", user._id);
  });
  io.emit("user-offline", userId);
};

const leaveChat = (socket, chatId) => {
  if (!chatId) return;

  socket.leave(chatId);
};

const typing = (socket, data) => {
  if (!data?.chatId) return;
  socket.to(data.chatId).emit("typing", data);
};

const stopTyping = (socket, data) => {
  if (!data?.chatId) return;
  socket.to(data.chatId).emit("stop-typing", data);
};

module.exports = {
  register,
  edit,
  login,
  showUser,
  joinChat,
  connected,
  disconnect,
  typing,
  stopTyping,
  leaveChat,
};
