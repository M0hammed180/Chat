import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../Elements/Loading";
import api from "../../api";
import { getAvatarSrc } from "../../utils/avatarHelper";
import { fetchChats } from "../../Redux/chatSlice";

export default function AddGroup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userId } = useSelector((state) => state.user);
  const { chats } = useSelector((state) => state.chat);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const [members, setMembers] = useState([]);

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);

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
  }, [searchTerm, chats]);

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
  // Create Group
  // =========================

  const addGroup = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (members.length === 0) {
      return;
    }

    setLoading(true);

    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("senderId", userId);

    // Add creator + selected members
    const membersIds = [userId, ...members.map((member) => member._id)];

    membersIds.forEach((id) => {
      formData.append("members", id);
    });

    if (avatar) {
      formData.append("photo", avatar);
    }

    try {
      const response = await api.post("/chats/addgroup", formData);
      dispatch(fetchChats(userId));

      navigate(`/chatgroup/${response.data._id}`);
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
  // Loading
  // =========================

  if (loading) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="flex justify-center items-center w-full h-full p-3 sm:p-4">
      <div className="flex justify-around items-center w-full overflow-y-auto flex-1 h-11/12 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 transition-colors duration-300">
        {/* Back Button */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 absolute top-4 left-4 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/30 text-slate-900 hover:bg-white/40 transition dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
        >
          <IoArrowBack size={22} />
        </button>

        {/* Form */}

        <div className="lg:w-1/2 flex items-center justify-center h-full w-full">
          <div className="max-w-md w-full p-4">
            <h1 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white text-center">
              Make Group
            </h1>

            <form onSubmit={addGroup} className="space-y-4">
              {/* Group Avatar */}

              <div className="flex flex-col items-center gap-3">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gray-300 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white">
                      No Image
                    </div>
                  )}
                </div>

                <label className="cursor-pointer rounded-lg px-3 py-1.5 text-sm transition">
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
                <label htmlFor="name" className="block text-sm font-medium">
                  Name
                </label>

                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                  className="mt-1 p-2 w-full border rounded-md text-sm focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
                />
              </div>

              {/* Search Members */}

              <div>
                <label htmlFor="member" className="block text-sm font-medium">
                  Members
                </label>

                <input
                  type="text"
                  id="member"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  name="member"
                  className="mt-1 p-2 w-full border rounded-md text-sm focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
                />

                {/* Selected Members */}

                {members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1"
                      >
                        <img
                          src={
                            member.avatar
                              ? `${member.avatar}`
                              : "https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                          }
                          alt={member.name}
                          className="w-6 h-6 rounded-full"
                        />

                        <span>{member.name}</span>

                        <button
                          type="button"
                          onClick={() => removeMember(member._id)}
                          className="text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white p-2 rounded-md text-sm hover:bg-gray-800 focus:outline-none focus:bg-black focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-300 dark:hover:bg-slate-800 dark:focus:ring-white disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Make Group"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Search Results */}

        <div className="flex-1 rounded-4xl overflow-hidden bg-white/20 dark:bg-white/10">
          {searchTerm && (
            <div className="h-full overflow-y-auto p-[2%]">
              {results.length > 0 ? (
                <ul className="space-y-[3%]">
                  {results.map((user) => (
                    <li
                      key={user._id}
                      onClick={() => addMember(user)}
                      className="flex justify-start items-center gap-3 rounded-4xl p-[3%] hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer"
                    >
                      {user.avatar ? (
                        <img
                          className="w-10 h-10 rounded-full object-cover mr-[5%]"
                          src={`${user.avatar}`}
                          alt={user.name}
                        />
                      ) : (
                        <img
                          className="w-10 h-10 rounded-full mr-[5%]"
                          src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                          alt={user.name}
                        />
                      )}

                      <p>{user.name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">
                  No users found
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
