const messages = require("../models/messageSchema");
const chats = require("../models/chatSchema");

const sendMessage = async (socket, io, data) => {
  try {
    const senderId =
      typeof data.senderId === "string" ? data.senderId : data.senderId?._id;

    if (!data.chatId || !senderId || !data.text) return;

    const message = await messages.create({
      chatId: data.chatId,
      senderId,
      text: data.text,
    });

    const populatedMessage = await messages
      .findById(message._id)
      .populate("senderId", "name avatar");

    const chat = await chats.findById(data.chatId);
    const receiver = chat?.members?.find(
      (member) => member._id.toString() !== senderId,
    );
    const receiverId = receiver ? receiver._id.toString() : "";

    io.to(data.chatId).emit("recive_message", populatedMessage);

    if (receiverId) {
      io.to(receiverId).emit("update_chat_list", populatedMessage);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
  }
};

const editMessage = async (socket, io, data) => {
  try {
    const { messageId, senderId, text } = data;

    const message = await messages
      .findOneAndUpdate(
        { _id: messageId, senderId },
        { text, edited: true },
        { new: true },
      )
      .populate("senderId", "name avatar");

    if (!message) return;

    io.to(message.chatId.toString()).emit("message_edited", message);
  } catch (error) {
    console.error("Error in editMessage:", error);
  }
};

const deleteMessage = async (socket, io, data) => {
  try {
    const { messageId, senderId } = data;

    const message = await messages.findOneAndDelete({
      _id: messageId,
      senderId,
    });

    if (!message) return;

    io.to(message.chatId.toString()).emit("message_deleted", { messageId });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
  }
};

const readMessage = async (socket, io, data) => {
  try {
    const { chatId, user } = data;

    if (!user._id || !chatId) return;

    await messages.updateMany(
      {
        chatId,
        senderId: { $ne: user._id },
      },
      {
        $addToSet: { seenBy: user._id },
      },
    );

    socket.to(chatId).emit("messages-read", { chatId, user });
  } catch (error) {
    console.error("Error in readMessage:", error);
  }
};

module.exports = { sendMessage, editMessage, deleteMessage, readMessage };
