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
                        <h3 className='text-lg font-medium text-gray-700 mb-4'>Past Prescriptions</h3>
                        {prescriptions.length > 0 ? (
                            <div className='space-y-3 max-h-96 overflow-y-auto'>
                                {prescriptions.map((prescription) => (
                                    <div key={prescription._id} className='bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between'>
                                        <div className='flex items-center space-x-3'>
                                            <svg className='h-8 w-8 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z' clipRule='evenodd' />
                                            </svg>
                                            <div>
                                                <p className='text-sm font-medium text-gray-900'>{prescription.fileName}</p>
                                                <p className='text-xs text-gray-500'>{new Date(prescription.uploadDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <a 
                                                href={prescription.fileUrl} 
                                                target='_blank' 
                                                rel='noopener noreferrer'
                                                className='text-blue-600 hover:text-blue-800 text-sm underline'
                                            >
                                                View
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-8 text-gray-500'>
                                <svg className='mx-auto h-16 w-16 text-gray-300 mb-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                </svg>
                                <p>No prescriptions found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ) : null
}

export default MyProfile