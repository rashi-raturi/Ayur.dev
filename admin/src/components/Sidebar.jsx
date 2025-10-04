import { useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { DoctorContext } from "../context/DoctorContext";
import { SidebarContext } from "../context/SidebarContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  ClipboardList,
  User,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";

const Sidebar = () => {
  const { dToken, setDToken } = useContext(DoctorContext);
  const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setDToken("");
    localStorage.removeItem("dToken");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      {/* Toggle Button - Hamburger Menu */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors shadow-md"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300 z-40 ${
          isSidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 flex items-center justify-center">
              <img
                src={assets.admin_logo}
                alt="Logo"
                className="w-12 h-12 rounded-xl brightness-100"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Ayur.dev</h1>
              <p className="text-xs text-blue-600">Holistic Healthcare</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <NavLink
            to={"/doctor-dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to={"/patient-management"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <Users className="w-4 h-4" />
            <span>Patients</span>
          </NavLink>
          <NavLink
            to={"/doctor-appointments"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </NavLink>
          <NavLink
            to={"/prescriptions"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <FileText className="w-4 h-4" />
            <span>Prescriptions</span>
          </NavLink>
          <NavLink
            to={"/dietchart-generator"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <ClipboardList className="w-4 h-4" />
            <span>Diet Charts</span>
          </NavLink>
          <NavLink
            to={"/doctor-profile"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
