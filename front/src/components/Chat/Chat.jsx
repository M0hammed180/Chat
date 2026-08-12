import React, { useState, useRef, useEffect } from "react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "./../socket";
import axios from "axios";
import {
  fetchChats,
  setBlock,
  setChatId,
  setLastMessage,
  setSearch,
} from "../../Redux/chatSlice";
import { dataSDisplay, DateDisplay, TimeDisplay } from "../dateDisplay";
import BackButton from "../Elements/BackButton";
import Loading from "../Elements/Loading";
import api from "../../api";
import { getAvatarSrc } from "../../utils/avatarHelper";
export default function Chat() {
  const { id } = useParams();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { userId, userName, avatar, isAuthenticated } = useSelector(
    (state) => state.user,
  );
  const { chats, block, search } = useSelector((state) => state.chat);

  const typingTimeout = useRef(null);
  const lastMessageRef = useRef(null);
  const longPressTimer = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reciveId, setReciveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [receiverData, setReceiverData] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [newText, setNewText] = useState("");
  const [menu, setMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated]);
  //Refresh Chats
  useEffect(() => {
    dispatch(fetchChats(userId));
  }, [userId, dispatch]);
  //scroll
  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  //rightClick
  const handleRightClick = (e, message) => {
    e.preventDefault();

    setMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };
  //longpress
  const handleLongPressStart = (e, msg) => {
    const msgSenderId =
      typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;

    if (msgSenderId !== userId) return;

    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];

      setMenu({
        x: touch.clientX,
        y: touch.clientY,
        message: msg,
      });
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  //menu
  useEffect(() => {
    const close = () => setMenu(null);

    window.addEventListener("click", close);

    return () => window.removeEventListener("click", close);
  }, []);
  //setChatId
  useEffect(() => {
    dispatch(setChatId(id));
  }, [dispatch, id]);
  //showChat
  useEffect(() => {
    const fetchChat = async () => {
      if (!userId || !id) return;

      try {
        setLoading(true);
        const response = await api.post(`/chats/showchat`, {
          senderId: userId,
          chatId: id,
        });
        setReceiverData(response.data.receiverData || {});
        setReciveId(response.data.receiverData?._id || "");
        dispatch(setBlock(response.data.block));
        setMessages(response.data.chatMessages || []);
        socket.emit("read-messages", {
          chatId: id,
          user: {
            _id: userId,
            avatar,
          },
        });
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [userId, id]);
  // join
  useEffect(() => {
    if (!id || !userId) return;

    socket.emit("join_chat", id);
  }, [id, userId]);
  //handel - messageRead
  useEffect(() => {
    const handleMessagesRead = (data) => {
      if (String(data.chatId) !== String(id) || !userId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          const msgSenderId =
            typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;

          if (String(msgSenderId) !== String(userId)) {
            return msg;
          }

          const alreadySeen = msg.seenBy?.some(
            (user) => String(user?._id || user) === String(data.user._id),
          );

          if (alreadySeen) {
            return msg;
          }

          return {
            ...msg,
            seenBy: [...(msg.seenBy || []), data.user],
          };
        }),
      );

      dispatch(fetchChats(userId));
    };

    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("messages-read", handleMessagesRead);
    };
  }, [id, userId, dispatch]);
  //sendMessage
  const sendMessage = () => {
    if (!message.trim() || !id || !userId) return;

    const newMessage = {
      text: message,
      senderId: { _id: userId, name: userName, avatar },
      chatId: id,
      seenBy: [],
    };

    socket.emit("send_message", newMessage);
    socket.emit("stop-typing", {
      chatId: id,
      senderId: userId,
      senderName: userName,
    });
    setMessage("");
  };
  //handel recive
  useEffect(() => {
    const handleReceive = (data) => {
      setMessages((prev) => [...prev, data]);
      socket.emit("read-messages", {
        chatId: id,
        user: {
          _id: userId,
          avatar,
        },
      });
      dispatch(setLastMessage(id, data));
    };

    socket.on("recive_message", handleReceive);

    return () => {
      socket.off("recive_message", handleReceive);
    };
  }, [id, userId, dispatch]);
  //make user online in chat
  useEffect(() => {
    setChat(chats.filter((c) => c.chatId == id));
  }, [chats, id]);
  //typing
  const socketTyping = () => {
    if (!id || !userId) return;

    socket.emit("typing", {
      chatId: id,
      senderId: userId,
      senderName: userName,
      senderAvatar: avatar,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", {
        chatId: id,
        senderId: userId,
        senderName: userName,
      });
    }, 1000);
  };
  //handleTyping
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.chatId !== id || data.senderId === userId) return;

      setTypingUsers((prev) => {
        if (prev.some((item) => item.userId === data.senderId)) return prev;
        return [
          ...prev,
          {
            userId: data.senderId,
            name: data.senderName || "Someone",
          },
        ];
      });
    };

    const handleStopTyping = (data) => {
      if (data.chatId !== id) return;
      setTypingUsers((prev) =>
        prev.filter((item) => item.userId !== data.senderId),
      );
    };

    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [id, userId]);
  //handleEdit
  useEffect(() => {
    const handleEdit = (message) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m)),
      );
    };

    socket.on("message_edited", handleEdit);

    return () => {
      socket.off("message_edited", handleEdit);
    };
  }, []);
  //handleDelete
  useEffect(() => {
    const handleDelete = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("message_deleted", handleDelete);

    return () => {
      socket.off("message_deleted", handleDelete);
    };
  }, []);
  //reciveBlock
  useEffect(() => {
    const handleBlock = (d) => dispatch(setBlock(d));
    socket.on("recieve_block", handleBlock);

    return () => {
      socket.off("recieve_block", handleBlock);
    };
  }, [dispatch]);
  //SearchMessage
  const messagesMatches = messages.filter((m) => {
    const term = searchTerm.toLowerCase();
    const usernameMatch = m?.text?.toLowerCase().includes(term);
    return usernameMatch;
  });
  //loading
  if (loading) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }
  //noChatSelected
  if (!id) {
    return (
      <div className="h-screen w-full p-3 sm:p-4">
        <div className="relative h-full bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 overflow-y-auto transition-colors duration-300 flex justify-center items-center">
          <div className="absolute top-4 left-4">
            <BackButton />
          </div>

          <p className="text-2xl sm:text-3xl font-bold">No Chat Selected</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-full p-3 sm:p-4 text-slate-900 dark:text-white">
        <div className="h-full flex flex-col gap-3">
          {/* header */}
          <div className="flex items-center justify-between bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-full p-3 transition-colors duration-300">
            <BackButton />

            <div className="flex flex-col items-center gap-2">
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={getAvatarSrc(receiverData.avatar, false)}
                alt=""
              />

              <div className="flex items-center gap-2 text-sm">
                <h2 className="font-semibold text-sm">{receiverData.name}</h2>
                <span>|</span>
                <p
                  className={`text-xs ${chat[0]?.state === "online" ? `text-green-400` : `text-red-400`} `}
                >
                  {typing
                    ? "Typing"
                    : chat[0]?.state === "online"
                      ? "Online"
                      : "Offline"}
                </p>
              </div>
            </div>

            <Link
              to={`/profile/${reciveId}`}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 text-slate-900 hover:bg-white/40 transition dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
            >
              <HiOutlineDotsVertical size={22} />
            </Link>
          </div>
          {/* search */}
          {search && (
            <div className="flex items-center gap-2 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-2 transition-colors duration-300 h-13 md:h-15">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500 dark:text-white dark:placeholder:text-gray-300 px-2 "
              />

              <button
                onClick={() => {
                  dispatch(setSearch(false));
                  setSearchTerm("");
                }}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm text-white transition"
              >
                Close
              </button>
            </div>
          )}
          {/* menu */}
          {menu && (
            <div
              className="fixed z-50 bg-white dark:bg-black rounded-2xl shadow p-1 md:p-2 border border-gray-700 flex flex-col gap-1"
              style={{
                left: menu.x,
                top: menu.y,
              }}
            >
              <button
                className="block w-full px-5 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-600"
                onClick={() => {
                  setEditingMessageId(menu.message._id);
                  setNewText(menu.message.text);
                  setMenu(null);
                }}
              >
                Edit
              </button>

              <button
                className="block w-full px-5 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-600"
                onClick={() => {
                  socket.emit("delete_message", {
                    messageId: menu.message._id,
                    senderId: userId,
                  });

                  setMenu(null);
                }}
              >
                Delete
              </button>
            </div>
          )}
          {/* messages */}
          <div className="flex-1 overflow-y-auto bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-3 transition-colors duration-300">
            <div className="space-y-3 md:text-base">
              {messagesMatches.map((m, index) => {
                const senderId =
                  typeof m.senderId === "string" ? m.senderId : m.senderId?._id;
                const senderName =
                  typeof m.senderId === "string"
                    ? "Unknown"
                    : m.senderId?.name || "Unknown";
                const isOwnMessage = senderId === userId;
                const isSeen = m.seenBy?.some(
                  (seenUser) => seenUser._id === reciveId,
                );
                const edit = () => {
                  socket.emit("edit_message", {
                    messageId: m._id,
                    senderId: userId,
                    text: newText,
                  });
                  setNewText("");
                };

                return (
                  <div
                    key={m._id || `${m.createdAt}-${m.text}`}
                    ref={
                      index === messagesMatches.length - 1
                        ? lastMessageRef
                        : null
                    }
                  >
                    <div className="w-full text-2xl py-2 text-center">
                      {index > 0
                        ? Number(
                            DateDisplay(messagesMatches[index - 1].createdAt),
                          ) !== Number(DateDisplay(m.createdAt)) &&
                          (new Date(m.createdAt).toDateString() ===
                          new Date().toDateString()
                            ? "Today"
                            : dataSDisplay(m.createdAt))
                        : new Date(m.createdAt).toDateString() ===
                            new Date().toDateString()
                          ? ""
                          : dataSDisplay(m.createdAt)}
                    </div>
                    <div
                      className={`flex ${isOwnMessage ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        onContextMenu={(e) =>
                          isOwnMessage && handleRightClick(e, m)
                        }
                        onTouchStart={(e) => {
                          if (isOwnMessage) {
                            handleLongPressStart(e, m);
                          }
                        }}
                        onTouchEnd={handleLongPressEnd}
                        onTouchMove={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        className={`${isOwnMessage ? "bg-white/90 text-slate-900 px-3 py-2 rounded-2xl max-w-[80%] dark:bg-white/10 dark:text-white" : "bg-blue-500 px-3 py-2 rounded-2xl max-w-[80%] text-white"} flex justify-between items-end`}
                      >
                        {isOwnMessage ? (
                          isSeen ? (
                            <span className="text-xs font-light pr-2">✓✓</span>
                          ) : (
                            <span className="text-xs font-light pr-2">✓</span>
                          )
                        ) : (
                          ""
                        )}

                        <div className="flex flex-col">
                          <span className="text-xs">
                            {m.edited && "    Edited"}
                          </span>
                          <span>
                            {editingMessageId === m._id ? (
                              <input
                                autoFocus
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    socket.emit("edit_message", {
                                      messageId: m._id,
                                      senderId: userId,
                                      text: newText,
                                    });

                                    setEditingMessageId(null);
                                  }
                                }}
                              />
                            ) : (
                              m.text
                            )}
                          </span>
                          <span className="text-xs font-light">
                            {TimeDisplay(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* input */}
          {!block.isBlock && (
            <div className="flex items-center gap-2 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-2 transition-colors duration-300">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socketTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500 dark:text-white dark:placeholder:text-gray-300 px-2"
              />

              <button
                onClick={sendMessage}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-sm text-white transition"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
