import React, { useState, useContext, useEffect } from 'react'
import { X, Calendar as CalendarIcon } from 'lucide-react'
import { DoctorContext } from '../context/DoctorContext'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const NewAppointmentModal = ({ isOpen, onClose, onSuccess, editingAppointment }) => {
  const { dToken, patients, getPatients } = useContext(DoctorContext)
  const { backendUrl } = useContext(AppContext)
  
  const isEditMode = !!editingAppointment
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    phone: '',
    email: '',
    appointmentType: 'consultation',
    locationType: 'clinic',
    duration: 45,
    appointmentDate: '',
    appointmentTime: '',
    fees: '',
    paymentMethod: 'cash',
    status: 'scheduled'
  })

  const [loading, setLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  // Fetch patients when modal opens
  useEffect(() => {
    if (isOpen && dToken) {
      getPatients()
    }
  }, [isOpen, dToken])

  // Populate form data when editing
  useEffect(() => {
    if (isOpen && editingAppointment) {
      const patient = patients.find(p => p._id === editingAppointment.userId)
      // Determine current status
      const currentStatus = editingAppointment.status || 
        (editingAppointment.cancelled ? 'cancelled' : 
         editingAppointment.isCompleted ? 'completed' : 
         editingAppointment.payment ? 'confirmed' : 'scheduled')
      
      setFormData({
        patientId: editingAppointment.userId,
        patientName: editingAppointment.userData?.name || '',
        phone: editingAppointment.userData?.phone || '',
        email: editingAppointment.userData?.email || '',
        appointmentType: editingAppointment.appointmentType || 'consultation',
        locationType: editingAppointment.locationType || 'clinic',
        duration: editingAppointment.duration || 45,
        appointmentDate: editingAppointment.slotDate || '',
        appointmentTime: editingAppointment.slotTime || '',
        fees: editingAppointment.amount || '',
        paymentMethod: editingAppointment.paymentMethod || 'cash',
        status: currentStatus
      })
      if (patient) {
        setSelectedPatient(patient)
      }
    }
  }, [isOpen, editingAppointment, patients])

  // Handle patient selection
  const handlePatientSelect = (e) => {
    const patientId = e.target.value
    setFormData(prev => ({ ...prev, patientId }))
    
    if (patientId) {
      const patient = patients.find(p => p._id === patientId)
      if (patient) {
        setSelectedPatient(patient)
        setFormData(prev => ({
          ...prev,
          patientName: patient.name,
          phone: patient.phone || '',
          email: patient.email || ''
        }))
      }
    } else {
      setSelectedPatient(null)
      setFormData(prev => ({
        ...prev,
        patientName: '',
        phone: '',
        email: ''
      }))
    }
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      toast.error('Please select a patient')
      return
    }
    if (!formData.appointmentDate) {
      toast.error('Please select appointment date')
      return
    }
    if (!formData.appointmentTime) {
      toast.error('Please select appointment time')
      return
    }

    setLoading(true)
    try {
      const appointmentData = {
        userId: formData.patientId,
        slotDate: formData.appointmentDate,
        slotTime: formData.appointmentTime,
        appointmentType: formData.appointmentType,
        locationType: formData.locationType,
        duration: parseInt(formData.duration) || 45,
        amount: formData.fees ? parseFloat(formData.fees) : undefined,
        paymentMethod: formData.paymentMethod
      }

      // Include status only when editing
      if (isEditMode) {
        appointmentData.status = formData.status
      }

      console.log(isEditMode ? 'Updating appointment' : 'Creating appointment', 'with data:', appointmentData)

      const endpoint = isEditMode 
        ? backendUrl + `/api/doctor/update-appointment/${editingAppointment._id}`
        : backendUrl + '/api/doctor/create-appointment'
      
      const method = isEditMode ? 'put' : 'post'

      const { data } = await axios[method](
        endpoint,
        appointmentData,
        { headers: { dToken } }
      )

      console.log('Backend response:', data)

      if (data.success) {
        toast.success(isEditMode ? 'Appointment updated successfully!' : 'Appointment scheduled successfully!')
        onSuccess()
        handleClose()
      } else {
        toast.error(data.message || (isEditMode ? 'Failed to update appointment' : 'Failed to create appointment'))
      }
    } catch (error) {
      console.error('Appointment error:', error)
      toast.error(error.response?.data?.message || (isEditMode ? 'Failed to update appointment' : 'Failed to schedule appointment'))
    } finally {
      setLoading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setFormData({
      patientId: '',
      patientName: '',
      phone: '',
      email: '',
      appointmentType: 'consultation',
      locationType: 'clinic',
      duration: 45,
      appointmentDate: '',
      appointmentTime: '',
      fees: '',
      paymentMethod: 'cash',
      status: 'scheduled'
    })
    setSelectedPatient(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slideUp'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              {isEditMode ? 'Edit Appointment' : 'Schedule New Appointment'}
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              {isEditMode ? 'Update the appointment details' : 'Fill in the details to schedule a new appointment'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='p-6 space-y-6 overflow-y-auto flex-1'>
          {/* Patient Details Section */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Patient Details</h3>
            <div className='space-y-4'>
              {/* Patient Name Dropdown */}
              <div>
                <label className='block text-sm font-semibold text-gray-900 mb-2'>
                  Patient Name <span className='text-red-500'>*</span>
                </label>
                <select
                  name='patientId'
                  value={formData.patientId}
                  onChange={handlePatientSelect}
                  required
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                >
                  <option value=''>Select patient</option>
                  {patients && patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Phone Number (Auto-filled) */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Phone Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='phone'
                    value={formData.phone}
                    readOnly
                    placeholder='+91 XXXXX XXXXX'
                    className='w-full px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed border-0'
                  />
                </div>

                {/* Email Address (Auto-filled) */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Email Address <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    readOnly
                    placeholder='patient@example.com'
                    className='w-full px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed border-0'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-gray-200'></div>

          {/* Appointment Details Section */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Appointment Details</h3>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                {/* Appointment Type */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Appointment Type <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='appointmentType'
                    value={formData.appointmentType}
                    onChange={handleChange}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                  >
                    <option value='consultation'>Consultation</option>
                    <option value='follow-up'>Follow-up</option>
                    <option value='emergency'>Emergency</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Location <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='locationType'
                    value={formData.locationType}
                    onChange={handleChange}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                  >
                    <option value='clinic'>Clinic</option>
                    <option value='online'>Online</option>
                    <option value='home-visit'>Home Visit</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Appointment Date */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Appointment Date <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='date'
                    name='appointmentDate'
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900'
                  />
                </div>

                {/* Time */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Time <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='appointmentTime'
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    required
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                  >
                    <option value=''>Select time</option>
                    {generateTimeSlots().map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Duration */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Duration (min) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='duration'
                    value={formData.duration}
                    onChange={handleChange}
                    min='15'
                    step='15'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900'
                  />
                </div>

                {/* Fees */}
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Fees (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='fees'
                    value={formData.fees}
                    onChange={handleChange}
                    min='0'
                    placeholder='1500'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900'
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className='block text-sm font-semibold text-gray-900 mb-2'>
                  Payment Method <span className='text-red-500'>*</span>
                </label>
                <select
                  name='paymentMethod'
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                >
                  <option value='cash'>Cash</option>
                  <option value='online'>Online</option>
                  <option value='card'>Card</option>
                  <option value='insurance'>Insurance</option>
                </select>
              </div>

              {/* Status - Only show in edit mode */}
              {isEditMode && (
                <div>
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Appointment Status <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white'
                  >
                    <option value='scheduled'>Scheduled</option>
                    <option value='confirmed'>Confirmed</option>
                    <option value='in-progress'>In Progress</option>
                    <option value='completed'>Completed</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Action Buttons - Fixed at Bottom */}
          <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0'>
            <button
              type='button'
              onClick={handleClose}
              className='px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-5 py-2.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm'
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Scheduling...') 
                : (isEditMode ? 'Update Appointment' : 'Schedule Appointment')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewAppointmentModal
