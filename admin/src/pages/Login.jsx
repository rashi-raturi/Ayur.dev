import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {

  const navigate = useNavigate()
  const [state, setState] = useState('Doctor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (state === 'Admin') {
        const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
        if (data.success) {
          setAToken(data.token)
          localStorage.setItem('aToken', data.token)
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email)
          }
          toast.success('Welcome back, Admin!')
          navigate('/admin-dashboard')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
        if (data.success) {
          setDToken(data.token)
          localStorage.setItem('dToken', data.token)
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email)
          }
          toast.success('Welcome back, Doctor!')
          navigate('/doctor-dashboard')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
      {/* Login Card */}
      <div className='w-full max-w-md'>
        {/* Logo & Header */}
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <img src='/logo.png' alt='AyurVed Pro' className='w-10 h-10 object-contain' />
            </div>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>ayur.dev</h1>
          <p className='text-gray-500'>Holistic Healthcare Management System</p>
        </div>

        {/* Login Form Card */}
        <div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200'>
          {/* Welcome Header */}
          <div className='flex items-start gap-3 mb-8'>
            <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0'>
              <svg className='w-5 h-5 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>Welcome Back</h2>
              <p className='text-sm text-gray-500 mt-0.5'>Sign in to your practice dashboard</p>
            </div>
          </div>

          <form onSubmit={onSubmitHandler} className='space-y-5'>
            {/* Email Field */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>
                Email Address
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                type='email'
                placeholder='doctor@example.com'
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>
                Password
              </label>
              <div className='relative'>
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all pr-12'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer'
                />
                <span className='text-sm text-gray-600'>Remember me</span>
              </label>
              <button
                type='button'
                className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <>
                  <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Switch Login Type */}
            <div className='text-center pt-4 border-t border-gray-100'>
              {state === 'Admin' ? (
                <p className='text-sm text-gray-600'>
                  Doctor Login?{' '}
                  <button
                    type='button'
                    onClick={() => setState('Doctor')}
                    className='text-gray-900 font-medium hover:underline transition-all'
                  >
                    Click here
                  </button>
                </p>
              ) : (
                <p className='text-sm text-gray-600'>
                  Admin Login?{' '}
                  <button
                    type='button'
                    onClick={() => setState('Admin')}
                    className='text-gray-900 font-medium hover:underline transition-all'
                  >
                    Click here
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Signup Link for Doctors */}
        {state === 'Doctor' && (
          <div className='text-center mt-6'>
            <p className='text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link
                to='/signup'
                className='text-gray-900 font-medium hover:underline transition-all'
              >
                Create doctor account
              </Link>
            </p>
          </div>
        )}

        {/* Footer */}
        <p className='text-center text-sm text-gray-500 mt-8'>
          © 2025 Ayur.dev. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login