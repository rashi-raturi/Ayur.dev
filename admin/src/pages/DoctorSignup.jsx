import axios from 'axios'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Upload, User, Mail, Lock, GraduationCap, Briefcase, MapPin, FileText, Camera } from 'lucide-react'

const DoctorSignup = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: null,
    speciality: '',
    degree: '',
    customDegree: '',
    experience: '',
    about: '',
    address: '',
    registrationNumber: '',
    phone: ''
  })

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const specialities = [
    'Ayurvedic Physician',
    'Panchakarma Specialist',
    'Ayurvedic Gynecologist',
    'Ayurvedic Pediatrician',
    'Ayurvedic Dermatologist',
    'Ayurvedic Psychiatrist',
    'Ayurvedic Cardiologist',
    'Ayurvedic Orthopedist',
    'Ayurvedic Neurologist',
    'General Ayurvedic Practitioner'
  ]

  const degrees = [
    'BAMS (Bachelor of Ayurvedic Medicine and Surgery)',
    'MAMS (Master of Ayurvedic Medicine and Surgery)',
    'MD (Ayurveda)',
    'PhD (Ayurveda)',
    'BUMS (Bachelor of Unani Medicine and Surgery)',
    'Other'
  ]

  const experienceOptions = [
    'Fresh Graduate',
    '1 Year',
    '2 Years',
    '3 Years',
    '4 Years',
    '5 Years',
    '6-10 Years',
    '11-15 Years',
    '16-20 Years',
    '20+ Years'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      
      setFormData(prev => ({ ...prev, image: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!formData.password) {
      toast.error('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.speciality) {
      toast.error('Speciality is required')
      return false
    }
    if (!formData.degree) {
      toast.error('Degree is required')
      return false
    }
    if (formData.degree === 'Other' && !formData.customDegree.trim()) {
      toast.error('Please specify your degree')
      return false
    }
    if (!formData.experience) {
      toast.error('Experience is required')
      return false
    }
    if (!formData.registrationNumber.trim()) {
      toast.error('Registration number is required')
      return false
    }
    if (!formData.about.trim()) {
      toast.error('About section is required')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Hospital/Clinic address is required')
      return false
    }
    return true
  }

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    
    if (currentStep === 1) {
      nextStep()
      return
    }

    if (!validateStep2()) return

    setIsLoading(true)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && key !== 'customDegree') {
          if (key === 'degree') {
            // Use custom degree if "Other" is selected
            const degreeValue = formData.degree === 'Other' ? formData.customDegree : formData.degree
            formDataToSend.append(key, degreeValue)
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      const { data } = await axios.post(backendUrl + '/api/doctor/signup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (data.success) {
        toast.success('Doctor account created successfully! Please login with your credentials.')
        navigate('/login')
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        {/* Logo & Header */}
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <img src='/favicon1.png' alt='AyurVed Pro' className='w-12 h-12 object-contain' />
            </div>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Join ayur.dev</h1>
          <p className='text-gray-500'>Create your doctor account and start your digital practice</p>
        </div>

        {/* Progress Indicator */}
        <div className='flex items-center justify-center mb-8'>
          <div className='flex items-center space-x-4'>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
              <User className='w-5 h-5' />
            </div>
            <div className={`h-0.5 w-16 ${currentStep >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
              <GraduationCap className='w-5 h-5' />
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200'>
          <form onSubmit={onSubmitHandler}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='flex items-start gap-3 mb-6'>
                  <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <User className='w-5 h-5 text-gray-700' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold text-gray-900'>Basic Information</h2>
                    <p className='text-sm text-gray-500 mt-0.5'>Tell us about yourself</p>
                  </div>
                </div>

                {/* Profile Image Upload */}
                <div className='text-center'>
                  <div className='relative inline-block'>
                    <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg'>
                      {imagePreview ? (
                        <img src={imagePreview} alt='Preview' className='w-full h-full object-cover' />
                      ) : (
                        <Camera className='w-8 h-8 text-gray-400' />
                      )}
                    </div>
                    <label className='absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors'>
                      <Upload className='w-4 h-4' />
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='hidden'
                      />
                    </label>
                  </div>
                  <p className='text-sm text-gray-500 mt-2'>Upload your profile photo</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Full Name */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      <User className='w-4 h-4 inline mr-2' />
                      Full Name *
                    </label>
                    <input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      placeholder='Dr. John Doe'
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      Phone Number *
                    </label>
                    <input
                      type='tel'
                      name='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      placeholder='+91 9876543210'
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className='block text-sm font-medium text-gray-900 mb-2'>
                    <Mail className='w-4 h-4 inline mr-2' />
                    Email Address *
                  </label>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                    placeholder='doctor@example.com'
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Password */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      <Lock className='w-4 h-4 inline mr-2' />
                      Password *
                    </label>
                    <div className='relative'>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name='password'
                        value={formData.password}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all pr-12'
                        placeholder='Enter password'
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

                  {/* Confirm Password */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      Confirm Password *
                    </label>
                    <input
                      type='password'
                      name='confirmPassword'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      placeholder='Confirm password'
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className='space-y-6'>
                <div className='flex items-start gap-3 mb-6'>
                  <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <GraduationCap className='w-5 h-5 text-gray-700' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold text-gray-900'>Professional Information</h2>
                    <p className='text-sm text-gray-500 mt-0.5'>Your medical qualifications and experience</p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Speciality */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      <Briefcase className='w-4 h-4 inline mr-2' />
                      Speciality *
                    </label>
                    <select
                      name='speciality'
                      value={formData.speciality}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      required
                    >
                      <option value=''>Select Speciality</option>
                      {specialities.map((spec, index) => (
                        <option key={index} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Degree */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      <GraduationCap className='w-4 h-4 inline mr-2' />
                      Degree *
                    </label>
                    <select
                      name='degree'
                      value={formData.degree}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      required
                    >
                      <option value=''>Select Degree</option>
                      {degrees.map((degree, index) => (
                        <option key={index} value={degree}>{degree}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Degree Input - Show when "Other" is selected */}
                {formData.degree === 'Other' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      Please specify your degree *
                    </label>
                    <input
                      type='text'
                      name='customDegree'
                      value={formData.customDegree}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      placeholder='Enter your degree (e.g., BHMS, BNYS, etc.)'
                      required
                    />
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Experience */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      Experience *
                    </label>
                    <select
                      name='experience'
                      value={formData.experience}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      required
                    >
                      <option value=''>Select Experience</option>
                      {experienceOptions.map((exp, index) => (
                        <option key={index} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className='block text-sm font-medium text-gray-900 mb-2'>
                      Registration Number *
                    </label>
                    <input
                      type='text'
                      name='registrationNumber'
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                      placeholder='Medical Registration Number'
                      required
                    />
                  </div>
                </div>

                {/* About */}
                <div>
                  <label className='block text-sm font-medium text-gray-900 mb-2'>
                    <FileText className='w-4 h-4 inline mr-2' />
                    About Yourself *
                  </label>
                  <textarea
                    name='about'
                    value={formData.about}
                    onChange={handleInputChange}
                    rows={4}
                    className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                    placeholder='Tell us about your medical background, areas of expertise, and approach to patient care...'
                    required
                  />
                </div>

                {/* Hospital/Clinic Address */}
                <div>
                  <label className='block text-sm font-medium text-gray-900 mb-2'>
                    <MapPin className='w-4 h-4 inline mr-2' />
                    Hospital/Clinic Address *
                  </label>
                  <textarea
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all'
                    placeholder='Enter your hospital or clinic address where you practice...'
                    required
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className='flex items-center justify-between pt-6 border-t border-gray-100 mt-8'>
              {currentStep === 2 && (
                <button
                  type='button'
                  onClick={prevStep}
                  className='px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium'
                >
                  ← Previous
                </button>
              )}
              
              <div className='flex-1'></div>

              <button
                type='submit'
                disabled={isLoading}
                className='px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {isLoading ? (
                  <>
                    <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Creating Account...
                  </>
                ) : currentStep === 1 ? (
                  <>
                    Next Step →
                  </>
                ) : (
                  <>
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className='text-center pt-6 border-t border-gray-100 mt-6'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link
                to='/login'
                className='text-gray-900 font-medium hover:underline transition-all'
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className='text-center text-sm text-gray-500 mt-8'>
          © 2025 Ayur.dev. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default DoctorSignup