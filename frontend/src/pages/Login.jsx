import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react"; 
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";   
import { loginUser } from "../feature/authSlice";
import { usePrivateKeyManager } from "../hooks/usePrivateKeyManager";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();  
  const { loading, error, user } = useSelector((state) => state.auth);
  
  // ✅ move the hook inside the component
  const { setupKeys } = usePrivateKeyManager();  

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Email/password login flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await dispatch(loginUser(form)).unwrap();
      console.log("userData:", userData);
      if (!userData?._id && !userData?.id) {
        throw new Error("Invalid user data returned from login");
      }
      await setupKeys(userData._id || userData.id);
      console.log("Login successful");
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // ✅ Google OAuth login
  const handleGoogleLogin = () => {
    const popup = window.open("/api/v1/oAuthService/google", "_blank", "width=500,height=600");

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "google-oauth-success") {
        dispatch({ type: "auth/loginWithGoogle/fulfilled", payload: event.data.user });
        setupKeys(event.data.user._id || event.data.user.id); // ✅ handle key setup for Google users
        navigate("/chat");
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  useEffect(() => {
    if (user) navigate("/chat");
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#2a2a2a]">
      <div className="relative bg-white/10 backdrop-blur-md rounded-[3rem] shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-white/10">
        
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#30312e] to-[#151613] p-10 text-white">
          <img src="/logo.png" alt="Logo" className="w-60 h-40 mb-6 opacity-90" />
          <h1 className="text-3xl font-semibold font-oswald">Welcome to Talkz</h1>
          <p className="mt-2 text-sm text-center">Secure • Private • Encrypted</p>
        </div>

        {/* Right Side */}
        <div className="flex flex-col justify-center p-10 bg-white/5 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-6">Login to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-black text-2xl  p-3 rounded-full font-medium hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* OR Google Login */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-gray-400">OR</span>
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 bg-black border border-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full transition"
            >
              Login with Google{" "}
              <img
                src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
                alt="Google"
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
