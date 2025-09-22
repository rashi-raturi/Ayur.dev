import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [prescriptions, setPrescriptions] = useState([])

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    // Function to load user prescriptions
    const loadPrescriptions = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/prescriptions', { headers: { token } })
            if (data.success) {
                setPrescriptions(data.prescriptions)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to load prescriptions')
        }
    }

    // Load prescriptions on component mount
    useEffect(() => {
        if (token) {
            loadPrescriptions()
        }
    }, [token])

    // Function to update user profile data using API
    const updateUserProfileData = async () => {
        try {
            const formData = new FormData();

            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)

            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    return userData ? (
        <div className='min-h-screen flex gap-4'>
            {/* Left Half - Profile Information with Primary Background */}
            <div className='w-1/2 bg-primary p-8 rounded-lg'>
                <div className='max-w-lg flex flex-col gap-2 text-sm text-white'>
                    {isEdit
                        ? <label htmlFor='image' >
                            <div className='inline-block relative cursor-pointer'>
                                <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                                <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                            </div>
                            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                        </label>
                        : <img className='w-36 rounded' src={userData.image} alt="" />
                    }

                    {isEdit
                        ? <input className='bg-white/20 backdrop-blur text-3xl font-medium max-w-60 text-white placeholder-white/70 rounded px-3 py-2' type="text" onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))} value={userData.name} />
                        : <p className='font-medium text-3xl text-white mt-4'>{userData.name}</p>
                    }

                    <hr className='bg-white/30 h-[1px] border-none' />

                    <div>
                        <p className='text-white/80 underline mt-3'>CONTACT INFORMATION</p>
                        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-white'>
                            <p className='font-medium'>Email id:</p>
                            <p className='text-white/90'>{userData.email}</p>
                            <p className='font-medium'>Phone:</p>

                            {isEdit
                                ? <input className='bg-white/20 backdrop-blur max-w-52 text-white placeholder-white/70 rounded px-2 py-1' type="text" onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))} value={userData.phone} />
                                : <p className='text-white/90'>{userData.phone}</p>
                            }

                            <p className='font-medium'>Address:</p>

                            {isEdit
                                ? <div>
                                    <input className='bg-white/20 backdrop-blur text-white placeholder-white/70 rounded px-2 py-1 mb-2 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address.line1} />
                                    <input className='bg-white/20 backdrop-blur text-white placeholder-white/70 rounded px-2 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address.line2} />
                                </div>
                                : <p className='text-white/80'>{userData.address.line1} <br /> {userData.address.line2}</p>
                            }
                        </div>
                    </div>

                    <div>
                        <p className='text-white/80 underline mt-3'>BASIC INFORMATION</p>
                        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-white'>
                            <p className='font-medium'>Gender:</p>

                            {isEdit
                                ? <select className='max-w-20 bg-white/20 backdrop-blur text-white rounded px-2 py-1' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender} >
                                    <option value="Not Selected" className='text-black'>Not Selected</option>
                                    <option value="Male" className='text-black'>Male</option>
                                    <option value="Female" className='text-black'>Female</option>
                                </select>
                                : <p className='text-white/80'>{userData.gender}</p>
                            }

                            <p className='font-medium'>Birthday:</p>

                            {isEdit
                                ? <input className='max-w-28 bg-white/20 backdrop-blur text-white rounded px-2 py-1' type='date' onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
                                : <p className='text-white/80'>{userData.dob}</p>
                            }
                        </div>
                    </div>

                    <div className='mt-10'>
                        {isEdit
                            ? <button onClick={updateUserProfileData} className='border border-white px-8 py-2 rounded-full hover:bg-white hover:text-primary transition-all'>Save information</button>
                            : <button onClick={() => setIsEdit(true)} className='border border-white px-8 py-2 rounded-full hover:bg-white hover:text-primary transition-all'>Edit</button>
                        }
                    </div>
                </div>
            </div>

            {/* Right Half - View Prescriptions */}
            <div className='w-1/2 bg-gray-50 p-8 rounded-lg'>
                <div className='max-w-lg'>
                    <h2 className='text-3xl font-medium text-[#262626] mb-6'>Medical Records</h2>
                    
                    {/* Past Prescriptions Section */}
                    <div className='mb-8'>
                        <h3 className='text-xl font-bold text-gray-800 mb-6 flex items-center'>
                            <svg className='w-6 h-6 mr-3 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                            </svg>
                            My Prescriptions
                        </h3>
                        {prescriptions.length > 0 ? (
                            <div className='grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2'>
                                {prescriptions.map((prescription) => (
                                    <div key={prescription._id} className='bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300'>
                                        <div className='flex items-start justify-between'>
                                            <div className='flex items-start space-x-4 flex-1'>
                                                {/* Medical Icon */}
                                                <div className='w-12 h-12 bg-gradient-to-r from-green-100 to-green-50 rounded-full flex items-center justify-center flex-shrink-0'>
                                                    <svg className='h-6 w-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                        <path fillRule='evenodd' d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z' clipRule='evenodd' />
                                                        <path d='M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM8 12a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' />
                                                    </svg>
                                                </div>
                                                
                                                {/* Prescription Details */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center space-x-2 mb-2'>
                                                        <h4 className='text-lg font-semibold text-gray-900 truncate'>
                                                            {prescription.patientName ? `Prescription for ${prescription.patientName}` : 'Medical Prescription'}
                                                        </h4>
                                                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                            Active
                                                        </span>
                                                    </div>
                                                    
                                                    <div className='space-y-2'>
                                                        <div className='flex items-center text-sm text-gray-600'>
                                                            <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                                            </svg>
                                                            <span>Uploaded: {new Date(prescription.createdAt || prescription.uploadDate).toLocaleDateString('en-US', { 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}</span>
                                                        </div>
                                                        
                                                        {prescription.doctorName && (
                                                            <div className='flex items-center text-sm text-gray-600'>
                                                                <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                                                </svg>
                                                                <span>Dr. {prescription.doctorName}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {prescription.medicine && prescription.medicine.length > 0 && (
                                                            <div className='space-y-2'>
                                                                <div className='flex items-center text-sm text-green-600 mb-3'>
                                                                    <svg className='w-4 h-4 mr-2 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                                                                    </svg>
                                                                    <span className='font-medium'>Prescribed Medications:</span>
                                                                </div>
                                                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto'>
                                                                    {prescription.medicine.map((medication, medIndex) => {
                                                                        let medName = '';
                                                                        let dosage = '';
                                                                        let frequency = '';
                                                                        
                                                                        if (typeof medication === 'string') {
                                                                            medName = medication;
                                                                        } else if (typeof medication === 'object') {
                                                                            medName = medication.name || medication.medicine || '';
                                                                            dosage = medication.dosage || '';
                                                                            frequency = medication.frequency || '';
                                                                        }
                                                                        
                                                                        if (medName && medName.trim()) {
                                                                            return (
                                                                                <div 
                                                                                    key={medIndex}
                                                                                    className='bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200 hover:border-green-300'
                                                                                >
                                                                                    <div className='flex items-start space-x-2'>
                                                                                        <div className='w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                                                            <svg className='w-3 h-3 text-green-700' fill='currentColor' viewBox='0 0 20 20'>
                                                                                                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div className='flex-1 min-w-0'>
                                                                                            <h5 className='text-sm font-semibold text-green-800 truncate'>
                                                                                                {medName}
                                                                                            </h5>
                                                                                            {dosage && (
                                                                                                <p className='text-xs text-green-600 mt-1'>
                                                                                                    <span className='font-medium'>Dosage:</span> {dosage}
                                                                                                </p>
                                                                                            )}
                                                                                            {frequency && (
                                                                                                <p className='text-xs text-green-600'>
                                                                                                    <span className='font-medium'>Frequency:</span> {frequency}
                                                                                                </p>
                                                                                            )}
                                                                                            {!dosage && !frequency && (
                                                                                                <p className='text-xs text-green-600 mt-1'>
                                                                                                    As prescribed by doctor
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }).filter(Boolean)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action Button */}
                                            <div className='flex flex-col space-y-2 ml-4'>
                                                {prescription.filePath || prescription.fileUrl ? (
                                                    <a 
                                                        href={prescription.fileUrl || `${backendUrl}${prescription.filePath}`}
                                                        target='_blank' 
                                                        rel='noopener noreferrer'
                                                        className='inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors'
                                                    >
                                                        <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                        </svg>
                                                        View PDF
                                                    </a>
                                                ) : (
                                                    <span className='inline-flex items-center px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-md'>
                                                        <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728' />
                                                        </svg>
                                                        No file
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200'>
                                <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                                    <svg className='w-12 h-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                    </svg>
                                </div>
                                <h3 className='text-lg font-medium text-gray-900 mb-2'>No prescriptions yet</h3>
                                <p className='text-gray-500 max-w-sm mx-auto'>Your medical prescriptions will appear here when doctors upload them to your profile.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ) : null
}

export default MyProfile