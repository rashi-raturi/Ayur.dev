import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Award, Calendar, Clock, MapPin, Verified, Info, CheckCircle, ChevronLeft } from 'lucide-react'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {

        setDocSlots([])

        // getting current date
        let today = new Date()

        for (let i = 0; i < 7; i++) {

            // getting date with index 
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // setting end time of the date with index
            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(21, 0, 0, 0)

            // setting hours 
            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = [];


            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year
                const slotTime = formattedTime

                // Check if slots_booked exists and has the date key, otherwise treat all slots as available
                const isSlotAvailable = (docInfo.slots_booked && docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime)) ? false : true

                if (isSlotAvailable) {

                    // Add slot to array
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    })
                }

                // Increment current time by 30 minutes
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }

            setDocSlots(prev => ([...prev, timeSlots]))

        }

    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        const date = docSlots[slotIndex][0].datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day + "_" + month + "_" + year

        try {

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    return docInfo ? (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Doctors</span>
                </button>

                {/* ---------- Doctor Details Card ----------- */}
                <div className='bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm mb-8'>
                    <div className='flex flex-col lg:flex-row gap-6 p-6'>
                        
                        {/* Doctor Image */}
                        <div className="flex-shrink-0">
                            <div className='relative w-full lg:w-64 h-64 lg:h-72 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50'>
                                <img className='w-full h-full object-cover' src={docInfo.image} alt={docInfo.name} />
                            </div>
                        </div>

                        {/* Doctor Info */}
                        <div className='flex-1 space-y-4'>
                            
                            {/* Name and Verification */}
                            <div>
                                <div className='flex items-center gap-2 mb-2'>
                                    <h1 className='text-3xl font-bold text-gray-900'>{docInfo.name}</h1>
                                    <div className="bg-blue-100 p-1 rounded-full">
                                        <CheckCircle className='w-5 h-5 text-blue-600' />
                                    </div>
                                </div>
                                
                                {/* Degree and Speciality */}
                                <div className='flex flex-wrap items-center gap-3 text-gray-600'>
                                    <div className="flex items-center gap-2">
                                        <Award className='w-4 h-4 text-gray-900' />
                                        <span className="font-medium">{docInfo.degree}</span>
                                    </div>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium">{docInfo.speciality}</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 text-sm font-semibold rounded-full">
                                        {docInfo.experience}
                                    </span>
                                </div>
                            </div>

                            {/* About Section */}
                            <div className='pt-3 border-t border-gray-100'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <Info className='w-4 h-4 text-gray-900' />
                                    <h3 className='text-sm font-semibold text-gray-900'>About</h3>
                                </div>
                                <p className='text-sm text-gray-600 leading-relaxed'>{docInfo.about}</p>
                            </div>

                            {/* Appointment Fee */}
                            <div className='pt-3 border-t border-gray-100'>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl">
                                    <span className="text-sm font-medium">Appointment Fee:</span>
                                    <span className="text-lg font-bold">{currencySymbol}{docInfo.fees}</span>
                                </div>
                            </div>

                            {/* Address if available */}
                            {docInfo.address && (
                                <div className='flex items-start gap-2 text-gray-600 pt-2'>
                                    <MapPin className='w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0' />
                                    <div className="text-sm">
                                        <p>{docInfo.address.line1}</p>
                                        {docInfo.address.line2 && <p>{docInfo.address.line2}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Slots Section */}
                <div className='bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm mb-8'>
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="w-5 h-5 text-gray-900" />
                        <h2 className='text-2xl font-bold text-gray-900'>Select Appointment Slot</h2>
                    </div>

                    {/* Date Selection */}
                    <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Select Date</p>
                        <div className='flex gap-3 items-center w-full overflow-x-auto pb-2'>
                            {docSlots.length > 0 && docSlots.map((item, index) => (
                                <button 
                                    onClick={() => {setSlotIndex(index); setSlotTime('')}}
                                    key={index} 
                                    className={`flex flex-col items-center justify-center min-w-[80px] py-4 px-3 rounded-xl font-medium transition-all ${
                                        slotIndex === index 
                                            ? 'bg-gray-900 text-white shadow-lg scale-105' 
                                            : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-900'
                                    }`}
                                >
                                    <span className='text-xs mb-1 opacity-80'>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</span>
                                    <span className='text-2xl font-bold'>{item[0] && item[0].datetime.getDate()}</span>
                                    <span className='text-xs mt-1 opacity-80'>
                                        {item[0] && item[0].datetime.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    {docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex].length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">Select Time</p>
                            <div className='flex items-center gap-3 w-full overflow-x-auto pb-2'>
                                {docSlots[slotIndex].map((item, index) => (
                                    <button 
                                        onClick={() => setSlotTime(item.time)}
                                        key={index} 
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                                            item.time === slotTime 
                                                ? 'bg-gray-900 text-white shadow-md' 
                                                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-900'
                                        }`}
                                    >
                                        <Clock className="w-4 h-4" />
                                        {item.time.toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No slots message */}
                    {docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex].length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">No available slots for this date</p>
                            <p className="text-gray-500 text-sm mt-1">Please select another date</p>
                        </div>
                    )}

                    {/* Book Appointment Button */}
                    {slotTime && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <button 
                                onClick={bookAppointment} 
                                className='w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg flex items-center justify-center gap-2'
                            >
                                <CheckCircle className="w-5 h-5" />
                                Book Appointment
                            </button>
                        </div>
                    )}
                </div>

                {/* Listing Related Doctors */}
                <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
            </div>
        </div>
    ) : null
}

export default Appointment