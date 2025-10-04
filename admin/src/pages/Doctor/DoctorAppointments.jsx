import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import PatientProfileModal from './PatientProfileModal'
import NewAppointmentModal from '../../components/NewAppointmentModal'
import { toast } from 'react-toastify'
import axios from 'axios'
import { 
  Search, 
  ChevronDown, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Video, 
  Wallet,
  CheckCircle,
  XCircle,
  Edit,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Undo2
} from 'lucide-react'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, confirmAppointment, startAppointment, completeAppointment, profileData, getProfileData } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency, backendUrl } = useContext(AppContext)
  const location = useLocation()
  
  // State for patient profile modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  
  // State for new appointment modal
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false)
  
  // State for edit appointment
  const [editingAppointment, setEditingAppointment] = useState(null)
  
  // New states for the redesigned UI
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (dToken) {
      getAppointments()
      getProfileData() // Load doctor profile data
    }
  }, [dToken])

  // Check if we should open the add appointment modal from navigation state
  useEffect(() => {
    if (location.state?.openAddAppointment) {
      // Add a small delay for smooth transition after navigation
      const timer = setTimeout(() => {
        setIsNewAppointmentModalOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location])

  // Function to handle patient name click
  const handlePatientClick = (patientId) => {
    setSelectedPatientId(patientId)
    setIsPatientModalOpen(true)
  }

  // Function to close patient modal
  const closePatientModal = () => {
    setIsPatientModalOpen(false)
    setSelectedPatientId(null)
  }

  // Function to handle edit appointment
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment)
    setIsNewAppointmentModalOpen(true)
  }

  // Function to close appointment modal
  const closeAppointmentModal = () => {
    setIsNewAppointmentModalOpen(false)
    setEditingAppointment(null)
  }

  // Function to undo cancellation
  const undoCancellation = async (appointmentId) => {
    try {
      const response = await fetch(`${backendUrl}/api/doctor/undo-cancellation/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'dtoken': dToken
        }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Appointment restored successfully')
        // Force refresh appointments list to get updated data (bypass cache)
        await getAppointments(true)
      } else {
        toast.error(data.message || 'Failed to restore appointment')
      }
    } catch (error) {
      console.error('Error restoring appointment:', error)
      toast.error('Failed to restore appointment')
    }
  }

  // Function to send WhatsApp appointment notification
  const sendWhatsAppNotification = async (appointment) => {
    try {
      // Safety check for userData
      if (!appointment.userData || !appointment.userData.phone) {
        toast.error('Patient phone number not available')
        return
      }

      // Get patient details
      const patientName = appointment.userData.name || 'Patient'
      const patientPhone = appointment.userData.phone
      
      // Format date and time
      const appointmentDate = new Date(appointment.slotDate).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const appointmentTime = appointment.slotTime
      
      // Get appointment type
      const appointmentType = appointment.appointmentType || 'consultation'
      const typeLabel = appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1).replace('-', ' ')
      
      // Get location type
      const locationType = appointment.locationType || 'clinic'
      const locationLabel = locationType === 'online' ? '💻 Online Consultation' : 
                           locationType === 'home-visit' ? '🏠 Home Visit' : 
                           '🏥 Clinic Visit'
      
      // Format fees
      const fees = appointment.amount ? `${currency}${appointment.amount}` : 'As per consultation'
      
      // Get doctor name (from context profileData, then appointment data, then fallback)
      console.log('ProfileData:', profileData)
      console.log('Appointment docData:', appointment.docData)
      const doctorName = profileData?.name || appointment.docData?.name || 'Your Doctor'
      console.log('Doctor Name:', doctorName)
      
      // Craft the WhatsApp message
      const message = `✨ *Appointment Confirmation* ✨

Dear ${patientName},

Your appointment has been successfully scheduled! 🎉

📋 *Appointment Details:*
━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ Doctor: ${doctorName}
📅 Date: ${appointmentDate}
🕐 Time: ${appointmentTime}
⏱️ Duration: ${appointment.duration || 45} minutes
🔖 Type: ${typeLabel}
📍 Location: ${locationLabel}
💰 Consultation Fee: ${fees}

${appointment.appointmentType === 'emergency' ? '⚠️ *This is marked as an EMERGENCY appointment. Please arrive 10 minutes early.*\n\n' : ''}${appointment.locationType === 'online' ? '💻 *Online Consultation Link will be shared 15 minutes before the appointment.*\n\n' : ''}📝 *Important Instructions:*
• Please arrive 10 minutes before your scheduled time
• Bring any previous medical reports
• Carry a valid ID proof
${appointment.locationType === 'clinic' ? '• Wear a mask for your safety\n' : ''}
✅ *Your appointment is CONFIRMED!*

For any changes or queries, please contact the clinic.

Thank you for choosing us for your healthcare needs! 🙏

_This is an automated message. Please do not reply._`

      // Remove country code prefix if present and clean phone number
      let cleanPhone = patientPhone.replace(/\D/g, '') // Remove all non-digits
      
      // If phone starts with country code, keep it; otherwise assume it needs one
      if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone // Add India country code
      }
      
      // Create WhatsApp URL - Don't encode the message to preserve emojis
      // WhatsApp's API will handle the encoding properly
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURI(message)}`
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')
      
      // Mark reminder as sent in the database
      try {
        const response = await axios.post(
          backendUrl + '/api/doctor/mark-reminder-sent',
          { appointmentId: appointment._id },
          { headers: { dToken } }
        )
        
        if (response.data.success) {
          // Refresh appointments to update the UI
          getAppointments()
          toast.success('Reminder sent successfully!')
        }
      } catch (apiError) {
        console.error('Error marking reminder as sent:', apiError)
        // Still show success for WhatsApp opening even if DB update fails
        toast.success('WhatsApp opened successfully')
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
      toast.error('Failed to open WhatsApp')
    }
  }

  // Calculate statistics
  const stats = {
    total: appointments.length,
    today: appointments.filter(apt => {
      const aptDate = new Date(apt.slotDate)
      const today = new Date()
      return aptDate.toDateString() === today.toDateString()
    }).length,
    confirmed: appointments.filter(apt => {
      const status = apt.status || (apt.cancelled ? 'cancelled' : apt.isCompleted ? 'completed' : apt.payment ? 'confirmed' : 'scheduled')
      return status === 'confirmed'
    }).length,
    pending: appointments.filter(apt => {
      const status = apt.status || (apt.cancelled ? 'cancelled' : apt.isCompleted ? 'completed' : apt.payment ? 'confirmed' : 'scheduled')
      return status === 'scheduled'
    }).length,
    completed: appointments.filter(apt => {
      const status = apt.status || (apt.cancelled ? 'cancelled' : apt.isCompleted ? 'completed' : apt.payment ? 'confirmed' : 'scheduled')
      return status === 'completed'
    }).length
  }

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    // Safety check for userData
    if (!apt.userData) return false
    
    const matchesSearch = apt.userData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.userData.phone?.includes(searchTerm) ||
                         apt.userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use new status field, fallback to old fields for backward compatibility
    const appointmentStatus = apt.status || (apt.cancelled ? 'cancelled' : apt.isCompleted ? 'completed' : apt.payment ? 'confirmed' : 'scheduled')
    
    const matchesStatus = statusFilter === 'All Status' ? true :
                         statusFilter.toLowerCase() === appointmentStatus.toLowerCase()
    
    const matchesType = typeFilter === 'All Types' ? true :
                       typeFilter.toLowerCase() === apt.appointmentType?.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Get status badge info
  const getStatusBadge = (apt) => {
    // Use new status field, fallback to old fields for backward compatibility
    const status = apt.status || (apt.cancelled ? 'cancelled' : apt.isCompleted ? 'completed' : apt.payment ? 'confirmed' : 'scheduled')
    
    switch(status) {
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-700' }
      case 'completed':
        return { text: 'Completed', color: 'bg-green-100 text-green-700' }
      case 'confirmed':
        return { text: 'Confirmed', color: 'bg-blue-100 text-blue-700' }
      case 'in-progress':
        return { text: 'In Progress', color: 'bg-yellow-100 text-yellow-700' }
      case 'scheduled':
      default:
        return { text: 'Scheduled', color: 'bg-gray-100 text-gray-700' }
    }
  }

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString()
  }

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.slotDate)
      return isSameDay(aptDate, date)
    })
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className='bg-white min-h-screen w-full px-6 pt-6'>
      <div className='w-full'>
        {/* Header */}
        <div className='mb-6 flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-1'>Appointment Management</h1>
            <p className='text-gray-600 text-sm'>Schedule, manage, and track patient appointments</p>
          </div>
          <button 
            onClick={() => setIsNewAppointmentModalOpen(true)}
            className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium shadow-sm transition-colors text-sm'
          >
            <Plus className='w-4 h-4' />
            New Appointment
          </button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center'>
            <p className='text-4xl font-bold text-blue-600 mb-2'>{stats.total}</p>
            <p className='text-gray-600 text-sm'>Total Appointments</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center'>
            <p className='text-4xl font-bold text-green-600 mb-2'>{stats.today}</p>
            <p className='text-gray-600 text-sm'>Today</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center'>
            <p className='text-4xl font-bold text-emerald-600 mb-2'>{stats.confirmed}</p>
            <p className='text-gray-600 text-sm'>Confirmed</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center'>
            <p className='text-4xl font-bold text-orange-600 mb-2'>{stats.pending}</p>
            <p className='text-gray-600 text-sm'>Pending</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center'>
            <p className='text-4xl font-bold text-gray-600 mb-2'>{stats.completed}</p>
            <p className='text-gray-600 text-sm'>Completed</p>
          </div>
        </div>

        {/* View Toggle and Search */}
        <div className='flex items-center justify-between mb-6 gap-4'>
          {/* View Toggle */}
          <div className='bg-gray-100 rounded-full p-1 flex'>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              Calendar View
            </button>
          </div>

          {/* Search and Filters */}
          <div className='flex items-center gap-3 flex-1 justify-end'>
            <div className='relative max-w-md flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='Search by patient name, phone, or symptoms...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white'
              />
            </div>
            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer'
              >
                <option>All Status</option>
                <option value='confirmed'>Confirmed</option>
                <option value='scheduled'>Scheduled</option>
                <option value='in-progress'>In Progress</option>
                <option value='completed'>Completed</option>
                <option value='cancelled'>Cancelled</option>
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none' />
            </div>
            <div className='relative'>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className='appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer'
              >
                <option>All Types</option>
                <option value='consultation'>Consultation</option>
                <option value='follow-up'>Follow-up</option>
                <option value='emergency'>Emergency</option>
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none' />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'list' ? (
          /* List View */
          <div className='space-y-4'>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((item, index) => {
                const status = getStatusBadge(item)
                const appointmentStatus = item.status || (item.cancelled ? 'cancelled' : item.isCompleted ? 'completed' : item.payment ? 'confirmed' : 'scheduled')
                const isCancelled = appointmentStatus === 'cancelled'
                const isCompleted = appointmentStatus === 'completed'
                
                return (
                  <div key={index} className={`rounded-xl border p-6 transition-shadow ${
                    isCancelled 
                      ? 'bg-gray-50 border-gray-300 opacity-70' 
                      : isCompleted
                      ? 'bg-white border-gray-200 hover:shadow-md'
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}>
                    <div className='flex gap-6'>
                      {/* First Section (Left) - Main Content */}
                      <div className='flex-1 pr-6'>
                        {/* Header */}
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 
                            className={`text-base font-normal cursor-pointer transition-colors ${
                              isCancelled 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900 hover:text-blue-600'
                            }`}
                            onClick={() => handlePatientClick(item.userData._id)}
                          >
                            {item.userData.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                          {item.isNewPatient && (
                            <span className='px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-300'>
                              New Patient
                            </span>
                          )}
                        </div>

                        {/* Info Row */}
                        <div className={`flex items-center text-sm font-light mb-2 ${
                          isCancelled ? 'text-gray-400 line-through' : 'text-gray-500'
                        }`}>
                          <span className='flex items-center gap-2 flex-1'>
                            <Calendar className='w-4 h-4' />
                            {slotDateFormat(item.slotDate)}
                          </span>
                          <span className='flex items-center gap-2 flex-1'>
                            <Clock className='w-4 h-4' />
                            {item.slotTime} ({item.duration || 45}min)
                          </span>
                          <span className='flex items-center gap-2 flex-1'>
                            <User className='w-4 h-4' />
                            {item.appointmentType || 'consultation'}
                          </span>
                          <span className='flex items-center gap-2 flex-1'>
                            <MapPin className='w-4 h-4' />
                            {item.locationType || 'clinic'}
                          </span>
                          <span className='flex-shrink-0 w-8'>
                            {/* Empty slot with minimal width */}
                          </span>
                        </div>

                        {/* Symptoms & Notes */}
                        {item.userData.symptoms && (
                          <div className='mb-2'>
                            <span className={`text-sm ${isCancelled ? 'text-gray-400' : 'text-gray-700'}`}>
                              <strong className='font-semibold'>Symptoms:</strong> {item.userData.symptoms}
                            </span>
                          </div>
                        )}
                        {item.userData.notes && (
                          <div className='mb-2'>
                            <span className='text-sm'>
                              <strong className={`font-semibold ${isCancelled ? 'text-gray-400' : 'text-gray-600'}`}>Notes:</strong>{' '}
                              <span className={isCancelled ? 'text-gray-400' : 'text-gray-500'}>{item.userData.notes}</span>
                            </span>
                          </div>
                        )}

                        {/* Contact & Payment Row */}
                        <div className={`flex items-center gap-6 text-sm mb-2 ${
                          isCancelled ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <span className='flex items-center gap-2'>
                            <Phone className='w-4 h-4' />
                            {item.userData.phone || '+91 98765 43210'}
                          </span>
                          <span className='flex items-center gap-2'>
                            <Mail className='w-4 h-4' />
                            {item.userData.email || 'email@example.com'}
                          </span>
                          <span className='flex items-center gap-2'>
                            <Wallet className='w-4 h-4' />
                            {currency}{item.amount}
                          </span>
                        </div>
                      </div>

                      {/* Second Section (Right) - Action Buttons */}
                      <div className='w-28 flex flex-col gap-1.5 justify-center'>
                        {isCancelled ? (
                          <div className='flex flex-col gap-2'>
                            <div className='text-center'>
                              <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-1' />
                              <span className='text-xs text-gray-400 font-medium'>Cancelled</span>
                            </div>
                            <button 
                              onClick={() => undoCancellation(item._id)}
                              className='w-full p-1 border border-blue-300 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1 text-blue-600'
                              title='Undo cancellation'
                            >
                              <Undo2 className='w-3 h-3' />
                              <span className='text-xs'>Undo</span>
                            </button>
                          </div>
                        ) : appointmentStatus === 'scheduled' ? (
                          <>
                            <button 
                              onClick={() => confirmAppointment(item._id)}
                              className='w-full px-1 py-1 bg-white border border-green-300 text-green-600 rounded-xl text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1'
                            >
                              <CheckCircle className='w-3 h-3' />
                              Confirm
                            </button>
                            <div className='grid grid-cols-2 gap-1.5'>
                              <button className='p-1 border border-blue-600 hover:bg-blue-50 rounded-xl transition-colors'>
                                <Mail className='w-4 h-4 text-blue-600 mx-auto' />
                              </button>
                              <button 
                                onClick={() => sendWhatsAppNotification(item)}
                                className='p-1 border border-green-600 hover:bg-green-50 rounded-xl transition-colors'
                                title='Send WhatsApp notification'
                              >
                                <MessageSquare className='w-4 h-4 text-green-600 mx-auto' />
                              </button>
                            </div>
                            <div className='grid grid-cols-2 gap-1.5'>
                              <button 
                                onClick={() => handleEditAppointment(item)}
                                className='p-1 border border-gray-600 hover:bg-gray-100 rounded-xl transition-colors'
                              >
                                <Edit className='w-4 h-4 text-gray-600 mx-auto' />
                              </button>
                              <button 
                                onClick={() => cancelAppointment(item._id)}
                                className='p-1 border border-red-600 hover:bg-red-50 rounded-xl transition-colors'
                              >
                                <X className='w-4 h-4 text-red-600 mx-auto' />
                              </button>
                            </div>
                          </>
                        ) : appointmentStatus === 'confirmed' ? (
                          <>
                            <button 
                              onClick={() => startAppointment(item._id)}
                              className='w-full px-1 py-1 bg-white border border-blue-600 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1'
                            >
                              <Clock className='w-3 h-3' />
                              Start
                            </button>
                            <div className='grid grid-cols-2 gap-1.5'>
                              <button className='p-1 border border-blue-600 hover:bg-blue-50 rounded-xl transition-colors'>
                                <Mail className='w-4 h-4 text-blue-600 mx-auto' />
                              </button>
                              <button 
                                onClick={() => sendWhatsAppNotification(item)}
                                className='p-1 border border-green-600 hover:bg-green-50 rounded-xl transition-colors'
                                title='Send WhatsApp notification'
                              >
                                <MessageSquare className='w-4 h-4 text-green-600 mx-auto' />
                              </button>
                            </div>
                            <div className='grid grid-cols-2 gap-1.5'>
                              <button 
                                onClick={() => handleEditAppointment(item)}
                                className='p-1 border border-gray-600 hover:bg-gray-100 rounded-xl transition-colors'
                              >
                                <Edit className='w-4 h-4 text-gray-600 mx-auto' />
                              </button>
                              <button 
                                onClick={() => cancelAppointment(item._id)}
                                className='p-1 border border-red-600 hover:bg-red-50 rounded-xl transition-colors'
                              >
                                <X className='w-4 h-4 text-red-600 mx-auto' />
                              </button>
                            </div>
                          </>
                        ) : appointmentStatus === 'in-progress' ? (
                          <>
                            <button 
                              onClick={() => completeAppointment(item._id)}
                              className='w-full px-1 py-1 bg-white border border-green-600 text-green-600 rounded-xl text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1'
                            >
                              <CheckCircle className='w-3 h-3' />
                              Complete
                            </button>
                            <div className='grid grid-cols-2 gap-1.5'>
                              <button className='p-1 border border-blue-600 hover:bg-blue-50 rounded-xl transition-colors'>
                                <Mail className='w-4 h-4 text-blue-600 mx-auto' />
                              </button>
                              <button 
                                onClick={() => sendWhatsAppNotification(item)}
                                className='p-1 border border-green-600 hover:bg-green-50 rounded-xl transition-colors'
                                title='Send WhatsApp notification'
                              >
                                <MessageSquare className='w-4 h-4 text-green-600 mx-auto' />
                              </button>
                            </div>
                          </>
                        ) : appointmentStatus === 'completed' ? (
                          <div className='text-center'>
                            <CheckCircle className='w-8 h-8 text-green-600 mx-auto mb-1' />
                            <span className='text-xs text-green-600 font-medium'>Completed</span>
                          </div>
                        ) : (
                          <div className='grid grid-cols-2 gap-1.5'>
                            <button className='p-1 border border-gray-200 rounded-xl cursor-not-allowed'>
                              <Mail className='w-4 h-4 text-gray-300 mx-auto' />
                            </button>
                            <button className='p-1 border border-gray-200 rounded-xl cursor-not-allowed'>
                              <MessageSquare className='w-4 h-4 text-gray-300 mx-auto' />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reminder Alert - Full Width */}
                    {appointmentStatus === 'scheduled' && (
                      <div className='mt-4'>
                        {!item.reminderSent ? (
                          <div className='bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 flex items-center gap-2'>
                            <AlertCircle className='w-4 h-4 text-yellow-600 flex-shrink-0' />
                            <span className='text-sm text-yellow-800 font-medium'>Reminder not sent yet</span>
                          </div>
                        ) : (
                          <div className='bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2'>
                            <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0' />
                            <div className='flex-1'>
                              <span className='text-sm text-green-800 font-medium'>Reminder sent</span>
                              {item.reminderSentAt && (
                                <span className='text-xs text-green-600 ml-2'>
                                  on {new Date(item.reminderSentAt).toLocaleDateString()} at {new Date(item.reminderSentAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className='text-center py-12'>
                <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No appointments found</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className='grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6'>
            {/* Calendar */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Select Date</h3>
              <div className='mb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <button onClick={prevMonth} className='p-2 hover:bg-gray-100 rounded-lg'>
                    <ChevronLeft className='w-5 h-5' />
                  </button>
                  <span className='text-lg font-semibold'>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={nextMonth} className='p-2 hover:bg-gray-100 rounded-lg'>
                    <ChevronRight className='w-5 h-5' />
                  </button>
                </div>
                <div className='grid grid-cols-7 gap-1 text-center text-sm mb-2'>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className='text-gray-600 font-medium py-2'>{day}</div>
                  ))}
                </div>
                <div className='grid grid-cols-7 gap-1'>
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      disabled={!day}
                      className={`py-2 text-sm rounded-lg transition-colors ${
                        !day ? 'invisible' :
                        isSameDay(day, selectedDate) ? 'bg-gray-900 text-white font-bold' :
                        isSameDay(day, new Date()) ? 'bg-gray-200 font-semibold' :
                        'hover:bg-gray-100'
                      }`}
                    >
                      {day?.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule for selected date */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Schedule for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <div className='space-y-4'>
                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  getAppointmentsForDate(selectedDate).map((item, index) => {
                    const status = getStatusBadge(item)
                    return (
                      <div key={index} className='border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center gap-3'>
                            <div className='text-lg font-bold text-gray-900'>{item.slotTime}</div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          <div className='flex gap-2'>
                            <button className='p-2 hover:bg-gray-100 rounded-lg'>
                              <Edit className='w-4 h-4 text-gray-600' />
                            </button>
                            <button className='p-2 hover:bg-gray-100 rounded-lg'>
                              <MessageSquare className='w-4 h-4 text-gray-600' />
                            </button>
                          </div>
                        </div>
                        <h4 
                          className='font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600'
                          onClick={() => handlePatientClick(item.userData._id)}
                        >
                          {item.userData.name}
                        </h4>
                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <span>consultation • 45min • clinic</span>
                        </div>
                        {item.userData.symptoms && (
                          <p className='text-sm text-gray-600 mt-2'>{item.userData.symptoms}</p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p>No appointments scheduled for this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      <PatientProfileModal 
        isOpen={isPatientModalOpen}
        onClose={closePatientModal}
        patientId={selectedPatientId}
      />

      {/* New/Edit Appointment Modal */}
      <NewAppointmentModal 
        isOpen={isNewAppointmentModalOpen}
        onClose={closeAppointmentModal}
        onSuccess={() => {
          getAppointments(true) // Force refresh appointments
          closeAppointmentModal()
        }}
        editingAppointment={editingAppointment}
      />
    </div>
  )
}

export default DoctorAppointments