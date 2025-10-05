import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='w-full bg-white border-b border-gray-200'>
      <div className='max-w-[1400px] mx-auto px-6 py-2.5 flex items-center justify-between'>
        {/* Logo and Brand Name */}
        <div onClick={() => navigate('/')} className='flex items-center gap-3 cursor-pointer'>
          <img className='h-9 w-9 rounded-xl' src={assets.logo} alt="Logo" />
          <div className='flex flex-col'>
            <span className='text-base font-semibold text-gray-900'>Ayur.dev</span>
            <span className='text-xs text-gray-500'>Wellness Portal</span>
          </div>
        </div>

        {/* Navigation Links - Desktop */}
        <ul className='hidden md:flex items-center gap-1'>
          {/* Section 1: Main Pages */}
          <NavLink to='/' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>Home</span>
              </li>
            )}
          </NavLink>
          
          <NavLink to='/PrakrutiSense' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>Prakruti Sense</span>
              </li>
            )}
          </NavLink>
          
          <NavLink to='/AyuChart' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>AyuChart</span>
              </li>
            )}
          </NavLink>
          
          <NavLink to='/contact' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>VaaniAI</span>
              </li>
            )}
          </NavLink>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* Section 2: Appointments */}
          <NavLink to='/doctors' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>Book Appointment</span>
              </li>
            )}
          </NavLink>
          
          <NavLink to='/my-appointments' className={({ isActive }) => isActive ? 'bg-gray-100 rounded-xl' : ''}>
            {({ isActive }) => (
              <li className='px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className='text-sm font-medium text-gray-700'>My Appointments</span>
              </li>
            )}
          </NavLink>
        </ul>

        {/* User Profile / Login Button */}
        <div className='flex items-center gap-4'>
          {
            token && userData
              ? <div 
                  onClick={() => navigate('/my-profile')} 
                  className='flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer'
                >
                  {userData.image && !userData.image.includes('data:image') ? (
                    <img className='w-8 h-8 rounded-full object-cover border-2 border-purple-100' src={userData.image} alt="Profile" />
                  ) : (
                    <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold'>
                      {userData.name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                  )}
                  <span className='text-sm font-medium text-gray-700 hidden lg:block'>{userData.name?.split(' ')[0]}</span>
                </div>
              : <button onClick={() => navigate('/login')} className='bg-gray-900 text-white px-5 py-1.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors hidden md:block'>
                  Sign In
                </button>
          }
          
          {/* Mobile Menu Icon */}
          <img onClick={() => setShowMenu(true)} className='w-6 md:hidden cursor-pointer' src={assets.menu_icon} alt="Menu" />
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <img src={assets.logo} className='h-10 w-10 rounded-xl' alt="Logo" />
              <div className='flex flex-col'>
                <span className='text-lg font-semibold text-gray-900'>AyurVed</span>
                <span className='text-xs text-gray-500'>Wellness Portal</span>
              </div>
            </div>
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7 cursor-pointer' alt="Close" />
          </div>
          <ul className='flex flex-col items-start gap-2 mt-5 px-5 text-base font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/PrakrutiSense' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Prakruti Sense
              </p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/AyuChart' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                AyuChart
              </p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                VaaniAI
              </p>
            </NavLink>

            {/* Horizontal Separator */}
            <div className="w-full h-px bg-gray-200 my-2"></div>

            {/* Section 2: Appointments */}
            <div className="w-full px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointments</p>
            </div>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Book Appointment
              </p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/my-appointments' className='w-full'>
              <p className='px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3'>
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Appointments
              </p>
            </NavLink>

            {!token && (
              <button onClick={() => { navigate('/login'); setShowMenu(false); }} className='w-full mt-4 bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors'>
                Sign In
              </button>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar