const chats = require("../models/chatSchema");
const users = require("../models/userSchema");
const messages = require("../models/messageSchema");
const asyncWrapper = require("../middleware/asyncWrapper");

const search = asyncWrapper(async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery) return res.json([]);

  const searchRegex = { $regex: searchQuery, $options: "i" };

  const userSearched = await users
    .find({
      $or: [
        { username: searchRegex },
        { name: searchRegex },
        { phone: searchRegex },
      ],
    })
    .limit(10)
    .select("name username avatar phone state");

  return res.json(userSearched);
});

const userChats = asyncWrapper(async (req, res) => {
  const userId = req.query.q;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  const userChatsList = await chats
    .find({ members: userId })
    .populate("members", "name username avatar state phone email bio");

  const result = await Promise.all(
    userChatsList.map(async (chat) => {
      let otherMember = {};

      if (!chat.isGroup) {
        otherMember =
          chat.members.find((member) => member._id.toString() !== userId) || {};
      }

      const lastMessage = await messages
        .findOne({ chatId: chat._id })
        .populate("senderId", "name")
        .sort({ createdAt: -1 });

      const unReadCount = await messages.countDocuments({
        chatId: chat._id,
        senderId: { $ne: userId },
        seenBy: { $ne: userId },
      });

      return {
        chatId: chat._id,
        isGroup: chat.isGroup,
        _id: chat.isGroup ? chat._id : otherMember._id,
        avatar: chat.isGroup ? chat.avatar : otherMember.avatar,
        name: chat.isGroup ? chat.name : otherMember.name,
        username: otherMember.username,
        phone: otherMember.phone,
        email: otherMember.email,
        bio: otherMember.bio,
        state: otherMember.state,
        unReadMes: unReadCount,
        deleteUserId: chat.deleteUserId || "",
        lastMessage: lastMessage || null,
      };
    }),
  );

  return res.json(result);
});

const makeChat = asyncWrapper(async (req, res) => {
  const { senderId, receiverId } = req.body;

  let chat = await chats.findOne({
    isGroup: false,
    members: { $all: [senderId, receiverId] },
  });

  if (chat) {
    if (chat.deleteUserId?.toString() === senderId.toString()) {
      chat.deleteUserId = null;
      await chat.save();
    }
  }

  if (chat) return res.json(chat);

  chat = await chats.create({
    isGroup: false,
    members: [senderId, receiverId],
  });

  return res.status(201).json(chat);
});

const makeGroup = asyncWrapper(async (req, res) => {
  let { senderId, name, members } = req.body;

  if (!Array.isArray(members)) {
    members = [members];
  }

  if (!members.includes(senderId)) {
    members.push(senderId);
  }

  const chat = await chats.create({
    isGroup: true,
    members,
    admin: senderId,
    name,
    avatar: req.file.path,
  });

  return res.status(201).json(chat);
});

const addUserToGroup = asyncWrapper(async (req, res) => {
  let { members, groupId } = req.body;
  console.log({ members, groupId });
  if (!Array.isArray(members)) {
    members = [members];
  }

  const chat = await chats
    .findOneAndUpdate(
      { _id: groupId, isGroup: true },
      {
        $addToSet: {
          members: { $each: members },
        },
      },
      { new: true },
    )
    .populate("members", "name username avatar state");

  return res.status(201).json(chat);
});

const removeUserFromGroup = asyncWrapper(async (req, res) => {
  let { userId, groupId } = req.body;

  const chat = await chats
    .findOneAndUpdate(
      { _id: groupId, isGroup: true },
      {
        $pull: {
          members: userId,
        },
      },
      { new: true },
    )
    .populate("members", "name username avatar state");

  return res.status(201).json(chat);
});

const exitUserFromGroup = asyncWrapper(async (req, res) => {
  let { userId, chatId } = req.body;

  const chat = await chats.findOneAndUpdate(
    { _id: chatId, isGroup: true },
    {
      $pull: {
        members: userId,
      },
    },
    { new: true },
  );

  return res.status(201).json(chat);
});

const EditGroup = asyncWrapper(async (req, res) => {
  let { groupId, name } = req.body;

  const update = {};
  if (name) {
    update.name = name;
  }
  if (req.file) {
    update.avatar = req.file.path;
  }

  const chat = await chats.findOneAndUpdate(
    { _id: groupId, isGroup: true },
    update,
    { new: true },
  );

  return res.status(201).json(chat);
});

const showChat = asyncWrapper(async (req, res) => {
  const { senderId, chatId } = req.body;

  const chat = await chats.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  const receiverId = chat.members.find(
    (member) => member.toString() !== senderId.toString(),
  );

  const receiverData = receiverId
    ? await users.findById(receiverId).select("-password")
    : null;

  const chatMessages = await messages
    .find({ chatId })
    .sort({ createdAt: 1 })
    .populate("senderId", "name avatar");

  return res.status(200).json({
    success: true,
    block: { blockerId: chat.blockerId, isBlock: chat.isBlock },
    receiverData,
    chatMessages: chatMessages || [],
  });
});

const showGroup = asyncWrapper(async (req, res) => {
  const { chatId } = req.body;

  const chat = await chats
    .findById(chatId)
    .populate("members", "name username avatar state");

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: "Group not found",
    });
  }

  const chatMessages = await messages
    .find({ chatId })
    .sort({ createdAt: 1 })
    .populate("senderId", "name avatar")
    .populate("seenBy", "avatar");

  return res.json({
    success: true,
    chat,
    members: chat.members,
    chatMessages,
  });
});

const deletChat = asyncWrapper(async (req, res) => {
  const { userId, chatId } = req.body;
  console.log(userId, chatId);

  const chat = await chats.findOneAndUpdate(
    {
      _id: chatId,
      isGroup: false,
      members: { $all: [userId] },
    },
    { deleteUserId: userId },
  );

  return res.status(201).json("Sucsses Delete Chat");
});
//socket.io
const block = asyncWrapper(async (socket, io, data) => {
  const { chatId, bloker } = data;

  const updatedChat = await chats.findByIdAndUpdate(
    chatId,
    { blockerId: bloker, isBlock: true },
    { new: true },
  );

  if (!updatedChat) return;

  io.to(updatedChat._id.toString()).emit("recieve_block", {
    blockerId: updatedChat.blockerId,
    isBlock: updatedChat.isBlock,
    _id: updatedChat._id,
  });
});

const unblock = asyncWrapper(async (socket, io, data) => {
  const { chatId } = data;

  const updatedChat = await chats.findByIdAndUpdate(
    chatId,
    { blockerId: null, isBlock: false },
    { new: true },
  );

  if (!updatedChat) return;

  io.to(updatedChat._id.toString()).emit("recieve_block", {
    blockerId: updatedChat.blockerId,
    isBlock: updatedChat.isBlock,
    _id: updatedChat._id,
  });
});

module.exports = {
  search,
  userChats,
  makeChat,
  makeGroup,
  showChat,
  showGroup,
  addUserToGroup,
  removeUserFromGroup,
  exitUserFromGroup,
  EditGroup,
  block,
  unblock,
  deletChat,
};
