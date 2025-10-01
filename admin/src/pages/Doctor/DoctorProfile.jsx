import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Phone, Mail, MapPin, Edit, User } from 'lucide-react'

const DoctorProfile = () => {

    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)
    const [activeTab, setActiveTab] = useState('general')
    const [editedData, setEditedData] = useState({})

    const updateProfile = async () => {

        try {
            // Only send fields that were actually edited
            const updateData = {};
            
            if (editedData.fees !== undefined) updateData.fees = editedData.fees;
            if (editedData.about !== undefined) updateData.about = editedData.about;
            if (editedData.available !== undefined) updateData.available = editedData.available;
            if (editedData.degree !== undefined) updateData.degree = editedData.degree;
            if (editedData.experience !== undefined) updateData.experience = editedData.experience;
            if (editedData.phone !== undefined) updateData.phone = editedData.phone;
            if (editedData.address !== undefined) updateData.address = editedData.address;

            // If no fields were edited, just close edit mode
            if (Object.keys(updateData).length === 0) {
                setIsEdit(false);
                toast.info('No changes to save');
                return;
            }

            console.log('Sending update data:', updateData);

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                setEditedData({})
                await getProfileData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const handleEditChange = (field, value) => {
        console.log(`Field changed: ${field} = ${value}`);
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleEdit = () => {
        // Initialize editedData with current profile data when entering edit mode
        setEditedData({});
        setIsEdit(true);
    }

    const getInitials = () => {
        if (!profileData?.name) return 'DA'
        const parts = profileData.name.split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return profileData.name.substring(0, 2).toUpperCase()
    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    return profileData && (
        <div className='w-full min-h-screen py-6'>
            {/* Header */}
            <div className='flex justify-between items-start mb-6'>
                <div>
                    <h1 className='text-3xl font-semibold text-gray-900'>Doctor Profile</h1>
                    <p className='text-sm text-gray-500 mt-1'>Manage your professional information and consultation fees</p>
                </div>
                <div className='flex gap-3'>
                    {isEdit && (
                        <button 
                            onClick={() => {
                                setIsEdit(false);
                                setEditedData({});
                            }}
                            className='flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (isEdit) {
                                updateProfile()
                            } else {
                                handleEdit()
                            }
                        }}
                        className='flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors'
                    >
                        <Edit className='w-4 h-4' />
                        {isEdit ? 'Save Profile' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className='flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit'>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'general'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    General Information
                </button>
                <button
                    onClick={() => setActiveTab('fees')}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'fees'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Consultation Fees
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'schedule'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Schedule & Hours
                </button>
            </div>

            {/* General Information Tab */}
            {activeTab === 'general' && (
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                    {/* Profile Overview */}
                    <div className='lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4'>
                        <h2 className='text-base font-semibold text-gray-900 mb-4'>Profile Overview</h2>
                        
                        <div className='flex flex-col items-center'>
                            <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-3'>
                                <span className='text-3xl font-semibold text-green-700'>{getInitials()}</span>
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 mb-1'>{profileData.name}</h3>
                            <p className='text-sm text-gray-500 mb-3'>{profileData.speciality}</p>
                            <div className='bg-gray-100 px-3 py-1 rounded-full'>
                                <span className='text-sm font-medium text-gray-700'>{profileData.experience}</span>
                            </div>
                        </div>

                        <div className='mt-4 pt-4 border-t border-gray-200 space-y-3'>
                            <div className='flex items-start gap-3'>
                                <User className='w-5 h-5 text-gray-400 mt-0.5' />
                                <div>
                                    <p className='text-xs text-gray-500'>Reg. No:</p>
                                    <p className='text-sm text-gray-900'>{profileData.registrationNumber || 'AYU12345'}</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <Phone className='w-5 h-5 text-gray-400 mt-0.5' />
                                <div>
                                    <p className='text-sm text-gray-900'>{profileData.phone || profileData.email || '+91 98765 43210'}</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <Mail className='w-5 h-5 text-gray-400 mt-0.5' />
                                <div>
                                    <p className='text-sm text-gray-900'>{profileData.email || 'doctor@ayurvedclinic.com'}</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <MapPin className='w-5 h-5 text-gray-400 mt-0.5' />
                                <div>
                                    <p className='text-sm text-gray-900'>
                                        {profileData.address?.line1 || '123 Wellness Street'}, {profileData.address?.line2 || 'Ayur Nagar, Mumbai - 400001'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Basic Information & Contact */}
                    <div className='lg:col-span-2 space-y-4'>
                        {/* Basic Information */}
                        <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <h2 className='text-base font-semibold text-gray-900 mb-4'>Basic Information</h2>
                            
                            <div className='grid grid-cols-2 gap-6'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Full Name</label>
                                    {isEdit ? (
                                        <input
                                            type='text'
                                            value={editedData.name || profileData.name}
                                            onChange={(e) => handleEditChange('name', e.target.value)}
                                            className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                        />
                                    ) : (
                                        <p className='text-gray-500 py-2.5'>{profileData.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Registration Number</label>
                                    <p className='text-gray-500 py-2.5'>{profileData.registrationNumber || 'AYU12345'}</p>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Specialization</label>
                                    <p className='text-gray-500 py-2.5'>{profileData.speciality}</p>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Experience</label>
                                    {isEdit ? (
                                        <input
                                            type='text'
                                            value={editedData.experience || profileData.experience}
                                            onChange={(e) => handleEditChange('experience', e.target.value)}
                                            className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                        />
                                    ) : (
                                        <p className='text-gray-500 py-2.5'>{profileData.experience}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <h2 className='text-base font-semibold text-gray-900 mb-4'>Contact Information</h2>
                            
                            <div className='grid grid-cols-2 gap-6'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
                                    {isEdit ? (
                                        <input
                                            type='text'
                                            value={editedData.phone || profileData.phone || '+91 98765 43210'}
                                            onChange={(e) => handleEditChange('phone', e.target.value)}
                                            className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                        />
                                    ) : (
                                        <p className='text-gray-500 py-2.5'>{profileData.phone || '+91 98765 43210'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address</label>
                                    <p className='text-gray-500 py-2.5'>{profileData.email || 'doctor@ayurvedclinic.com'}</p>
                                </div>
                                <div className='col-span-2'>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>Clinic Address</label>
                                    {isEdit ? (
                                        <input
                                            type='text'
                                            value={`${editedData.address?.line1 || profileData.address?.line1 || '123 Wellness Street'}, ${editedData.address?.line2 || profileData.address?.line2 || 'Ayur Nagar, Mumbai - 400001'}`}
                                            onChange={(e) => {
                                                const parts = e.target.value.split(',')
                                                handleEditChange('address', {
                                                    line1: parts[0]?.trim() || '',
                                                    line2: parts.slice(1).join(',').trim() || ''
                                                })
                                            }}
                                            className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                        />
                                    ) : (
                                        <p className='text-gray-500 py-2.5'>
                                            {profileData.address?.line1 || '123 Wellness Street'}, {profileData.address?.line2 || 'Ayur Nagar, Mumbai - 400001'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Qualifications */}
                        <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <h2 className='text-base font-semibold text-gray-900 mb-4'>Qualifications</h2>
                            
                            <div className='flex flex-wrap gap-3'>
                                {(profileData.degree || 'BAMS, MD (Ayurveda), Panchakarma Specialist').split(',').map((qual, index) => (
                                    <span key={index} className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm'>
                                        {qual.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Professional Bio */}
                        <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <h2 className='text-base font-semibold text-gray-900 mb-4'>Professional Bio</h2>
                            
                            {isEdit ? (
                                <textarea
                                    value={editedData.about || profileData.about}
                                    onChange={(e) => handleEditChange('about', e.target.value)}
                                    rows={4}
                                    className='w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none'
                                />
                            ) : (
                                <p className='text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-lg'>
                                    {profileData.about || 'Experienced Ayurvedic physician specializing in constitutional analysis, Panchakarma therapies, and holistic wellness. Dedicated to helping patients achieve optimal health through traditional Ayurvedic principles and modern clinical practices.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Consultation Fees Tab */}
            {activeTab === 'fees' && (
                <div className='bg-white border border-gray-200 rounded-xl p-4 max-w-2xl'>
                    <h2 className='text-base font-semibold text-gray-900 mb-4'>Consultation Fees</h2>
                    
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Standard Consultation Fee</label>
                            {isEdit ? (
                                <input
                                    type='number'
                                    value={editedData.fees || profileData.fees}
                                    onChange={(e) => handleEditChange('fees', e.target.value)}
                                    className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                />
                            ) : (
                                <p className='text-2xl font-semibold text-gray-900'>{currency} {profileData.fees}</p>
                            )}
                        </div>
                        <div className='flex items-center gap-2 pt-4'>
                            <input
                                type='checkbox'
                                id='available'
                                checked={editedData.available !== undefined ? editedData.available : profileData.available}
                                onChange={(e) => isEdit && handleEditChange('available', e.target.checked)}
                                disabled={!isEdit}
                                className='w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900'
                            />
                            <label htmlFor='available' className='text-sm font-medium text-gray-700'>Available for appointments</label>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule & Hours Tab */}
            {activeTab === 'schedule' && (
                <div className='bg-white border border-gray-200 rounded-xl p-4 max-w-2xl'>
                    <h2 className='text-base font-semibold text-gray-900 mb-4'>Schedule & Hours</h2>
                    
                    <p className='text-gray-500'>Schedule management feature coming soon...</p>
                </div>
            )}
        </div>
    )
}

export default DoctorProfile