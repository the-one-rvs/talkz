import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

export default function Button({ text }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get("/api/v1/isLoggedIn", { withCredentials: true });
        setIsLoggedIn(res.data.isLoggedIn);
      } catch (err) {
        console.error("Failed to check login:", err);
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, []);

  const handleClick = () => {
    if (isLoggedIn) navigate("/chat");
    else navigate("/login");
  };

  // Loading state
  if (isLoggedIn === null) return null;

  return (
    <button
      className="bg-[#E9DF53] text-[#121111] font-semibold text-xl px-8 py-4 rounded-md shadow-md hover:bg-yellow-400 transition-all"
      onClick={handleClick}
    >
      {text}
    </button>
  );
}
