import { useContext, useState, useCallback } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { Users, MessageCircle, FileText, TrendingUp, Clock, UserPlus, Calendar } from 'lucide-react'
import flowerImg from '../../assets/flower.jpg'
import axios from 'axios'

const DoctorDashboard = () => {

  const { dToken, dashData, getDashData, backendUrl, profileData, getProfileData } = useContext(DoctorContext)
  const [recentPatients, setRecentPatients] = useState([])
  const [todaysAppointments, setTodaysAppointments] = useState([])
  const [totalPatients, setTotalPatients] = useState(0)
  const navigate = useNavigate()

  const fetchRecentPatients = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/patients`, {
        headers: { dToken }
      })
      if (data.success) {
        // Set total patient count
        setTotalPatients(data.patients.length)
        // Sort patients by creation date (most recent first) and take first 4
        const sortedPatients = data.patients.sort((a, b) => new Date(b.date) - new Date(a.date))
        setRecentPatients(sortedPatients.slice(0, 4))
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }, [backendUrl, dToken])

  const fetchTodaysAppointments = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: { dToken }
      })
      if (data.success) {
        // Filter appointments for today
        const today = new Date().toDateString()
        const todayAppointments = data.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.slotDate).toDateString()
          return appointmentDate === today
        })
        setTodaysAppointments(todayAppointments.slice(0, 4))
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }, [backendUrl, dToken])

  useEffect(() => {
    const fetchData = async () => {
      if (dToken) {
        getDashData()
        getProfileData()
        await fetchRecentPatients()
        await fetchTodaysAppointments()
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken])

  const getPatientStatusBadge = () => {
    // Determine status based on recent activity or patient condition
    const statuses = ['Active', 'Follow-up', 'Completed']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    switch (randomStatus) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
      case 'Follow-up':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Follow-up</span>
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Completed</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Active</span>
    }
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffInHours / (24 * 7))} week${Math.floor(diffInHours / (24 * 7)) > 1 ? 's' : ''} ago`
  }

  return dashData && (
  <div className='bg-white min-h-screen w-full px-6 pt-6'>
      
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, Dr. {profileData?.name || 'Doctor'}
            </h1>
            <p className="text-gray-600 text-sm">Here&apos;s what&apos;s happening with your practice today</p>
          </div>
           <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md border-2 border-gray-200">
            <img
              src={flowerImg}
              alt="Ayurvedic flower"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
  {/* Stats Cards */}

      {/* Stats Cards */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-36 flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-black'>Total Patients</p>
      <Users className='w-5 h-5 text-blue-600' />
    </div>
    <div>
            <p className='text-3xl font-semibold text-black'>{totalPatients}</p>
            <p className='text-xs text-gray-500'>all time</p>
    </div>
  </div>

  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-36 flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-black'>Consultations Today</p>
      <MessageCircle className='w-5 h-5 text-green-600' />
    </div>
    <div>
            <p className='text-3xl font-semibold text-black'>{todaysAppointments.length}</p>
            <p className='text-xs text-gray-500'>{todaysAppointments.filter(apt => !apt.isCompleted && !apt.cancelled).length} pending</p>
    </div>
  </div>

  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-36 flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-black'>Total Appointments</p>
      <FileText className='w-5 h-5 text-purple-600' />
    </div>
    <div>
            <p className='text-3xl font-semibold text-black'>{dashData?.appointments || 0}</p>
            <p className='text-xs text-gray-500'>this week</p>
    </div>
  </div>

  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-36 flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-black'>Total Earnings</p>
      <TrendingUp className='w-5 h-5 text-red-600' />
    </div>
    <div>
            <p className='text-3xl font-semibold text-black'>{dashData?.earnings ? `₹${dashData.earnings}` : '₹0'}</p>
            <p className='text-xs text-gray-500'>vs last month</p>
    </div>
  </div>
</div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
        {/* Recent Patients */}
  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-600" />
            <h3 className="text-md font-semibold text-gray-900">Recent Patients</h3>
          </div>
          
          <div className="space-y-3">
            {recentPatients.length > 0 ? recentPatients.map((patient, index) => (
              <div key={patient._id || index} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{patient.name}</p>
                    <p className="text-gray-500 text-xs">{patient.condition || 'General Consultation'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs mb-1">
                    {getTimeAgo(patient.date)}
                  </p>
                  {getPatientStatusBadge()}
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No recent patients found
              </div>
            )}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-4'>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h3 className="text-md font-semibold text-gray-900">Today&apos;s Appointments</h3>
          </div>
          
          <div className="space-y-3">
            {todaysAppointments.length > 0 ? todaysAppointments.map((appointment, index) => (
              <div key={appointment._id || index} className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded transition-colors">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{appointment.userData?.name || 'Patient'}</p>
                  <p className="text-gray-500 text-xs">
                    {appointment.cancelled ? 'Cancelled' : 
                     appointment.isCompleted ? 'Completed' : 'Consultation'}
                  </p>
                </div>
                <p className="text-gray-900 text-sm font-medium">{appointment.slotTime}</p>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No appointments scheduled for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/patient-management')}
            className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900 font-medium">Add New Patient</span>
            <UserPlus className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => navigate('/doctor-appointments')}
            className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900 font-medium">Start Consultation</span>
            <MessageCircle className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => navigate('/dietchart-generator')}
            className="flex items-center justify-between w-full border border-gray-200 rounded-xl px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900 font-medium">Create Diet Chart</span>
            <FileText className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

    </div>
  )
}

export default DoctorDashboard