import { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  // Include getDashData to satisfy lint
  }, [aToken, getDashData])

  // only render once data is loaded
  if (!dashData) return null

  return (
    <div className="p-5 bg-yellow-100 w-full h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Doctors */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow transition">
          <img className="w-10" src={assets.doctor_icon} alt="Doctors" />
          <div>
            <p className="text-2xl font-semibold text-gray-800">{dashData.doctors}</p>
            <p className="text-sm text-gray-500">Doctors</p>
          </div>
        </div>
        {/* Appointments */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow transition">
          <img className="w-10" src={assets.appointments_icon} alt="Appointments" />
          <div>
            <p className="text-2xl font-semibold text-gray-800">{dashData.appointments}</p>
            <p className="text-sm text-gray-500">Appointments</p>
          </div>
        </div>
        {/* Patients */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow transition">
          <img className="w-10" src={assets.patients_icon} alt="Patients" />
          <div>
            <p className="text-2xl font-semibold text-gray-800">{dashData.patients}</p>
            <p className="text-sm text-gray-500">Patients</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
          <div className="flex items-center gap-2">
            <img src={assets.list_icon} alt="Latest Bookings" />
            <p className="text-lg font-semibold text-gray-700">Latest Bookings</p>
          </div>
          {/* Optionally add 'View All' link here */}
        </div>
        <div className="divide-y">
          {dashData.latestAppointments.slice(0, 5).map((item, idx) => (
            <div key={idx} className="grid grid-cols-[auto,1fr,auto] items-center px-4 py-2 hover:bg-gray-50 transition">
              <img className="w-8 h-8 rounded-full object-cover" src={item.docData.image} alt="Doctor" />
              <div className="pl-4">
                <p className="text-gray-800 font-medium text-sm">{item.docData.name}</p>
                <p className="text-gray-600 text-xs">Booked on {slotDateFormat(item.slotDate)}</p>
              </div>
              <div className="text-right">
                {item.cancelled ? (
                  <span className="text-red-500 text-sm font-medium">Cancelled</span>
                ) : item.isCompleted ? (
                  <span className="text-green-500 text-sm font-medium">Completed</span>
                ) : (
                  <button onClick={() => cancelAppointment(item._id)} className="text-red-500 hover:text-red-700">
                    <img className="w-5 h-5 inline-block" src={assets.cancel_icon} alt="Cancel" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard