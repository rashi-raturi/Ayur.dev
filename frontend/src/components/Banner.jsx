import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'

const Banner = () => {

    const navigate = useNavigate()

    return (
        <div className='w-full py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'>
            <div className='max-w-[1400px] mx-auto px-6'>
                <div className='flex flex-col md:flex-row items-center justify-between gap-12'>
                    {/* ------- Left Side ------- */}
                    <div className='flex-1 text-center md:text-left'>
                        <div className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight'>
                            <p>Book Appointment</p>
                            <p className='mt-2'>With Trusted Doctors</p>
                        </div>
                        <p className='text-gray-700 mt-6 text-lg max-w-xl'>
                            Schedule hassle-free consultations with experienced Ayurvedic practitioners who understand your unique health needs.
                        </p>
                        <a href="#speciality">
                            <button className="bg-gray-900 text-white text-base font-semibold px-8 py-4 rounded-xl mt-8 hover:bg-gray-800 hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 group">
                                <Calendar className="w-5 h-5" />
                                Book Appointment
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </a>
                    </div>

                    {/* ------- Right Side ------- */}
                    <div className='hidden md:block w-full md:w-[45%] lg:w-[400px]'>
                        <img className='w-full object-contain drop-shadow-2xl' src={assets.appointment_img} alt="Book appointment" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Banner