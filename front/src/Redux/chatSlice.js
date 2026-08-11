import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../api";

export const fetchChats = createAsyncThunk(
  "chat/fetchChats",

  async (userId) => {
    const response = await api.get(`/chats/?q=${userId}`);

    return response.data;
  },
);

const initialState = {
  chats: [],
  chatId: "",
  selectedChat: null,
  messages: [],
  block: {},
  reciveId: "",
  //chat
  reciveData: {},
  //groupChat
  members: [],
  groupData: {},
  search: false,

  chatsLoading: false,
  chatsError: null,
};

const chatSlice = createSlice({
  name: "chat",

  initialState,

  reducers: {
    setChats(state, action) {
      state.chats = action.payload;
    },

    setBlock(state, action) {
      state.block = action.payload;
    },

    setChatId(state, action) {
      localStorage.removeItem("chatIdLocal");
      state.chatId = action.payload;
      localStorage.setItem("chatIdLocal", JSON.stringify(action.payload));
    },

    setSelectedChat(state, action) {
      state.selectedChat = action.payload;
    },

    setMessages(state, action) {
      state.messages = action.payload;
    },

    setMembersRedux(state, action) {
      localStorage.removeItem("memberslocal");
      state.members = action.payload;
      localStorage.setItem("memberslocal", JSON.stringify(action.payload));
    },

    setGroupData(state, action) {
      localStorage.removeItem("groupDatalocal");
      state.groupData = action.payload;
      localStorage.setItem("groupDatalocal", JSON.stringify(action.payload));
    },

    addMessage(state, action) {
      state.messages.push(action.payload);
    },

    setUserState(state, action) {
      state.chats = state.chats.map((chat) => {
        if (chat._id === action.payload.userId) {
          chat.state = action.payload.state;
        }

        return chat;
      });
    },

    setLastMessage(state, action) {
      state.chats = state.chats.map((chat) => {
        if (chat.chatId === action.payload.id) {
          chat.lastMessage = action.payload.data;
        }
        return chat;
      });
    },

    setUnReadMessages(state, action) {
      state.chats = state.chats.map((chat) => {
        if (chat.chatId === action.payload.id) {
          chat.unReadMes += 1;
        }
        return chat;
      });
    },

    setSearch(state, action) {
      state.search = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchChats.pending, (state) => {
        state.chatsLoading = true;
        state.chatsError = null;
      })

      .addCase(fetchChats.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chats = action.payload;
      })

      .addCase(fetchChats.rejected, (state, action) => {
        state.chatsLoading = false;
        state.chatsError = action.error.message;
      });
  },
});

export const {
  setChats,
  setSelectedChat,
  setMessages,
  addMessage,
  setChatId,
  setBlock,
  setUserState,
  setSearch,
  setGroupData,
  setMembersRedux,
  setLastMessage,
  setUnReadMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
