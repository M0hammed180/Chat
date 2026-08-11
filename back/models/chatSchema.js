const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },

    name: String,

    avatar: String,

    deleteUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    state: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isBlock: {
      type: Boolean,
      default: false,
    },

    blockerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
