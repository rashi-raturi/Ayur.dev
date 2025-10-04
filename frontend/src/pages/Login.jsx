import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (state === 'Sign Up') {
      // Validation for sign up
      if (!name || !email || !password || !confirmPassword || !gender || !dob) {
        toast.error('Please fill all required fields')
        return
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long')
        return
      }

      try {
        const { data } = await axios.post(backendUrl + '/api/user/register', { 
          name, 
          email, 
          password, 
          gender, 
          dob
        })

        if (data.success) {
          toast.success('Account created successfully! Please login with your credentials.')
          // Switch to login mode and keep the email filled
          setState('Login')
          // Keep email filled, clear other fields
          setName('')
          setPassword('')
          setConfirmPassword('')
          setGender('')
          setDob('')
          // Email remains filled for easy login
        } else {
          toast.error(data.message || 'Registration failed')
          console.error('Registration failed:', data)
        }
      } catch (error) {
        console.error('Registration error details:', error)
        console.error('Error response:', error.response?.data)
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
      }

    } else {

      try {
        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })

        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error('Login failed. Please try again.')
        console.error('Login error:', error)
      }

    }

  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-2 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg bg-white'>
        <p className='text-3xl text-primary font-semibold'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p className='font-semibold text-md'>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
        
        {state === 'Sign Up' && (
          <>
            <div className='w-full'>
              <p className='font-semibold'>Full Name *</p>
              <input 
                onChange={(e) => setName(e.target.value)} 
                value={name} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="text" 
                required 
              />
            </div>

            <div className='w-full'>
              <p className='font-semibold'>Gender *</p>
              <select 
                onChange={(e) => setGender(e.target.value)} 
                value={gender} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className='w-full'>
              <p className='font-semibold'>Date of Birth *</p>
              <input 
                onChange={(e) => setDob(e.target.value)} 
                value={dob} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="date" 
                required 
              />
            </div>
          </>
        )}

        <div className='w-full '>
          <p className='font-semibold'>Email *</p>
          <input 
            onChange={(e) => setEmail(e.target.value)} 
            value={email} 
            className='border border-[#DADADA] rounded w-full p-2 mt-1' 
            type="email" 
            required 
          />
        </div>

        <div className='w-full relative'>
          <p className='font-semibold'>Password *</p>
          <input 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
            className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10' 
            type={showPassword ? 'text' : 'password'} 
            required 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {state === 'Sign Up' && (
          <div className='w-full relative'>
            <p className='font-semibold'>Confirm Password *</p>
            <input 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              value={confirmPassword} 
              className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10' 
              type={showConfirmPassword ? 'text' : 'password'} 
              required 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        )}

        <button className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>
          {state === 'Sign Up' ? 'Create account' : 'Login'}
        </button>

        {state === 'Sign Up'
          ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline cursor-pointer"
                onClick={() => setState("Login")}
              >
                Login
              </button>
            </p>
          )
          : (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="text-primary underline cursor-pointer"
                onClick={() => setState("Sign Up")}
              >
                Sign Up
              </button>
            </p>
          )
        }
      </div>
    </form>
  )
}

export default Login