import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import BackButton from "../Elements/BackButton";
import Loading from "../Elements/Loading";
import api from "../../api";
import { setUserData } from "../../Redux/userSlice";
import { getAvatarSrc } from "../../utils/avatarHelper";

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const [name, setName] = useState(user.userName);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState(user.bio);
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(`${user.avatar}`);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (e.target.files && e.target.files.length > 0) {
      setAvatar(file);
    } else {
      setAvatar(null);
    }

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("_id", user.userId);
    formData.append("name", name);
    formData.append("username", username);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("bio", bio);
    if (avatar) {
      formData.append("photo", avatar);
    }

    try {
      const response = await api.patch("/user/edit", formData);

      let state = {
        _id: response.data.user._id,
        name: response.data.user.name,
        username: response.data.user.username,
        email: response.data.user.email,
        phone: response.data.user.phone,
        bio: response.data.user.bio,
        avatar: response.data.user.avatar,
        isAuthenticated: true,
      };
      dispatch(setUserData(state));
      navigate(-1);
    } catch (error) {
      if (error.response) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("MESSAGE:", error.message);
      } else {
        console.error("Network Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading className="h-full w-full p-0 bg-transparent border-0" />;
  }

  return (
    <div className="h-dvh w-full p-3 sm:p-4 text-slate-900 dark:text-white ">
      <div className="relative h-full overflow-y-auto bg-white/20 dark:bg-black/20 border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 transition-colors duration-300 backdrop-blur-md flex justify-center">
        <div className="fixed top-2 left-2">
          {" "}
          <BackButton />
        </div>

        <div className="max-w-md w-full p-6">
          <h1 className="text-3xl font-semibold mb-6 text-slate-900 dark:text-white text-center">
            Edit Profile
          </h1>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Your form elements go here */}
            <div className="flex flex-col items-center gap-4">
              {/* Avatar Preview */}
              <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100">

              {/* File Input */}
              <label htmlFor="avatar" className="cursor-pointer">
                <img
                  src={getAvatarSrc(preview)}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                />
              </label>
              </div>


              <input
                id="avatar"
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                name="name"
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                name="username"
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Phone
              </label>
              <input
                type="text"
                id="name"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                name="phone"
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                value={email}
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Bio
              </label>
              <input
                type="text"
                id="bio"
                onChange={(e) => setBio(e.target.value)}
                name="bio"
                value={bio}
                className="mt-1 p-2 w-full border rounded-md bg-white text-slate-900 focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:ring-slate-600"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-black/50 text-white p-2 rounded-md text-sm hover:bg-gray-800 focus:outline-none focus:bg-black focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-300 dark:bg-white/50 dark:text-black dark:hover:bg-slate-200 dark:focus:ring-white"
              >
                Edit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
