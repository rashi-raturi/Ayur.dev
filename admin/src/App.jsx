import { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { SidebarProvider, SidebarContext } from './context/SidebarContext';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
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
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DietChartGenerator from './pages/Doctor/DietChartGenerator';
import PatientManagement from './pages/Doctor/PatientManagement';
import Prescriptions from './pages/Doctor/Prescriptions';

const AppContent = () => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { isSidebarOpen } = useContext(SidebarContext)
  const location = useLocation()

  return dToken || aToken ? (
    <div className='bg-[#F8F9FD]'>
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
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 px-6 pb-6 bg-white ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div key={location.pathname} className='animate-fadeIn'>
            <Routes location={location}>
              <Route path='/' element={
                aToken ? <Navigate to='/admin-dashboard' replace /> : <Navigate to='/doctor-dashboard' replace />
              } />
              <Route path='/admin-dashboard' element={<Dashboard />} />
              <Route path='/all-appointments' element={<AllAppointments />} />
              <Route path='/add-doctor' element={<AddDoctor />} />
              <Route path='/doctor-list' element={<DoctorsList />} />
              <Route path='/doctor/:id' element={<DoctorProfileAdmin />} />
              <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
              <Route path='/doctor-appointments' element={<DoctorAppointments />} />
              <Route path='/doctor-profile' element={<DoctorProfile />} />
              <Route path='/dietchart-generator' element={<DietChartGenerator/>} />
              <Route path='/patient-management' element={<PatientManagement/>} />
              <Route path='/prescriptions' element={<Prescriptions/>} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  ) : (
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
      <Login />
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