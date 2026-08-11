import React from "react";
import { useEffect } from "react";
import {
  FiSearch,
  FiImage,
  FiBellOff,
  FiSlash,
  FiFlag,
  FiTrash2,
  FiMail,
  FiPhone,
  FiPlus,
  FiArrowUpRight,
} from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "./../socket";
import {
  fetchChats,
  setBlock,
  setChatId,
  setSearch,
} from "../../Redux/chatSlice";
import BackButton from "../Elements/BackButton";
import api from "../../api";
import Loading from "../Elements/Loading";
import { useState } from "react";
import { getAvatarSrc } from "../../utils/avatarHelper";

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [haveChat, setHaveChat] = useState(false);
  const [chatId, setChatId] = useState("");

  const { isAuthenticated, userId } = useSelector((state) => state.user);
  const { reciveId, block } = useSelector((state) => state.chat);

  useEffect(() => {}, []);
  //isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated]);
  //makeBlock
  const blocked = () => {
    socket.emit("block", { chatId, bloker: userId });
  };
  const unblock = () => {
    socket.emit("unblock", { chatId });
  };
  //block
  useEffect(() => {
    const handleBlock = (d) => {
      dispatch(setBlock(d));
    };

    socket.on("recieve_block", handleBlock);

    return () => {
      socket.off("recieve_block", handleBlock);
    };
  }, [dispatch]);
  //delete
  const deleteChat = async () => {
    try {
      const response = await api.delete(`/chats/delete`, {
        data: { userId, chatId },
      });
      dispatch(fetchChats(userId));
      navigate("/");
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  //showUser
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      if (!userId || !id) return;
      try {
        const response = await api.post(`/user/showuser`, {
          userId,
          receiverId: id,
        });
        setUserData(response.data.userData || {});
        setHaveChat(response.data.haveChat || false);
        setChatId(response.data.chatId);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, id]);
  //loading
  if (loading) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }
  return (
    <div className="h-screen w-full p-3 sm:p-4 text-slate-900 dark:text-white">
      <div className="relative h-full overflow-y-auto bg-white/20 dark:bg-black/20 border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 transition-colors duration-300 backdrop-blur-md">
        <BackButton />
        <div className="flex flex-col items-center border-b border-slate-200/70 dark:border-white/10 pb-6">
          <img
            className="w-24 h-24 rounded-full border-4 border-slate-200/70 dark:border-white/20 object-cover"
            src={getAvatarSrc(userData.avatar, false)}
            alt="Profile"
          />
          <div className="flex justify-center items-center gap-3 mt-4">
            <h2 className=" text-2xl font-bold">{userData.name}</h2>

            <p
              className={`${userData.state == "online" ? "text-green-400" : "text-red-400"} `}
            >
              ●
            </p>
          </div>
          <div className="mt-2">@{userData.username}</div>
          <div className="mt-4 w-full max-w-md space-y-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white/20 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <FiMail size={20} />
              <span>{userData.email}</span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/20 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <FiPhone size={18} />
              <span>{userData.phone}</span>
            </div>

            <div className="rounded-2xl bg-white/20 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <p className="text-slate-500 text-sm mb-2 dark:text-slate-300">
                Bio
              </p>
              <p>{userData.bio}</p>
            </div>
          </div>
        </div>
        {haveChat ? (
          <div className="mt-5 space-y-2">
            <button
              onClick={() => {
                navigate(`/chat/${chatId}`);
              }}
              className="w-full flex items-center justify-between rounded-2xl bg-green-600/20 px-3 py-3 text-green-400 transition hover:bg-green-600/30"
            >
              <div className="flex items-center gap-3">
                <FiArrowUpRight size={22} />
                <span>Open Chat</span>
              </div>
            </button>

            <button
              onClick={() => {
                navigate(-1);
                dispatch(setSearch(true));
              }}
              className="w-full flex items-center justify-between rounded-2xl bg-white/20 px-3 py-3 text-slate-900 shadow-sm transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <div className="flex items-center gap-3">
                <FiSearch size={22} />
                <span>Search in Chat</span>
              </div>
            </button>

            {block.isBlock ? (
              block.blockerId == userId ? (
                <button
                  onClick={unblock}
                  className="w-full flex items-center justify-between rounded-2xl bg-red-500/20 px-3 py-3 text-red-300 transition hover:bg-red-500/30"
                >
                  <div className="flex items-center gap-3">
                    <FiSlash size={22} />
                    <span>Unblock User</span>
                  </div>
                </button>
              ) : (
                ""
              )
            ) : (
              <button
                onClick={blocked}
                className="w-full flex items-center justify-between rounded-2xl bg-red-500/20 px-4 py-4 text-red-300 transition hover:bg-red-500/30"
              >
                <div className="flex items-center gap-3">
                  <FiSlash size={22} />
                  <span>Block User</span>
                </div>
              </button>
            )}

            <button
              onClick={deleteChat}
              className="w-full flex items-center justify-between rounded-2xl bg-red-600/20 px-3 py-3 text-red-400 transition hover:bg-red-600/30"
            >
              <div className="flex items-center gap-3">
                <FiTrash2 size={22} />
                <span>Delete Chat</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <button
              onClick={deleteChat}
              className="w-full flex items-center justify-between rounded-2xl bg-green-600/20 px-3 py-3 text-green-400 transition hover:bg-green-600/30"
            >
              <div className="flex items-center gap-3">
                <FiPlus size={22} />
                <span>Make Chat</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
