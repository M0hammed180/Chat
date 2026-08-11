import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { socket } from "./../socket";
import api from "../../api";
import {
  fetchChats,
  setGroupData,
  setMembersRedux,
  setSearch,
} from "../../Redux/chatSlice";
import { useEffect } from "react";
import BackButton from "../Elements/BackButton";
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
  FiX,
  FiPenTool,
  FiEdit,
} from "react-icons/fi";
import Loading from "../Elements/Loading";
import { getAvatarSrc } from "../../utils/avatarHelper";
export default function GroupSettings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.user);
  const { chatId, search, chats } = useSelector((state) => state.chat);
  const groupDatalocal = JSON.parse(localStorage.getItem("groupDatalocal"));
  const memberslocal = JSON.parse(localStorage.getItem("memberslocal"));
  const chatIdLocal = JSON.parse(localStorage.getItem("chatIdLocal"));
  const [menu, setMenu] = useState(false);
  const [menu2, setMenu2] = useState(false);
  const [name, setName] = useState(groupDatalocal.name);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(groupDatalocal.avatar);

  // =========================
  // Image
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setAvatar(null);
      setPreview(null);
      return;
    }

    setAvatar(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  // =========================
  // Search Users
  // =========================

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    // Search locally first
    const localMatches = chats.filter((chat) => {
      const username = chat?.username?.toLowerCase() || "";
      const chatName = chat?.name?.toLowerCase() || "";
      const phone = chat?.phone?.toString() || "";

      return (
        username.includes(term) ||
        chatName.includes(term) ||
        phone.includes(term)
      );
    });

    if (localMatches.length > 0) {
      setResults(localMatches);
      return;
    }

    // Search DB if no local results
    const delay = setTimeout(async () => {
      try {
        const response = await api.get(
          `/chats/search?q=${encodeURIComponent(searchTerm)}`,
        );
        setResults(response.data);
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // =========================
  // Add / Remove Member
  // =========================

  const addMember = (user) => {
    setMembers((prev) => {
      // Don't add the same user twice
      if (prev.some((member) => member._id === user._id)) {
        return prev;
      }

      return [...prev, user];
    });

    setSearchTerm("");
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((member) => member._id !== id));
  };

  // =========================
  // Add / Remove Member In Server
  // =========================

  const addmembers = async (e) => {
    e.preventDefault();
    if (members.length === 0) {
      return;
    }
    setLoading(true);
    // Add creator + selected members
    const membersIds = members.map((member) => member._id);
    console.log(membersIds, chatId);

    try {
      const response = await api.post("/chats/addusertogroup", {
        members: membersIds,
        groupId: chatIdLocal,
      });
      console.log(response.data);
      dispatch(setMembersRedux(response.data.members || []));
      setMenu(false);
      setMembers([]);
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userDId) => {
    try {
      const response = await api.post("/chats/removeUserFromGroup", {
        userId: userDId,
        groupId: chatIdLocal,
      });
      console.log(response.data);
      dispatch(setMembersRedux(response.data.members || []));
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Edit Group
  // =========================

  const editGroup = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setLoading(true);

    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("groupId", chatIdLocal);

    if (avatar) {
      formData.append("photo", avatar);
    }

    try {
      const response = await api.post("/chats/editgroup", formData);
      console.log(response.data);
      dispatch(setGroupData(response.data || {}));
      setMenu2(false);
    } catch (error) {
      console.error(
        "Error creating group:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };
  // =========================
  // Exit Group
  // =========================

  const exitGroup = async () => {
    setLoading(true);
    try {
      const response = await api.post("/chats/exitUserFromGroup", {
        userId,
        chatId: chatIdLocal,
      });
      console.log(response.data);
      dispatch(fetchChats(userId));
      navigate("/");
    } catch (error) {
      console.error("Error Exit", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };
  // =========================
  // Loading
  // =========================

  if (loading) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }
  return (
    <div
      onClick={() => {
        setMenu(false);
        setMenu2(false);
      }}
      className="h-screen  p-3 sm:p-4 text-slate-900 dark:text-white"
    >
      {menu && (
        <div
          onClick={() => {
            setMenu(false);
            setMenu2(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/80"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 p-4 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold">Add Members</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search and select members to add
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMenu(false)}
                className="rounded-full bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col p-4">
              {/* Search */}
              <input
                type="text"
                id="member"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                name="member"
                className="w-full rounded-2xl border border-slate-300 bg-white/50 p-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-black/20 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />

              {/* Selected Members */}
              {members.length > 0 && (
                <div className="mt-3 max-h-28 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => {
                      if (member.isGroup === true) return null;

                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1.5 dark:bg-slate-800"
                        >
                          <img
                            src={
                              member.avatar ||
                              "https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                            }
                            alt={member.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />

                          <span className="max-w-28 truncate text-sm">
                            {member.name}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeMember(member._id)}
                            className="text-lg font-bold leading-none text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/30 dark:border-white/10 dark:bg-white/5">
                {searchTerm ? (
                  <div className="h-full overflow-y-auto p-2">
                    {results.length > 0 ? (
                      <ul className="space-y-1">
                        {results.map((user) => {
                          if (user.isGroup === true) return null;

                          return (
                            <li
                              key={user._id}
                              onClick={() => addMember(user)}
                              className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-200/70 dark:hover:bg-white/10"
                            >
                              <img
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                                src={getAvatarSrc(user.avatar, false)}
                                alt={user.name}
                              />

                              <p className="truncate text-sm font-medium">
                                {user.name}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No users found
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Search for members
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200/70 p-4 dark:border-white/10">
              <button
                type="button"
                onClick={addmembers}
                disabled={loading || members.length === 0}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {loading ? "Adding..." : "Add Members"}
              </button>
            </div>
          </div>
        </div>
      )}
      {menu2 && (
        <div
          onClick={() => {
            setMenu(false);
            setMenu2(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/80"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/70 p-4 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold">Edit Group</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update group information
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setMenu2(false);
                }}
                className="rounded-full bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={editGroup}
              className="flex flex-col gap-6 overflow-y-auto p-5"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-slate-300 bg-white/30 dark:border-slate-700 dark:bg-black/20">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      No Image
                    </div>
                  )}
                </div>

                <label className="cursor-pointer rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700">
                  Choose Avatar
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Group Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Group Name
                </label>

                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                  className="w-full rounded-2xl border border-slate-300 bg-white/50 p-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-black/20 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Footer */}
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {loading ? "Updating..." : "Edit Group"}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="relative h-full overflow-y-auto bg-white/20 dark:bg-black/20 border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 transition-colors duration-300 backdrop-blur-md">
        <BackButton />
        <div className="flex flex-col items-center border-b border-slate-200/70 dark:border-white/10 pb-6">
          <img
            className="w-24 h-24 rounded-full border-4 border-slate-200/70 dark:border-white/20 object-cover"
            src={getAvatarSrc(groupDatalocal.avatar, true)}
            alt="Profile"
          />

          <h2 className="mt-3 text-2xl font-bold">{groupDatalocal.name}</h2>
        </div>{" "}
        <div className="mt-5 space-y-2">
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
          {groupDatalocal.admin == userId ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(true);
                }}
                className="w-full flex items-center justify-between rounded-2xl bg-blue-600/20 px-3 py-3 text-blue-400 transition hover:bg-blue-600/30"
              >
                <div className="flex items-center gap-3">
                  <FiPlus size={22} />
                  <span>AddMembers</span>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu2(true);
                }}
                className="w-full flex items-center justify-between rounded-2xl bg-blue-600/20 px-3 py-3 text-blue-400 transition hover:bg-blue-600/30"
              >
                <div className="flex items-center gap-3">
                  <FiEdit size={22} />
                  <span>Edit Group</span>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={exitGroup}
              className="w-full flex items-center justify-between rounded-2xl bg-red-600/20 px-3 py-3 text-red-400 transition hover:bg-red-600/30"
            >
              <div className="flex items-center gap-3">
                <FiTrash2 size={22} />
                <span>Exit Group</span>
              </div>
            </button>
          )}
        </div>
        <div className="flex-1 rounded-3xl overflow-hidden bg-white/20 dark:bg-white/10 my-5 max-h-1/2 overflow-y-auto ">
          <div className="h-full overflow-y-auto p-2">
            <ul className="space-y-[3%]">
              {memberslocal.map((e) => (
                <li
                  key={e._id}
                  className="flex justify-between items-center rounded-3xl p-2 hover:bg-slate-200/70 dark:hover:bg-white/10"
                >
                  <Link
                    to={e._id == userId ? "/settings" : `/profile/${e._id}`}
                    className="flex justify-start items-center gap-3 "
                  >
                    {" "}
                    <img
                      className="w-9 h-9 rounded-full object-cover mr-2"
                      src={getAvatarSrc(e?.avatar, false)}
                      alt="Rounded avatar"
                    />
                    <div className="flex flex-col justify-center items-start">
                      {" "}
                      <p>{e.name}</p>
                      {groupDatalocal.admin == e._id && (
                        <p className="text-xs">Admin</p>
                      )}
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        e.state === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />{" "}
                  </Link>
                  <div className="">
                    {groupDatalocal.admin == userId && (
                      <div className="flex justify-end items-center gap-3 ">
                        <button
                          onClick={() => deleteUser(e._id)}
                          className="font-black cursor-pointer p-2 rounded-full bg-red-800/50 hover:bg-red-800 border border-red-950"
                        >
                          <FiX size={22} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
