import React from "react";
import {
  FiUser,
  FiMoon,
  FiLock,
  FiBell,
  FiGlobe,
  FiLogOut,
  FiEdit2,
} from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import BackButton from "../Elements/BackButton.jsx";
import { socket } from "../socket.js";
import { logout } from "../../Redux/userSlice.js";
import { getAvatarSrc } from "../../utils/avatarHelper";
export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.user);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated]);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const user = useSelector((state) => state.user);

  //logout
  const logOut = () => {
    socket.disconnect();
    setTimeout(() => {
      dispatch(logout());
      navigate("/login");
    }, 100);
  };

  return (
    <div className="h-screen w-full p-3 sm:p-4">
      <div className="relative h-full bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 overflow-y-auto transition-colors duration-300">
        <BackButton />
        {/* Profile */}
        <div className="flex flex-col items-center border-b border-slate-200/70 dark:border-white/10 pb-6">
          <img
            src={getAvatarSrc(user.avatar, false)}
            alt=""
            className="object-cover w-24 h-24 rounded-full border-4 border-slate-200/70 dark:border-white/20"
          />

          <h2 className="mt-3 text-xl font-bold">{user.userName}</h2>

          <p className="text-slate-500 dark:text-slate-300">{user.email}</p>

          <Link
            to="/edit"
            className="mt-3 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-sm text-white transition"
          >
            <FiEdit2 />
            Edit Profile
          </Link>
        </div>

        {/* Settings */}
        <div onClick={() => navigate("/edit")} className="mt-5 space-y-2">
          <button className="w-full flex items-center justify-between bg-white/20 hover:bg-white/40 transition dark:bg-white/10 dark:hover:bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <FiUser size={22} />
              <span>Account</span>
            </div>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between bg-white/20 hover:bg-white/40 transition dark:bg-white/10 dark:hover:bg-white/15 rounded-2xl p-3"
          >
            <div className="flex items-center gap-3">
              <FiMoon size={22} />
              <span>Dark Mode</span>
            </div>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {isDark ? "On" : "Off"}
            </span>
          </button>

          <button
            onClick={logOut}
            className="w-full flex items-center justify-between bg-red-500/20 hover:bg-red-500/30 text-red-300 transition rounded-2xl p-3"
          >
            <div className="flex items-center gap-3">
              <FiLogOut size={22} />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
