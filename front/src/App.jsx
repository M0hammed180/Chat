import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import bg from "../public/dark.jpg";
import whiteBg from "../public/white.jpg";
import React from "react";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Sidebar/Sidebar";
import Chat from "./components/Chat/Chat";
import Settings from "./components/Settings/Settings";
import Profile from "./components/Profile/Profile";
import { useTheme } from "./context/ThemeContext.jsx";
import { Provider, useSelector } from "react-redux";
import reduxstore from "./Redux/reduxStore";
import AddGroup from "./components/AddGroup/AddGroup.jsx";
import ChatGroup from "./components/ChatGroup/ChatGroup.jsx";
import EditProfile from "./components/EditProfile/EditProfile.jsx";
import GroupSettings from "./components/GroupSettings/GroupSettings.jsx";

function AppContent() {
  const { isAuthenticated } = useSelector((state) => state.user);
  const location = useLocation();
  const { theme } = useTheme();
  const bgImage = theme === "dark" ? bg : whiteBg;
  const hideSidebar = ["/login", "/register"].includes(location.pathname);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showSidebarPage = !hideSidebar && location.pathname === "/" && isMobile;

  return (
    <div
      className={`min-h-screen bg-cover bg-center transition-colors duration-300 ${
        theme === "dark" ? "text-white" : "text-slate-900"
      }`}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="flex min-h-screen">
        {!hideSidebar && (
          <div
            className={`${showSidebarPage ? "block w-full" : "hidden md:block"}`}
          >
            <Sidebar />
          </div>
        )}

        <div
          className={`${hideSidebar || showSidebarPage ? "w-full" : "md:ml-[30%] flex-1"}`}
        >
          <Routes>
            <Route
              index
              element={showSidebarPage ? <div className="hidden" /> : <Chat />}
            />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/chatgroup/:id" element={<ChatGroup />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/addGroup" element={<AddGroup />} />
            <Route path="/edit" element={<EditProfile />} />
            <Route path="/GroupSettings/:id" element={<GroupSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider store={reduxstore}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
