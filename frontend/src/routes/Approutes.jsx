import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
// import EmailVerificationHero from "../pages/EmailVerificationHero";
import EmailVerificationPage from "../pages/EmailVerificationPage";
import UpdateAccount from "../pages/UpdateAccount";
import PassChange from "../pages/PassChange";
import AddPassword from "../pages/AddPassword";
import ChatPage from "../pages/ChatPage";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verifyEmail" element={<EmailVerificationPage />} />
                <Route path="/updateAccount" element={<UpdateAccount />} />
                <Route path="/changePassword" element={<PassChange />} />
                <Route path="/addPassword" element={<AddPassword />} />
                <Route path="/error" element={<h1>404</h1>}></Route>
                <Route path="/chat" element={<ChatPage />}></Route>
            </Routes>
        </Router>
    );
};

export default AppRoutes