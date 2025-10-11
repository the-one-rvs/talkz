import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import ProfileDropdown from "./ProfileDropdown";
import axios from "axios";

export default function Navbar({ onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation(); // detect current route
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading
  const [search, setSearch] = useState("");

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

  const loginNavigate = () => navigate("/login");
  const registerNavigate = () => navigate("/register");
  const verifyEmailNavigate = () => navigate("/verifyEmail");

  if (isLoggedIn === null) return null; // still loading

  const isChatPage = location.pathname === "/chat";

  return (
    <header className="w-full h-20 bg-black border-b border-gray-700 flex items-center justify-between px-12 fixed top-0 left-0 z-50">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <img src={"/logo.png"} alt="Logo" className="w-30 h-15" />
      </div>

      {/* Middle - Search (only on chat page) */}
      {isChatPage && (
        <div className="flex-1 mx-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      )}

      {/* Right - Buttons / Dropdown */}
      <div className="flex items-center gap-3">
        {!isLoggedIn && (
          <>
            <button
              className="bg-gray-700 text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-gray-600 transition"
              onClick={loginNavigate}
            >
              Login
            </button>

            <button
              className="bg-gray-700 text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-gray-600 transition"
              onClick={verifyEmailNavigate}
            >
              Verify Email
            </button>

            <button
              className="bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-md hover:bg-yellow-500 transition"
              onClick={registerNavigate}
            >
              Register
            </button>
          </>
        )}

        {isLoggedIn && <ProfileDropdown />}
      </div>
    </header>
  );
}
