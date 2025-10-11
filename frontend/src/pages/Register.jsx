import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react"; 
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";   
import { registerUser } from "../feature/authSlice"; // assume slice has registerUser

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();  
  const { loading, error, user } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullname: "",
    password: ""
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(registerUser(form)).unwrap();
      navigate("/verifyEmail"); // navigate after successful registration
    } catch (err) {
      console.log("Registration failed:", err);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/chat");
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#2a2a2a]">
      <div className="relative bg-white/10 backdrop-blur-md rounded-[3rem] shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-white/10">
        
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#30312e] to-[#151613] p-10 text-white">
          <img src="/logo.png" alt="Logo" className="w-60 h-40 mb-6 opacity-90" />
          <h1 className="text-3xl font-semibold font-oswald">Join Talkz</h1>
          <p className="mt-2 text-sm text-center">Secure • Private • Encrypted</p>
        </div>

        {/* Right Side */}
        <div className="flex flex-col justify-center p-10 bg-white/5 text-white">
          <h2 className="text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-gray-400 text-sm mb-6">Register to start chatting</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              value={form.fullname}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
              className="w-full bg-yellow-400 text-black p-3 rounded-full font-medium hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
