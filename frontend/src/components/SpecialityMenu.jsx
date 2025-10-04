import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
    return (
        <div id='speciality' className='w-full py-20 bg-white'>
            <div className='max-w-[1400px] mx-auto px-6'>
                <div className='text-center max-w-3xl mx-auto mb-16'>
                    <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>Find by Speciality</h2>
                    <p className='text-lg text-gray-600'>Browse through our extensive list of trusted Ayurvedic specialists</p>
                </div>
                <div className='flex justify-center'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 max-w-4xl'>
                        {specialityData.map((item, index) => (
                            <Link 
                                to={`/doctors/${item.speciality}`} 
                                onClick={() => scrollTo(0, 0)} 
                                className='flex flex-col items-center text-center cursor-pointer group' 
                                key={index}
                            >
                                <div className='w-28 h-28 mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center p-5 group-hover:border-gray-300 group-hover:shadow-xl transition-all duration-300 group-hover:scale-105'>
                                    <img className='w-full h-full object-contain' src={item.image} alt={item.speciality} />
                                </div>
                                <p className='font-semibold text-sm text-gray-700 group-hover:text-gray-900 transition-colors'>{item.speciality}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SpecialityMenu