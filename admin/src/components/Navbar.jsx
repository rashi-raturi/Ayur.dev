import { useContext, useState, useEffect } from "react";
import { DoctorContext } from "../context/DoctorContext";
import { SidebarContext } from "../context/SidebarContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";

const Navbar = () => {
  const { dToken, profileData } = useContext(DoctorContext);
  const { isSidebarOpen } = useContext(SidebarContext);
  const [currentTime, setCurrentTime] = useState(new Date());

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      "/doctor-dashboard": "Dashboard",
      "/doctor-appointments": "Appointments",
      "/doctor-profile": "Profile",
      "/dietchart-generator": "Diet Chart Generator",
      "/patient-management": "Patient Management",
      "/prescriptions": "Prescriptions",
    };
    return titleMap[path] || "Dashboard";
  };

  // Format date
  const formatDate = () => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return currentTime.toLocaleDateString("en-US", options);
  };

  // Format time
  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user name
  const getUserName = () => {
    if (dToken && profileData?.name) {
      return profileData.name;
    }
    return "Doctor";
  };

  // Get user role
  const getUserRole = () => {
    if (dToken && profileData?.speciality) {
      return profileData.speciality;
    }
    return "Ayurvedic Physician";
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getUserName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`flex justify-between items-center py-4 bg-white border-b border-gray-200 transition-all duration-300 ${
        isSidebarOpen ? "ml-64 px-6" : "ml-0 pl-20 pr-6"
      }`}
    >
      {/* Left Side - Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
          Overview of your practice and patient statistics
        </p>
      </div>

      {/* Right Side - Date, Time, User Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">{formatDate()}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm font-medium">{formatTime()}</span>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/doctor-profile")}
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {getUserName()}
            </p>
            <p className="text-xs text-gray-500">{getUserRole()}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white text-xs md:text-sm font-semibold">
              {getInitials()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
