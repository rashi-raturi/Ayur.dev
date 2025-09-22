import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import PatientProfileModal from './PatientProfileModal'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  
  // State for patient profile modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

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

  return (
    <div className='w-full h-screen p-5 bg-yellow-100'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" />
              <p 
                className='cursor-pointer hover:text-primary hover:underline transition-colors'
                onClick={() => handlePatientClick(item.userData._id)}
              >
                {item.userData.name}
              </p>
            </div>
            <div>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.payment?'Online':'CASH'}
              </p>
            </div>
            <p className='max-sm:hidden'>
              {item.userData.dob ? (
                (() => {
                  const age = calculateAge(item.userData.dob);
                  return !isNaN(age) && age > 0 ? age : 'N/A';
                })()
              ) : 'N/A'}
            </p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <div className='flex'>
                  <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                  <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                </div>
            }
          </div>
        ))}
      </div>

      {/* Patient Profile Modal */}
      <PatientProfileModal 
        isOpen={isPatientModalOpen}
        onClose={closePatientModal}
        patientId={selectedPatientId}
      />

    </div>
  )
}

export default DoctorAppointments