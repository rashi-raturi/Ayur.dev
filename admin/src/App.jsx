import { useContext, useEffect } from "react";
import { DoctorContext } from "./context/DoctorContext";
import { SidebarProvider, SidebarContext } from "./context/SidebarContext";
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DietChartGenerator from "./pages/Doctor/DietChartGenerator";
import PatientManagement from "./pages/Doctor/PatientManagement";
import Prescriptions from "./pages/Doctor/Prescriptions";
import HISIntegration from "./pages/Doctor/HISIntegration";
import DoctorSignup from "./pages/DoctorSignup";

// Protected Route Component for Doctor Only
const ProtectedRoute = ({ children }) => {
  const { dToken } = useContext(DoctorContext);

  if (!dToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent = () => {
  const { dToken } = useContext(DoctorContext);
  const { isSidebarOpen } = useContext(SidebarContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = dToken;
  const isLoginPage = location.pathname === "/login";

  // Redirect to doctor dashboard on root path
  useEffect(() => {
    if (isAuthenticated && location.pathname === "/") {
      navigate("/doctor-dashboard", { replace: true });
    }
  }, [isAuthenticated, dToken, location.pathname, navigate]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {isAuthenticated && !isLoginPage ? (
        <div className="bg-[#F8F9FD] min-h-screen">
          <Navbar />
          <div className="flex items-start">
            <Sidebar />
            <div
              className={`flex-1 transition-all duration-300 px-6 pb-6 bg-white min-h-screen ${
                isSidebarOpen ? "ml-64" : "ml-0"
              }`}
            >
              <div key={location.pathname} className="animate-fadeIn">
                <Routes location={location}>
                  <Route
                    path="/"
                    element={<Navigate to="/doctor-dashboard" replace />}
                  />

                  {/* Doctor Routes Only */}
                  <Route
                    path="/doctor-dashboard"
                    element={
                      <ProtectedRoute>
                        <DoctorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/doctor-appointments"
                    element={
                      <ProtectedRoute>
                        <DoctorAppointments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/doctor-profile"
                    element={
                      <ProtectedRoute>
                        <DoctorProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dietchart-generator"
                    element={
                      <ProtectedRoute>
                        <DietChartGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/patient-management"
                    element={
                      <ProtectedRoute>
                        <PatientManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/prescriptions"
                    element={
                      <ProtectedRoute>
                        <Prescriptions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/his-integration"
                    element={
                      <ProtectedRoute>
                        <HISIntegration />
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirect to login if accessing login while authenticated */}
                  <Route
                    path="/login"
                    element={<Navigate to="/doctor-dashboard" replace />}
                  />

                  {/* Catch all - redirect to doctor dashboard */}
                  <Route
                    path="*"
                    element={<Navigate to="/doctor-dashboard" replace />}
                  />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<DoctorSignup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
};

const App = () => {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
};

export default App;
