import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { Calendar, MapPin, Clock, CreditCard, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react'

const MyAppointments = () => {

    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [payment, setPayment] = useState('')

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }   

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }



    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                        My Appointments
                    </h1>
                    <p className="text-lg text-gray-600">
                        Manage and track your healthcare appointments
                    </p>
                </div>

                {/* Appointments List */}
                {appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments yet</h3>
                        <p className="text-gray-500 mb-6">Book your first appointment with our expert practitioners</p>
                        <button 
                            onClick={() => navigate('/doctors')}
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
                        >
                            Find Doctors
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((item, index) => {
                            // Safety check for docId (populated doctor data)
                            if (!item.docId) {
                                return null
                            }
                            
                            return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        
                                        {/* Doctor Image */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                                                <img 
                                                    className="w-full h-full object-cover" 
                                                    src={item.docId.image} 
                                                    alt={item.docId.name}
                                                />
                                            </div>
                                        </div>

                                        {/* Appointment Details */}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {item.docId.name}
                                                </h3>
                                                <p className="text-gray-600">{item.docId.speciality}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-4">
                                                {/* Date & Time */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Calendar className="w-4 h-4 text-gray-900" />
                                                    <span className="text-sm font-medium">{slotDateFormat(item.slotDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Clock className="w-4 h-4 text-gray-900" />
                                                    <span className="text-sm font-medium">{item.slotTime}</span>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {item.docId.address && (
                                            <div className="flex items-start gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm">
                                                    <p>{item.docId.address.line1}</p>
                                                    {item.docId.address.line2 && <p>{item.docId.address.line2}</p>}
                                                </div>
                                            </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2">
                                                {item.isCompleted && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-900 text-xs font-semibold rounded-full">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Completed
                                                    </span>
                                                )}
                                                {item.cancelled && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                                                        <XCircle className="w-4 h-4" />
                                                        Cancelled
                                                    </span>
                                                )}
                                                {item.payment && !item.isCompleted && !item.cancelled && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Paid
                                                    </span>
                                                )}
                                                {!item.payment && !item.isCompleted && !item.cancelled && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                                                        <AlertCircle className="w-4 h-4" />
                                                        Payment Pending
                                                    </span>
                                                )}
                                            </div>

                                            {/* Patient Reports */}
                                            {item.reports && item.reports.length > 0 && (
                                                <div className="pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="w-4 h-4 text-gray-900" />
                                                        <p className="font-semibold text-gray-900 text-sm">Reports:</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.reports.map((report, idx) => (
                                                            <a 
                                                                key={idx}
                                                                href={report.url} 
                                                                target='_blank' 
                                                                rel='noopener noreferrer'
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs rounded-lg transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                {report.title}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                            {/* Pay Online Button */}
                                            {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                                                <button 
                                                    onClick={() => setPayment(item._id)} 
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Pay Online
                                                </button>
                                            )}

                                            {/* Stripe Payment Button */}
                                            {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                                                <button 
                                                    onClick={() => appointmentStripe(item._id)} 
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                                                >
                                                    <img className='h-5' src={assets.stripe_logo} alt="Stripe" />
                                                </button>
                                            )}

                                            {/* Cancel Appointment Button */}
                                            {!item.cancelled && !item.isCompleted && (
                                                <button 
                                                    onClick={() => cancelAppointment(item._id)} 
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyAppointments
