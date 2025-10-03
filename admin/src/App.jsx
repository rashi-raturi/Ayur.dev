import { useContext, useEffect } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { SidebarProvider, SidebarContext } from './context/SidebarContext';
import { Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import DoctorProfileAdmin from './pages/Admin/DoctorProfileAdmin';
import Login from './pages/Login';
import DoctorSignup from './pages/DoctorSignup';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DietChartGenerator from './pages/Doctor/DietChartGenerator';
import PatientManagement from './pages/Doctor/PatientManagement';
import Prescriptions from './pages/Doctor/Prescriptions';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  
  const isAuthenticated = dToken || aToken
  const hasAdminAccess = aToken

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/doctor-dashboard" replace />
  }

  return children
}

const AppContent = () => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { isSidebarOpen } = useContext(SidebarContext)
  const location = useLocation()
  const navigate = useNavigate()

  const isAuthenticated = dToken || aToken
  const isLoginPage = location.pathname === '/login'

  // Redirect to appropriate dashboard on root path
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      if (aToken) {
        navigate('/admin-dashboard', { replace: true })
      } else if (dToken) {
        navigate('/doctor-dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, aToken, dToken, location.pathname, navigate])

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
        <div className='bg-[#F8F9FD] min-h-screen'>
          <Navbar />
          <div className='flex items-start'>
            <Sidebar />
            <div className={`flex-1 transition-all duration-300 px-6 pb-6 bg-white min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
              <div key={location.pathname} className='animate-fadeIn'>
                <Routes location={location}>
                  <Route path='/' element={
                    aToken ? <Navigate to='/admin-dashboard' replace /> : <Navigate to='/doctor-dashboard' replace />
                  } />
                  
                  {/* Admin Routes */}
                  <Route path='/admin-dashboard' element={
                    <ProtectedRoute requireAdmin={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path='/all-appointments' element={
                    <ProtectedRoute requireAdmin={true}>
                      <AllAppointments />
                    </ProtectedRoute>
                  } />
                  <Route path='/add-doctor' element={
                    <ProtectedRoute requireAdmin={true}>
                      <AddDoctor />
                    </ProtectedRoute>
                  } />
                  <Route path='/doctor-list' element={
                    <ProtectedRoute requireAdmin={true}>
                      <DoctorsList />
                    </ProtectedRoute>
                  } />
                  <Route path='/doctor/:id' element={
                    <ProtectedRoute requireAdmin={true}>
                      <DoctorProfileAdmin />
                    </ProtectedRoute>
                  } />
                  
                  {/* Doctor Routes */}
                  <Route path='/doctor-dashboard' element={
                    <ProtectedRoute>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path='/doctor-appointments' element={
                    <ProtectedRoute>
                      <DoctorAppointments />
                    </ProtectedRoute>
                  } />
                  <Route path='/doctor-profile' element={
                    <ProtectedRoute>
                      <DoctorProfile />
                    </ProtectedRoute>
                  } />
                  <Route path='/dietchart-generator' element={
                    <ProtectedRoute>
                      <DietChartGenerator />
                    </ProtectedRoute>
                  } />
                  <Route path='/patient-management' element={
                    <ProtectedRoute>
                      <PatientManagement />
                    </ProtectedRoute>
                  } />
                  <Route path='/prescriptions' element={
                    <ProtectedRoute>
                      <Prescriptions />
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect to login if accessing login while authenticated */}
                  <Route path='/login' element={
                    aToken ? <Navigate to='/admin-dashboard' replace /> : <Navigate to='/doctor-dashboard' replace />
                  } />
                  
                  {/* Catch all - redirect to appropriate dashboard */}
                  <Route path='*' element={
                    aToken ? <Navigate to='/admin-dashboard' replace /> : <Navigate to='/doctor-dashboard' replace />
                  } />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<DoctorSignup />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      )}
    </>
  )
}

const App = () => {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  )
}

export default App