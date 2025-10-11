import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser, logoutUser, clearSuccess } from "../feature/authSlice";
import { User2, CheckCircle, XCircle, LogOut, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function ProfileDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // --- Fetch user ONLY on initial mount ---
  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    }
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Try again!");
    } finally {
      dispatch(clearSuccess());
    }
  };

  if (loading || !user) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 rounded-full border border-gray-300 px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <User2 className="w-5 h-5" />
        <span>{user.username}</span>
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <User2 className="w-6 h-6 text-gray-500" />
              <span className="font-semibold text-gray-800">{user.fullname}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-sm">{user.email}</span>
            </div>

            <div className="flex items-center space-x-1">
              {user.isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600">Not Verified</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs">{user.onlyOAuth ? "OAuth User" : "Standard User"}</span>
            </div>

            <hr />

            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>


            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 rounded-md"
              onClick={() => navigate("/updateAccount")}
            >
              <User2 className="w-4 h-4 mr-2" />
              Update
            </button>

            {/* Conditional password button */}
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-gray-100 rounded-md"
              onClick={() => navigate(user.onlyOAuth ? "/addPassword" : "/changePassword")}
            >
              <Key className="w-4 h-4 mr-2" />
              {user.onlyOAuth ? "Add Password" : "Change Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
