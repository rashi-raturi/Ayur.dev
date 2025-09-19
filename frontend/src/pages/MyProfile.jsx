import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [prescriptions, setPrescriptions] = useState([])
    const [uploadingPrescription, setUploadingPrescription] = useState(false)
    const [generatingSummary, setGeneratingSummary] = useState(false)
    const [summary, setSummary] = useState(null)
    const [showSummaryModal, setShowSummaryModal] = useState(false)

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

    // Function to upload prescription
    const uploadPrescription = async (file) => {
        try {
            setUploadingPrescription(true)
            const formData = new FormData()
            formData.append('prescription', file)

            const { data } = await axios.post(backendUrl + '/api/user/upload-prescription', formData, { 
                headers: { 
                    token,
                    'Content-Type': 'multipart/form-data'
                } 
            })

            if (data.success) {
                toast.success('Prescription uploaded successfully')
                loadPrescriptions() // Reload prescriptions
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to upload prescription')
        } finally {
            setUploadingPrescription(false)
        }
    }

    // Function to handle prescription file selection
    const handlePrescriptionUpload = (e) => {
        const file = e.target.files[0]
        if (file && file.type === 'application/pdf') {
            uploadPrescription(file)
        } else {
            toast.error('Please select a PDF file')
        }
    }

    // Function to generate prescription summary
    const generateSummary = async () => {
        try {
            setGeneratingSummary(true)
            const { data } = await axios.post(backendUrl + '/api/user/generate-summary', {}, { headers: { token } })

            if (data.success) {
                toast.success('Summary generated successfully')
                setSummary(data.summary)
                setShowSummaryModal(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to generate summary')
        } finally {
            setGeneratingSummary(false)
        }
    }

    // Function to delete prescription
    const deletePrescription = async (prescriptionId) => {
        try {
            const { data } = await axios.delete(backendUrl + `/api/user/prescription/${prescriptionId}`, { headers: { token } })
            
            if (data.success) {
                toast.success('Prescription deleted successfully')
                loadPrescriptions()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to delete prescription')
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

            {/* Right Half - Prescriptions Management */}
            <div className='w-1/2 bg-gray-50 p-8 rounded-lg'>
                <div className='max-w-lg'>
                    <h2 className='text-3xl font-medium text-[#262626] mb-6'>Medical Records</h2>
                    
                    {/* Upload Prescription Section */}
                    <div className='mb-8'>
                        <h3 className='text-lg font-medium text-gray-700 mb-4'>Upload Prescription</h3>
                        <label htmlFor='prescription-upload' className='cursor-pointer'>
                            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors'>
                                <div className='mb-2'>
                                    <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                                    </svg>
                                </div>
                                <p className='text-gray-600'>
                                    {uploadingPrescription ? 'Uploading...' : 'Click to upload prescription (PDF)'}
                                </p>
                            </div>
                        </label>
                        <input 
                            id='prescription-upload' 
                            type='file' 
                            accept='application/pdf' 
                            onChange={handlePrescriptionUpload}
                            disabled={uploadingPrescription}
                            className='hidden' 
                        />
                    </div>

                    {/* Past Prescriptions Section */}
                    <div className='mb-8'>
                        <h3 className='text-lg font-medium text-gray-700 mb-4'>Past Prescriptions</h3>
                        {prescriptions.length > 0 ? (
                            <div className='space-y-3 max-h-60 overflow-y-auto'>
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
                                        <div className='flex space-x-2'>
                                            <a 
                                                href={prescription.fileUrl} 
                                                target='_blank' 
                                                rel='noopener noreferrer'
                                                className='text-blue-600 hover:text-blue-800 text-sm underline'
                                            >
                                                View
                                            </a>
                                            <button 
                                                onClick={() => deletePrescription(prescription._id)}
                                                className='text-red-600 hover:text-red-800 text-sm'
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-8 text-gray-500'>
                                <svg className='mx-auto h-16 w-16 text-gray-300 mb-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                </svg>
                                <p>No prescriptions uploaded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Generate Summary Button */}
                    <div className='mt-8'>
                        <button 
                            onClick={generateSummary}
                            disabled={prescriptions.length === 0 || generatingSummary}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                prescriptions.length === 0 || generatingSummary
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                        >
                            {generatingSummary ? (
                                <div className='flex items-center justify-center space-x-2'>
                                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                    </svg>
                                    <span>Generating Summary...</span>
                                </div>
                            ) : (
                                'Generate Medical Summary'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Modal */}
            {showSummaryModal && summary && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-2xl font-bold text-gray-900'>Medical Summary</h3>
                                <button 
                                    onClick={() => setShowSummaryModal(false)}
                                    className='text-gray-400 hover:text-gray-600 text-2xl'
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className='p-6 overflow-y-auto max-h-[60vh]'>
                            <div className='prose max-w-none'>
                                {typeof summary === 'object' ? (
                                    <div className='space-y-4'>
                                        {summary.patientInfo && (
                                            <div>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Patient Information</h4>
                                                <p className='text-gray-600'>{summary.patientInfo}</p>
                                            </div>
                                        )}
                                        {summary.medications && (
                                            <div>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Current Medications</h4>
                                                <div className='text-gray-600'>{summary.medications}</div>
                                            </div>
                                        )}
                                        {summary.conditions && (
                                            <div>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Medical Conditions</h4>
                                                <div className='text-gray-600'>{summary.conditions}</div>
                                            </div>
                                        )}
                                        {summary.recommendations && (
                                            <div>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Recommendations</h4>
                                                <div className='text-gray-600'>{summary.recommendations}</div>
                                            </div>
                                        )}
                                        {summary.fullSummary && (
                                            <div>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Complete Summary</h4>
                                                <div className='text-gray-600 whitespace-pre-wrap'>{summary.fullSummary}</div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className='text-gray-600 whitespace-pre-wrap leading-relaxed'>
                                        {summary}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='p-6 border-t border-gray-200 bg-gray-50'>
                            <div className='flex justify-end space-x-3'>
                                <button 
                                    onClick={() => {
                                        const element = document.createElement('a');
                                        const file = new Blob([typeof summary === 'object' ? JSON.stringify(summary, null, 2) : summary], {type: 'text/plain'});
                                        element.href = URL.createObjectURL(file);
                                        element.download = `medical-summary-${new Date().toISOString().split('T')[0]}.txt`;
                                        document.body.appendChild(element);
                                        element.click();
                                        document.body.removeChild(element);
                                    }}
                                    className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors'
                                >
                                    Download
                                </button>
                                <button 
                                    onClick={() => setShowSummaryModal(false)}
                                    className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : null
}

export default MyProfile