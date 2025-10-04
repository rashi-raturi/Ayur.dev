import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import PrakrutiSense from './pages/PrakrutiSense'
import AyuChart from './pages/AyuChart'
import ChatbotWidget from './components/ChatbotWidget'
import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence } from 'framer-motion';
 

const App = () => {
  const location = useLocation();
  
  return (
    <div className='bg-white min-h-screen'>
      <ToastContainer />
      <Navbar />
      <div>
        <ChatbotWidget/>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path='/' element={<Home />} />
            <Route path='/doctors' element={<Doctors />} />
            <Route path='/doctors/:speciality' element={<Doctors />} />
            <Route path='/login' element={<Login />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/appointment/:docId' element={<Appointment />} />
            <Route path='/my-appointments' element={<MyAppointments />} />
            <Route path='/my-profile' element={<MyProfile />} />
            <Route path='/verify' element={<Verify />} />
            <Route path='/PrakrutiSense' element={<PrakrutiSense />} />
            <Route path='/AyuChart' element={<AyuChart />} />
          </Routes>
        </AnimatePresence>
        <div className='sm:px-[10%] px-5'>
          <Footer />
        </div>
      </div>
      <Analytics />
    </div>
  )
}

export default App