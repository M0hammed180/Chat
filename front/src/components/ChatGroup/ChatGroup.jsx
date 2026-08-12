import React, { useState, useRef, useEffect } from "react";
import { IoArrowBack } from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../socket";
import axios from "axios";
import {
  fetchChats,
  setChatId,
  setGroupData,
  setLastMessage,
  setMembersRedux,
  setSearch,
} from "../../Redux/chatSlice";
import { dataSDisplay, DateDisplay, TimeDisplay } from "../dateDisplay";
import BackButton from "../Elements/BackButton";
import Loading from "../Elements/Loading";
import api from "../../api";
import { getAvatarSrc } from "../../utils/avatarHelper";

export default function ChatGroup() {
  const dispatch = useDispatch();
  const { userId, userName, avatar } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatG, setChatG] = useState({});
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { chats, search } = useSelector((state) => state.chat);
  const typingTimeout = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [newText, setNewText] = useState("");
  const [menu, setMenu] = useState(null);
  const lastMessageRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  //refresh chat
  useEffect(() => {
    dispatch(fetchChats(userId));
  }, [userId, dispatch]);
  //scroll to last message
  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  //menu
  const handleRightClick = (e, message) => {
    e.preventDefault();

    setMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };
  useEffect(() => {
    const close = () => setMenu(null);

    window.addEventListener("click", close);

    return () => window.removeEventListener("click", close);
  }, []);
  //setChatId
  useEffect(() => {
    dispatch(setChatId(id));
  }, [dispatch, id]);
  //showgroup
  useEffect(() => {
    const fetchChat = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await api.post(`chats/showgroup`, {
          chatId: id,
        });
        dispatch(setChatId(response.data.chat._id));
        setMembers(response.data.members || []);
        dispatch(setMembersRedux(response.data.members || []));
        setMessages(response.data.chatMessages || []);
        setChatG(response.data.chat || {});
        dispatch(setGroupData(response.data.chat || {}));
        setOnlineUsers(
          response.data.members
            .filter((user) => user.state === "online" && user._id !== userId)
            .map((user) => ({
              _id: user._id,
              avatar: user.avatar || "",
            })),
        );
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [userId, id]);
  //join chat and read message
  useEffect(() => {
    if (!id || !userId) return;
    socket.emit("join_chat", id);
    socket.emit("read-messages", {
      chatId: id,
      user: {
        _id: userId,
        avatar,
      },
    });
  }, [id, userId, avatar]);
  //handleMessagesRead
  useEffect(() => {
    const handleMessagesRead = (data) => {
      if (data.chatId !== id || !userId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          const msgSenderId = msg.senderId?._id;

          if (msgSenderId !== userId) {
            return msg;
          }

          const alreadySeen = msg.seenBy?.some(
            (user) => user._id === data.user._id,
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
    };

    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("messages-read", handleMessagesRead);
    };
  }, [id, userId]);
  //send message
  const sendMessage = () => {
    if (!message.trim() || !id || !userId) return;

    const newMessage = {
      text: message,
      senderId: {
        _id: userId,
        avatar: avatar,
        name: userName,
      },
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
  //handleReceive
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
  }, [id, userId]);
  // userofllline && usersOnline
  useEffect(() => {
    const handleOnline = (data) => {
      if (data._id === userId) return;

      const isMemberInGroup = members.some((member) => member._id === data._id);
      if (!isMemberInGroup) return;
      // ---------------------------------------------------

      setOnlineUsers((prev) => {
        if (prev.some((user) => user._id === data._id)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    const handleOffline = (offlineUserId) => {
      setOnlineUsers((prev) =>
        prev.filter((user) => user._id !== offlineUserId),
      );
    };

    if (id) {
      socket.emit("join_chat", id);
    }

    socket.on("usersOnline", handleOnline);
    socket.on("usersOffline", handleOffline);

    return () => {
      socket.off("usersOnline", handleOnline);
      socket.off("usersOffline", handleOffline);
    };
  }, [userId, id, members]);
  //typing
  const socketTyping = () => {
    if (!id || !userId) return;

    socket.emit("typing", {
      chatId: id,
      senderId: userId,
      senderName: userName,
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
  //typing
  useEffect(() => {
    setTyping(typingUsers.length > 0);
  }, [typingUsers.length]);
  //deleteMessage
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
  //deleteMessage
  useEffect(() => {
    const handleDelete = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("message_deleted", handleDelete);

    return () => {
      socket.off("message_deleted", handleDelete);
    };
  }, []);
  //loading
  if (loading && id) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }
  //search
  const messagesMatches = messages.filter((m) => {
    const term = searchTerm.toLowerCase();
    const usernameMatch = m?.text?.toLowerCase().includes(term);
    return usernameMatch;
  });

  return (
    <>
      {" "}
      {id ? (
        <div className="h-screen w-full p-3 sm:p-4 text-slate-900 dark:text-white">
          <div className="h-full flex flex-col gap-3">
            {/* header */}
            <div className="flex items-center justify-between bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-full p-3 transition-colors duration-300">
              <BackButton />
              <div className="flex flex-1 px-5 h-full max-h-full min-h-full items-center gap-2">
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  src={getAvatarSrc(chatG.avatar, true)}
                  alt=""
                />

                <div className="flex flex-1  justify-between items-center  text-sm h-full">
                  <h2 className="font-semibold text-sm ">{chatG.name}</h2>
                  <div className="text-xs ml-3 ">
                    {typing ? (
                      typingUsers.length === 1 ? (
                        `${typingUsers[0].name.split(" ")[0]} is typing...`
                      ) : (
                        `${typingUsers.map((u) => u.name).join(", ")} are typing...`
                      )
                    ) : onlineUsers ? (
                      <div>
                        <div className="flex flex-row-reverse justify-center ml-3">
                          {onlineUsers.map((e) => (
                            <div
                              key={e._id}
                              className="flex relative w-7 h-7 justify-center items-center m-1 mr-2 -ml-4 rounded-full "
                            >
                              <img
                                className="w-7 h-7 rounded-full object-cover mr-2"
                                alt="A"
                                src={getAvatarSrc(e.avatar, false) || ""}
                              />{" "}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>

              <Link
                to={`/GroupSettings/${id}`}
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
                  className="block w-full px-5 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800  bg-gray-50 dark:bg-gray-600"
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
                    typeof m.senderId === "string"
                      ? m.senderId
                      : m.senderId?._id;
                  const senderName =
                    typeof m.senderId === "string"
                      ? "Unknown"
                      : m.senderId?.name.split(" ")[0] || "Unknown";
                  const senderAvatar =
                    typeof m.senderId === "string" ? "" : m.senderId?.avatar;
                  const isOwnMessage = senderId === userId;
                  const otherMembers = members.filter(
                    (member) => member._id !== userId,
                  );
                  const seenCount = otherMembers.filter((member) =>
                    m.seenBy?.some((seenUser) => seenUser._id === member._id),
                  ).length;

                  return (
                    <div
                      key={m._id || `${m.createdAt}-${m.text}`}
                      ref={
                        index === messagesMatches.length - 1
                          ? lastMessageRef
                          : null
                      }
                    >
                      {/* Date */}
                      <div className="w-full text-2xl font- text-center">
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
                        className={`flex items-center w-full ${
                          isOwnMessage
                            ? "justify-start"
                            : "justify-start flex-row-reverse"
                        }`}
                      >
                        {!isOwnMessage && (
                          <Link to={`/profile/${senderId}`}>
                            <img
                              src={getAvatarSrc(senderAvatar, false)}
                              className="w-12 h-12 rounded-full object-cover m-2"
                              alt=""
                            />
                          </Link>
                        )}
                        <div
                          onContextMenu={(e) =>
                            isOwnMessage && handleRightClick(e, m)
                          }
                          className={`${
                            isOwnMessage
                              ? "bg-white/90 text-slate-900 dark:bg-white/10 dark:text-white"
                              : "bg-blue-500 text-white"
                          } px-4 py-2 rounded-2xl max-w-xs flex justify-between items-end`}
                        >
                          <div
                            className={`${
                              isOwnMessage ? "items-start" : "items-end"
                            } flex flex-col`}
                          >
                            <span className="text-xs font-light">
                              {isOwnMessage ? "" : senderName}
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
                              <span>{TimeDisplay(m.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {isOwnMessage && (
                        <span className=" flex pl-3 py-1">
                          {seenCount > 0
                            ? m.seenBy.map((e) => (
                                <img
                                  key={e._id}
                                  src={getAvatarSrc(e.avatar, false)}
                                  alt=""
                                  className="w-3 h-3 rounded-full object-cover -ml-1"
                                />
                              ))
                            : "sent"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* input */}
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
          </div>
        </div>
      ) : (
        <div className="h-screen w-full p-3 sm:p-4">
          <div className="relative h-full bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 overflow-y-auto transition-colors duration-300 flex justify-center items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 absolute top-4 left-4 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/30 text-slate-900 hover:bg-white/40 transition dark:bg-white/20 dark:text-white dark:hover:bg-white/30 "
            >
              <IoArrowBack size={22} />
            </button>
            <p className="text-2xl sm:text-3xl font-bold">No Chat Selected</p>
          </div>
        </div>
      )}
    </>
  );
}
