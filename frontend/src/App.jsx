import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
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

const App = () => {
  return (
    <div className='sm:px-[10%] bg-yellow-100 min-h-screen px-5'>
      <ToastContainer />
      <Navbar />
      <ChatbotWidget/>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/PrakrutiSense' element={<PrakrutiSense />} />
        <Route path='/AyuChart' element={<AyuChart />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App