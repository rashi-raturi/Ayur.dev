import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [prescriptions, setPrescriptions] = useState([])
    const [dietCharts, setDietCharts] = useState([])

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

    const loadDietCharts = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/diet-charts', { headers: { token } })
            if (data.success) {
                setDietCharts(data.dietCharts)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to load diet charts')
        }
    }

    // Load prescriptions on component mount
    useEffect(() => {
        if (token) {
            loadPrescriptions()
            loadDietCharts()
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
        <div className='min-h-screen'>
            <div className='w-full bg-primary rounded-lg p-4 sm:p-6 lg:p-8 text-white flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[300px]'>
                {/* Column 1: Profile photo and edit button */}
                <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-center lg:items-center flex-shrink-0 w-full sm:w-auto lg:w-48 gap-4">
                    {/* Profile photo */}
                    <div className="flex justify-center">
                        {isEdit ? (
                            <label htmlFor="image" className="cursor-pointer inline-block relative">
                                <img
                                    className="w-28 sm:w-32 lg:w-36 rounded opacity-75"
                                    src={image ? URL.createObjectURL(image) : userData.image}
                                    alt="Profile"
                                />
                                {!image && (
                                    <img
                                        className="w-8 sm:w-10 absolute bottom-8 sm:bottom-10 lg:bottom-12 right-8 sm:right-10 lg:right-12"
                                        src={assets.upload_icon}
                                        alt="Upload"
                                    />
                                )}
                                <input
                                    onChange={(e) => setImage(e.target.files[0])}
                                    type="file"
                                    id="image"
                                    hidden
                                />
                            </label>
                        ) : (
                            <img className="w-28 sm:w-32 lg:w-36 rounded" src={userData.image} alt="Profile" />
                        )}
                    </div>
                    {/* Edit button */}
                    <div className="w-full sm:flex-1 lg:w-full">
                        {isEdit ? (
                            <button
                                onClick={updateUserProfileData}
                                className="w-full border border-white px-4 py-2 rounded-full hover:bg-white hover:text-primary transition-all text-sm sm:text-base"
                            >
                                Save information
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEdit(true)}
                                className="w-full border border-white px-4 py-2 rounded-full hover:bg-white hover:text-primary transition-all text-sm sm:text-base"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Column 2: Name, Email, Phone */}
                <div className="flex flex-col justify-center gap-3 sm:gap-4 flex-1">
                    {isEdit ? (
                        <>
                            <input
                                className="bg-white/20 backdrop-blur text-2xl sm:text-3xl font-medium w-full text-white placeholder-white/70 rounded px-3 py-2"
                                type="text"
                                onChange={(e) =>
                                    setUserData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                value={userData.name}
                            />
                            <div>
                                <p className="font-medium text-sm sm:text-base">Email id: </p>
                                <p className="text-white/90 text-sm sm:text-base break-all">{userData.email}</p>
                            </div>
                            <div>
                                <p className="font-medium text-sm sm:text-base">Phone:</p>
                                <input
                                    className="bg-white/20 backdrop-blur w-full text-white placeholder-white/70 rounded px-2 py-1 text-sm sm:text-base"
                                    type="text"
                                    onChange={(e) =>
                                        setUserData((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                    value={userData.phone}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="font-medium text-2xl sm:text-3xl lg:text-4xl">{userData.name}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="font-medium text-sm sm:text-base">Email id:</p>
                                <p className="text-white/90 text-sm sm:text-base break-all">{userData.email}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="font-medium text-sm sm:text-base">Phone:</p>
                                <p className="text-white/90 text-sm sm:text-base">{userData.phone}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Column 3: Address, Gender, Birthday */}
                <div className="flex flex-col justify-center flex-1 gap-3 sm:gap-4 text-sm">
                    <div>
                        {isEdit ? (
                            <>
                                <p className="font-medium mb-2">Address:</p>
                                <input
                                    className="bg-white/20 backdrop-blur text-white placeholder-white/70 rounded px-2 py-1 mb-2 w-full"
                                    type="text"
                                    onChange={(e) =>
                                        setUserData((prev) => ({
                                            ...prev,
                                            address: { ...prev.address, line1: e.target.value },
                                        }))
                                    }
                                    value={userData.address.line1}
                                />
                                <input
                                    className="bg-white/20 backdrop-blur text-white placeholder-white/70 rounded px-2 py-1 w-full"
                                    type="text"
                                    onChange={(e) =>
                                        setUserData((prev) => ({
                                            ...prev,
                                            address: { ...prev.address, line2: e.target.value },
                                        }))
                                    }
                                    value={userData.address.line2}
                                />
                            </>
                        ) : (
                            <>
                                <p className="font-medium">Address:</p>
                                <p className="text-white/80">
                                    {userData?.address?.line1} <br /> {userData?.address?.line2}
                                </p>
                            </>
                        )}
                    </div>

                    <div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-white items-center">
                            <p className="font-medium">Gender:</p>
                            {isEdit ? (
                                <select
                                    className="bg-white/20 backdrop-blur text-white rounded px-2 py-1 w-full max-w-[140px]"
                                    onChange={(e) =>
                                        setUserData((prev) => ({ ...prev, gender: e.target.value }))
                                    }
                                    value={userData.gender}
                                >
                                    <option value="Not Selected" className="text-black">
                                        Not Selected
                                    </option>
                                    <option value="Male" className="text-black">
                                        Male
                                    </option>
                                    <option value="Female" className="text-black">
                                        Female
                                    </option>
                                </select>
                            ) : (
                                <p className="text-white/80">{userData.gender}</p>
                            )}

                            <p className="font-medium">Birthday:</p>
                            {isEdit ? (
                                <input
                                    className="bg-white/20 backdrop-blur text-white rounded px-2 py-1 w-full max-w-[140px]"
                                    type="date"
                                    onChange={(e) =>
                                        setUserData((prev) => ({ ...prev, dob: e.target.value }))
                                    }
                                    value={userData.dob}
                                />
                            ) : (
                                <p className="text-white/80">{userData.dob}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className='mt-8 px-2 sm:px-0'>
                <h2 className='text-2xl sm:text-3xl font-medium text-[#262626] mb-4 sm:mb-6'>Medical Records</h2>
                <div className='flex flex-col lg:flex-row gap-4 lg:gap-3'>
                    {/* Prescription Section*/}
                    <div className='w-full lg:w-1/2 bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg'>
                        <div className='mb-8'>
                            <h3 className='text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center'>
                                <svg className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-green-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                                </svg>
                                My Prescriptions
                            </h3>
                            {prescriptions.length > 0 ? (
                                <div className='grid grid-cols-1 gap-3 sm:gap-4 max-h-[500px] lg:max-h-96 overflow-y-auto pr-1 sm:pr-2'>
                                    {prescriptions.map((prescription) => (
                                        <div key={prescription._id} className='bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300'>
                                            <div className='flex flex-col sm:flex-row items-start justify-between gap-4'>
                                                <div className='flex items-start space-x-3 sm:space-x-4 flex-1 w-full'>
                                                    {/* Medical Icon */}
                                                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-green-50 rounded-full flex items-center justify-center flex-shrink-0'>
                                                        <svg className='h-5 w-5 sm:h-6 sm:w-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z' clipRule='evenodd' />
                                                            <path d='M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM8 12a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' />
                                                        </svg>
                                                    </div>
                                                    
                                                    {/* Prescription Details */}
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                                                            <h4 className='text-base sm:text-lg font-semibold text-gray-900 break-words'>
                                                                {prescription.patientName ? `Prescription for ${prescription.patientName}` : 'Medical Prescription'}
                                                            </h4>
                                                            <span className='inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap'>
                                                                Active
                                                            </span>
                                                        </div>
                                                        
                                                        <div className='space-y-2'>
                                                            <div className='flex items-center text-xs sm:text-sm text-gray-600'>
                                                                <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                                                </svg>
                                                                <span className='break-words'>Uploaded: {new Date(prescription.createdAt || prescription.uploadDate).toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'long', 
                                                                    day: 'numeric' 
                                                                })}</span>
                                                            </div>
                                                            
                                                            {prescription.doctorName && (
                                                                <div className='flex items-center text-xs sm:text-sm text-gray-600'>
                                                                    <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                                                    </svg>
                                                                    <span className='break-words'>Dr. {prescription.doctorName}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {prescription.medicine && prescription.medicine.length > 0 && (
                                                                <div className='space-y-2'>
                                                                    <div className='flex items-center text-xs sm:text-sm text-green-600 mb-2 sm:mb-3'>
                                                                        <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                                                                        </svg>
                                                                        <span className='font-medium'>Prescribed Medications:</span>
                                                                    </div>
                                                                    <div className='grid grid-cols-1 gap-2 max-h-32 overflow-y-auto'>
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
                                                                                        className='bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-2.5 sm:p-3 hover:shadow-sm transition-all duration-200 hover:border-green-300'
                                                                                    >
                                                                                        <div className='flex items-start space-x-2'>
                                                                                            <div className='w-5 h-5 sm:w-6 sm:h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                                                                <svg className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-700' fill='currentColor' viewBox='0 0 20 20'>
                                                                                                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                                                                                </svg>
                                                                                            </div>
                                                                                            <div className='flex-1 min-w-0'>
                                                                                                <h5 className='text-xs sm:text-sm font-semibold text-green-800 break-words'>
                                                                                                    {medName}
                                                                                                </h5>
                                                                                                {dosage && (
                                                                                                    <p className='text-[10px] sm:text-xs text-green-600 mt-1'>
                                                                                                        <span className='font-medium'>Dosage:</span> {dosage}
                                                                                                    </p>
                                                                                                )}
                                                                                                {frequency && (
                                                                                                    <p className='text-[10px] sm:text-xs text-green-600'>
                                                                                                        <span className='font-medium'>Frequency:</span> {frequency}
                                                                                                    </p>
                                                                                                )}
                                                                                                {!dosage && !frequency && (
                                                                                                    <p className='text-[10px] sm:text-xs text-green-600 mt-1'>
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
                                                <div className='flex flex-col space-y-2 w-full sm:w-auto sm:ml-4'>
                                                    {prescription.filePath || prescription.fileUrl ? (
                                                        <a 
                                                            href={prescription.fileUrl || `${backendUrl}${prescription.filePath}`}
                                                            target='_blank' 
                                                            rel='noopener noreferrer'
                                                            className='inline-flex items-center justify-center px-3 py-2 border border-green-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors whitespace-nowrap'
                                                        >
                                                            <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                            </svg>
                                                            View PDF
                                                        </a>
                                                    ) : (
                                                        <span className='inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm text-gray-400 bg-gray-50 rounded-md whitespace-nowrap'>
                                                            <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                                <div className='text-center py-8 sm:py-12 bg-white rounded-xl border-2 border-dashed border-gray-200'>
                                    <div className='mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4'>
                                        <svg className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                        </svg>
                                    </div>
                                    <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>No prescriptions yet</h3>
                                    <p className='text-sm sm:text-base text-gray-500 max-w-sm mx-auto px-4'>Your medical prescriptions will appear here when doctors upload them to your profile.</p>
                                </div>
                            )}
                        </div>    
                    </div>
                    {/* DietChart Section*/}
                    <div className='w-full lg:w-1/2 bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg'>
                        <div className='mb-8'>
                            <h3 className='text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center'>
                            <svg
                                className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-600 flex-shrink-0'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                {/* Fork and knife icon */}
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 2v20m7-10H5' />
                            </svg>
                            My Diet Charts
                            </h3>

                            {dietCharts.length > 0 ? (
                            <div className='grid grid-cols-1 gap-3 sm:gap-4 max-h-[500px] lg:max-h-96 overflow-y-auto pr-1 sm:pr-2'>
                                {dietCharts.map((chart) => (
                                <div
                                    key={chart._id}
                                    className='bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-yellow-300'
                                >
                                    <div className='flex flex-col sm:flex-row items-start justify-between gap-4'>
                                    <div className='flex items-start space-x-3 sm:space-x-4 flex-1 w-full'>
                                        {/* Diet Chart Icon */}
                                        <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center flex-shrink-0'>
                                        <svg
                                            className='h-5 w-5 sm:h-6 sm:w-6 text-yellow-600'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path d='M4 3a1 1 0 011-1h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3z' />
                                        </svg>
                                        </div>

                                        {/* Diet Chart Details */}
                                        <div className='flex-1 min-w-0'>
                                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                                            <h4 className='text-base sm:text-lg font-semibold text-gray-900 break-words'>
                                            {chart.chartName || 'Diet Chart'}
                                            </h4>
                                            <span className='inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap'>
                                            Active
                                            </span>
                                        </div>

                                        <div className='space-y-2'>
                                            <div className='flex items-center text-xs sm:text-sm text-gray-600'>
                                            <svg
                                                className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                                />
                                            </svg>
                                            <span className='break-words'>
                                                Uploaded:{' '}
                                                {new Date(chart.createdAt || chart.uploadDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                })}
                                            </span>
                                            </div>

                                            {chart.nutritionistName && (
                                            <div className='flex items-center text-xs sm:text-sm text-gray-600'>
                                                <svg
                                                className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                                >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                                />
                                                </svg>
                                                <span className='break-words'>Nutritionist: {chart.nutritionistName}</span>
                                            </div>
                                            )}

                                            {chart.meals && chart.meals.length > 0 && (
                                            <div className='space-y-2'>
                                                <div className='flex items-center text-xs sm:text-sm text-yellow-600 mb-2 sm:mb-3'>
                                                <svg
                                                    className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-yellow-400 flex-shrink-0'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M12 4v16m8-8H4'
                                                    />
                                                </svg>
                                                <span className='font-medium'>Meals Included:</span>
                                                </div>

                                                <div className='grid grid-cols-1 gap-2 max-h-32 overflow-y-auto'>
                                                {chart.meals.map((meal, mealIndex) => (
                                                    <div
                                                    key={mealIndex}
                                                    className='bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-2.5 sm:p-3 hover:shadow-sm transition-all duration-200 hover:border-yellow-300'
                                                    >
                                                    <div className='flex items-start space-x-2'>
                                                        <div className='w-5 h-5 sm:w-6 sm:h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                        <svg
                                                            className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-700'
                                                            fill='currentColor'
                                                            viewBox='0 0 20 20'
                                                        >
                                                            <path
                                                            fillRule='evenodd'
                                                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                            clipRule='evenodd'
                                                            />
                                                        </svg>
                                                        </div>
                                                        <div className='flex-1 min-w-0'>
                                                        <h5 className='text-xs sm:text-sm font-semibold text-yellow-800 break-words'>
                                                            {meal.name || meal.mealName || 'Meal'}
                                                        </h5>
                                                        {meal.details && (
                                                            <p className='text-[10px] sm:text-xs text-yellow-600 mt-1'>
                                                            {meal.details}
                                                            </p>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className='flex flex-col space-y-2 w-full sm:w-auto sm:ml-4'>
                                        {chart.filePath || chart.fileUrl ? (
                                        <a
                                            href={chart.fileUrl || `${backendUrl}${chart.filePath}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='inline-flex items-center justify-center px-3 py-2 border border-yellow-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors whitespace-nowrap'
                                        >
                                            <svg
                                            className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                            >
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                            </svg>
                                            View PDF
                                        </a>
                                        ) : (
                                        <span className='inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm text-gray-400 bg-gray-50 rounded-md whitespace-nowrap'>
                                            <svg
                                            className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                            >
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
                            <div className='text-center py-8 sm:py-12 bg-white rounded-xl border-2 border-dashed border-gray-200'>
                                <div className='mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4'>
                                <svg
                                    className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M8 6h8M8 12h8m-7 6h6' />
                                </svg>
                                </div>
                                <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>No diet charts yet</h3>
                                <p className='text-sm sm:text-base text-gray-500 max-w-sm mx-auto px-4'>
                                Your diet charts will appear here when nutritionists upload them to your profile.
                                </p>
                            </div>
                            )}
                        </div>
                        </div>
                </div>
            </div>
        </div>
    ) : null
}

export default MyProfile

