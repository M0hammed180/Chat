import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../Redux/userSlice";
import { socket } from "./../socket";
import {
  fetchChats,
  setChats,
  setLastMessage,
  setSelectedChat,
  setUnReadMessages,
  setUserState,
} from "../../Redux/chatSlice";
import { dataSDisplay, DateDisplay, TimeDisplay } from "../DateDisplay";
import Loading from "../Elements/Loading";
import api from "../../api";
import { getAvatarSrc } from "../../utils/avatarHelper";
export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userName, avatar, userId } = useSelector((state) => state.user);
  const user = useSelector((state) => state.user);
  const { chatsLoading, chatsError } = useSelector((state) => state.chat);
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const { chats } = useSelector((state) => state.chat);
  const [loading, setLoading] = useState(true);
  const [fromLocal, setFromLocal] = useState(true);
  const { chatId } = useSelector((state) => state.chat);
  //update_Chat_List
  useEffect(() => {
    socket.on("update_chat_list", (data) => {
      dispatch(setLastMessage({ id: data.chatId, data }));
      dispatch(setUnReadMessages({ id: data.chatId }));
    });
    return () => {
      socket.on("update_chat_list", (data) => {
        dispatch(setLastMessage({ id: data.chatId, data }));
        dispatch(setUnReadMessages({ id: data.chatId }));
      });
    };
  }, []);
  //makeOnline
  useEffect(() => {
    if (!userId) return;

    const handleConnect = () => {
      socket.emit("add-user", userId);
    };
    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [userId]);
  //showOnline
  useEffect(() => {
    const handleUserOnline = (onlineUserId) => {
      dispatch(
        setUserState({
          userId: onlineUserId,
          state: "online",
        }),
      );
    };

    const handleUserOffline = (offlineUserId) => {
      dispatch(
        setUserState({
          userId: offlineUserId,
          state: "offline",
        }),
      );
    };

    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);

    return () => {
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
    };
  }, [dispatch]);
  //showChats
  useEffect(() => {
    if (userId) {
      dispatch(fetchChats(userId));
    }
  }, [userId, dispatch]);
  //search
  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    const localMatches = chats.filter((chat) => {
      const term = searchTerm.toLowerCase();

      const usernameMatch = chat?.username?.toLowerCase().includes(term);
      const nameMatch = chat?.name?.toLowerCase().includes(term);
      const phoneMatch = chat?.phone?.toString().includes(term);

      return usernameMatch || nameMatch || phoneMatch;
    });
    if (localMatches.length > 0) {
      console.log(localMatches);
      setResults(localMatches);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`chats/search?q=${searchTerm}`);
        setFromLocal(false);
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching users from DB:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  //openChat
  const openChat = async (user) => {
    if (user.isGroup === true) {
      navigate(`/chatgroup/${user.chatId}`);
      setSearchTerm("");
      return;
    }

    const receiverId = user._id;

    const existingChat = chats.find((chat) => {
      const chatUserId = chat._id;

      return chatUserId?.toString() === receiverId?.toString();
    });

    if (existingChat?.chatId && existingChat?.deleteUserId == "") {
      navigate(`/chat/${existingChat.chatId}`);
      setSearchTerm("");
      return;
    }

    try {
      const response = await api.post("chats/", {
        senderId: userId,
        receiverId,
      });
      dispatch(fetchChats(userId));
      navigate(`/chat/${response.data._id}`);
      setSearchTerm("");
    } catch (error) {
      console.log(error);
    }
  };
  //logout
  const logOut = () => {
    socket.disconnect();
    setTimeout(() => {
      dispatch(logout());
      navigate("/login");
    }, 100);
  };
  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className="flex fixed inset-0 z-50 h-screen w-full md:fixed md:left-0 md:top-0 md:h-screen md:w-[30%] flex-col justify-center items-center text-slate-900 dark:text-white rounded-3xl"
      >
        <div className="flex flex-col bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md w-full h-full md:w-[95%] md:h-[97%] rounded-none md:rounded-4xl p-3 sm:p-4 border-0 md:border-2 border-slate-200/70 dark:border-white/10 space-y-3">
          {/* header */}
          <div className="flex justify-between items-center bg-white/20 text-slate-900 dark:bg-white/20 dark:text-white p-2 rounded-3xl">
            <img
              className="w-9 h-9 rounded-full object-cover"
              src={getAvatarSrc(avatar, false)}
              alt="Rounded avatar"
            />

            <p>{userName}</p>

            <div className="relative">
              {/* Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(!open);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/30 text-slate-900 hover:bg-white/40 transition dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
              >
                <IoSettingsOutline />
              </button>

              {/* Overlay */}
              {open && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  onClick={() => setOpen(false)}
                >
                  {/* Popup */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col bg-white text-slate-900 dark:bg-black dark:text-white  w-[90%] max-w-sm rounded-4xl p-6 border-2 border-slate-200/70 dark:border-white/10 space-y-4 shadow-2xl"
                  >
                    <h2 className="text-xl font-bold">Menu</h2>

                    <Link
                      to="/addGroup"
                      onClick={(e) => setOpen(false)}
                      className="text-left px-4 py-3 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition"
                    >
                      Make Group
                    </Link>

                    <Link
                      to="/settings"
                      onClick={(e) => setOpen(false)}
                      className="text-left px-4 py-3 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition"
                    >
                      Settings
                    </Link>

                    <button
                      onClick={(e) => {
                        logOut();
                        setOpen(false);
                      }}
                      className="text-left px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-500 transition"
                    >
                      Logout
                    </button>

                    <button
                      onClick={() => setOpen(false)}
                      className="mt-2 py-3 rounded-xl bg-white/20 dark:bg-white/10 hover:bg-white/30 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* search */}
          <input
            className="w-full rounded-3xl bg-white/20 text-slate-900 outline-none p-3 text-sm placeholder:text-slate-500 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* chats */}
          <div className="flex-1 rounded-3xl overflow-hidden bg-white/20 dark:bg-white/10">
            <div className="h-full overflow-y-auto p-2">
              {loading && chatsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loading className="h-full w-full p-0 bg-transparent border-0" />
                </div>
              ) : searchTerm ? (
                <ul className="space-y-[3%]">
                  {results.map((e) => (
                    <li
                      key={e._id}
                      onClick={() => openChat(e)}
                      className="flex justify-start items-center gap-3 rounded-3xl p-2 hover:bg-slate-200/70 dark:hover:bg-white/10"
                    >
                      <img
                        className="w-9 h-9 rounded-full object-cover mr-2"
                        src={getAvatarSrc(e.avatar, e.isGroup)}
                        alt="Rounded avatar"
                      />

                      <p>{e.name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-[3%]">
                  {chats?.map((e) => {
                    if (e.deleteUserId === userId) {
                      return;
                    }
                    return (
                      <li
                        key={e.chatId}
                        onClick={() =>
                          e.isGroup
                            ? navigate(`/chatgroup/${e.chatId}`)
                            : navigate(`/chat/${e.chatId}`)
                        }
                        className={`p-2 hover:bg-black/10 dark:hover:bg-white/10 ${chatId == e.chatId && `dark:md:bg-black/50 md:bg-white/50`} rounded-3xl`}
                      >
                        <div className={`flex flex-col  `}>
                          <div className="flex justify-between items-center">
                            <span className="flex justify-start items-center gap-3">
                              <img
                                className="w-9 h-9 rounded-full object-cover"
                                src={getAvatarSrc(e.avatar, e.isGroup)}
                                alt="Rounded avatar"
                              />

                              <p>{e?.name.split(" ")[0]}</p>
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  e.state === "online"
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                            </span>
                            {/* lastMessage */}
                            {e.lastMessage &&
                              e?.lastMessage?.senderId._id !== userId &&
                              e?.unReadMes > 0 && (
                                <span className="bg-blue-600/40 px-1.5 py-0.5 text-[10px] rounded-full text-black dark:text-white">
                                  {e?.unReadMes}
                                </span>
                              )}
                          </div>
                          <div className="flex w-full justify-between px-1 text-[11px] text-gray-600 dark:text-gray-400 font-bold mt-1">
                            <span className="pr-2 flex-1 truncate flex gap-0.5">
                              {e.lastMessage &&
                                e?.lastMessage.senderId._id === userId &&
                                (e?.isGroup ? (
                                  <span>
                                    {e?.lastMessage.seenBy.length > 0
                                      ? e?.lastMessage.seenBy.length + " ✓✓ "
                                      : " ✓"}
                                  </span>
                                ) : (
                                  <span>
                                    {e?.lastMessage.seenBy.length > 0
                                      ? " ✓✓"
                                      : " ✓"}
                                  </span>
                                ))}
                              {e?.isGroup && (
                                <span>
                                  {e.lastMessage &&
                                  e?.isGroup &&
                                  e?.lastMessage.senderId._id === userId
                                    ? "Me"
                                    : e?.lastMessage.senderId.name.split(
                                        " ",
                                      )[0]}
                                  :{" "}
                                </span>
                              )}
                              <span>
                                {e.lastMessage && e?.lastMessage.text}
                              </span>
                            </span>
                            <span>
                              {e.lastMessage &&
                                (new Date(
                                  e?.lastMessage.createdAt,
                                ).toDateString() === new Date().toDateString()
                                  ? TimeDisplay(e?.lastMessage.createdAt)
                                  : dataSDisplay(e?.lastMessage.createdAt))}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
