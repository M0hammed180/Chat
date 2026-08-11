import React from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 text-slate-900 hover:bg-white/40 transition dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
    >
      <IoArrowBack size={22} />
    </button>
  );
}
