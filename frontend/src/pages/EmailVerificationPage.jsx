import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resendVerificationEmail, clearError, clearSuccess } from "../feature/authSlice";
import { toast } from "react-hot-toast";

export default function EmailVerificationPage() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");

  const handleResend = async () => {
    if (!email) return toast.error("Please enter your email");
    try {
      await dispatch(resendVerificationEmail(email)).unwrap();
      toast.success(successMessage || "Verification email sent!");
      setEmail("");
      dispatch(clearSuccess());
    } catch (err) {
      toast.error(err || "Failed to resend verification email");
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      {/* Logo */}
      <img src="/logo.png" alt="Talkz Logo" className="w-60 h-40 mb-6 opacity-90" />

      {/* Hero Message */}
      <h1 className="text-5xl font-bold mb-4 text-center">Please Verify Your Email</h1>
      <p className="text-gray-400 text-center mb-8 text-lg">
        You cannot login without verifying your email
      </p>

      {/* Email Input Box */}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full max-w-md p-4 mb-4 rounded-xl bg-[#1a1a1a] border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none text-lg"
      />

      {/* Buttons */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-semibold px-6 py-4 rounded-full hover:bg-yellow-500 transition disabled:opacity-50 text-lg"
        >
          {loading ? "Sending..." : "Resend Verification Email"}
        </button>

        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full bg-gray-800 text-white font-medium px-6 py-4 rounded-full hover:bg-gray-700 transition text-lg"
        >
          Already Verified? Login
        </button>
      </div>

      {/* Error / Success Messages */}
      {error && <p className="text-red-500 mt-6 text-center">{error}</p>}
      {successMessage && <p className="text-green-500 mt-6 text-center">{successMessage}</p>}
    </div>
  );
}
