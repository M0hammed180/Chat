const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "video", "audio"],
      default: "text",
    },

    text: String,

    fileUrl: String,

    fileName: String,

    fileSize: Number,

    edited: {
      type: Boolean,
      default: false,
    },


    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
