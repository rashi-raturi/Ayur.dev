import React, { useState, useEffect, useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PatientProfileModal = ({ isOpen, onClose, patientId }) => {
    const [patientData, setPatientData] = useState(null)
    const [prescriptions, setPrescriptions] = useState([])
    const [loadingProfile, setLoadingProfile] = useState(false)
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
    const [generatingSummary, setGeneratingSummary] = useState(false)
    const [summary, setSummary] = useState(null)
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [uploadFile, setUploadFile] = useState(null)
    const [uploading, setUploading] = useState(false)

    const { dToken, backendUrl } = useContext(DoctorContext)
    const { calculateAge } = useContext(AppContext)

    // Function to load patient profile data
    const loadPatientProfile = async () => {
        if (!patientId || !dToken) return
        
        try {
            setLoadingProfile(true)
            const { data } = await axios.get(
                `${backendUrl}/api/doctor/patient-profile/${patientId}`,
                { headers: { dtoken: dToken } }
            )
            
            if (data.success) {
                setPatientData(data.patient)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to load patient profile')
        } finally {
            setLoadingProfile(false)
        }
    }

    // Function to load patient prescriptions
    const loadPatientPrescriptions = async () => {
        if (!patientId || !dToken) return
        
        try {
            setLoadingPrescriptions(true)
            const { data } = await axios.get(
                `${backendUrl}/api/doctor/prescriptions/${patientId}`, 
                { headers: { dToken } }
            )
            
            if (data.success) {
                setPrescriptions(data.prescriptions)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to load patient prescriptions')
        } finally {
            setLoadingPrescriptions(false)
        }
    }

    // Function to generate patient medical summary
    const generatePatientSummary = async () => {
        if (!patientId || !dToken) return
        
        try {
            setGeneratingSummary(true)
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/patient-summary/${patientId}`,
                {},
                { headers: { dToken } }
            )

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

    // Function to handle file upload for prescriptions
    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0])
    }

    const uploadPatientPrescription = async () => {
        if (!uploadFile || !patientId || !dToken) return
        
        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('prescription', uploadFile)
            
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/prescription/${patientId}`,
                formData,
                { 
                    headers: { 
                        dtoken: dToken,
                        'Content-Type': 'multipart/form-data' 
                    } 
                }
            )
            
            if (data.success) {
                toast.success('Prescription uploaded successfully')
                loadPatientPrescriptions()
                setUploadFile(null)
                // Clear file input
                const fileInput = document.querySelector('input[type="file"]')
                if (fileInput) fileInput.value = ''
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error('Failed to upload prescription')
        } finally {
            setUploading(false)
        }
    }

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && patientId) {
            loadPatientProfile()
            loadPatientPrescriptions()
        }
    }, [isOpen, patientId])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPatientData(null)
            setPrescriptions([])
            setSummary(null)
            setShowSummaryModal(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            {/* Main Patient Profile Modal */}
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden'>
                    {/* Modal Header */}
                    <div className='p-6 border-b border-gray-200 bg-gray-50'>
                        <div className='flex items-center justify-between'>
                            <h2 className='text-2xl font-bold text-gray-900'>Patient Profile</h2>
                            <button 
                                onClick={onClose}
                                className='text-gray-400 hover:text-gray-600 text-3xl font-light'
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
                        {loadingProfile ? (
                            <div className='flex items-center justify-center py-12'>
                                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
                            </div>
                        ) : patientData ? (
                            <div className='flex gap-6 h-full'>
                                {/* Left Half - Patient Profile Information */}
                                <div className='w-1/2 bg-primary p-8 rounded-lg'>
                                    <div className='max-w-lg flex flex-col gap-2 text-sm text-white'>
                                        <img className='w-36 rounded' src={patientData.image} alt={patientData.name} />
                                        
                                        <p className='font-medium text-3xl text-white mt-4'>{patientData.name}</p>
                                        
                                        <hr className='bg-white/30 h-[1px] border-none' />

                                        <div>
                                            <p className='text-white/80 underline mt-3'>CONTACT INFORMATION</p>
                                            <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-white'>
                                                <p className='font-medium'>Email id:</p>
                                                <p className='text-white/90'>{patientData.email}</p>
                                                
                                                <p className='font-medium'>Phone:</p>
                                                <p className='text-white/90'>{patientData.phone || 'Not provided'}</p>
                                                
                                                <p className='font-medium'>Address:</p>
                                                <p className='text-white/80'>
                                                    {patientData.address?.line1 || 'Not provided'} 
                                                    {patientData.address?.line2 && (
                                                        <><br />{patientData.address.line2}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className='text-white/80 underline mt-3'>BASIC INFORMATION</p>
                                            <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-white'>
                                                <p className='font-medium'>Gender:</p>
                                                <p className='text-white/80'>{patientData.gender || 'Not specified'}</p>
                                                
                                                <p className='font-medium'>Age:</p>
                                                <p className='text-white/80'>
                                                    {patientData.dob ? (
                                                        (() => {
                                                            const age = calculateAge(patientData.dob);
                                                            return !isNaN(age) && age > 0 ? `${age} years` : 'Not provided';
                                                        })()
                                                    ) : 'Not provided'}
                                                </p>
                                                
                                                <p className='font-medium'>Date of Birth:</p>
                                                <p className='text-white/80'>
                                                    {patientData.dob ? (
                                                        (() => {
                                                            try {
                                                                const date = new Date(patientData.dob);
                                                                return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid date';
                                                            } catch (e) {
                                                                return 'Invalid date';
                                                            }
                                                        })()
                                                    ) : 'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Half - Prescriptions Management */}
                                <div className='w-1/2 bg-gray-50 p-8 rounded-lg'>
                                    <div className='max-w-lg'>
                                        <h3 className='text-3xl font-medium text-[#262626] mb-6'>Medical Records</h3>
                                        
                                        {/* Upload New Prescription Section */}
                                        <div className='mb-8'>
                                            <h4 className='text-lg font-medium text-gray-700 mb-4'>Upload New Prescription</h4>
                                            <div className='bg-white p-4 rounded-lg border border-gray-200'>
                                                <div className='flex flex-col space-y-3'>
                                                    <input 
                                                        type='file' 
                                                        accept='application/pdf' 
                                                        onChange={handleFileChange}
                                                        className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90'
                                                    />
                                                    <button
                                                        onClick={uploadPatientPrescription}
                                                        disabled={!uploadFile || uploading}
                                                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                                                            !uploadFile || uploading
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                : 'bg-primary text-white hover:bg-primary/90'
                                                        }`}
                                                    >
                                                        {uploading ? 'Uploading...' : 'Upload Prescription'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Past Prescriptions Section */}
                                        <div className='mb-8'>
                                            <h4 className='text-lg font-medium text-gray-700 mb-4'>Patient Prescriptions</h4>
                                            {loadingPrescriptions ? (
                                                <div className='flex items-center justify-center py-8'>
                                                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                                                </div>
                                            ) : prescriptions.length > 0 ? (
                                                <div className='space-y-3 max-h-60 overflow-y-auto'>
                                                    {prescriptions.map((prescription) => (
                                                        <div key={prescription._id} className='bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between'>
                                                            <div className='flex items-center space-x-3'>
                                                                <svg className='h-8 w-8 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                                                                    <path fillRule='evenodd' d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z' clipRule='evenodd' />
                                                                </svg>
                                                                <div>
                                                                    <p className='text-sm font-medium text-gray-900'>
                                                                        {prescription.patientName ? `Prescription for ${prescription.patientName}` : 'Medical Prescription'}
                                                                    </p>
                                                                    <p className='text-xs text-gray-500'>
                                                                        Uploaded: {new Date(prescription.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                    {prescription.doctorName && (
                                                                        <p className='text-xs text-gray-400'>
                                                                            By: Dr. {prescription.doctorName}
                                                                        </p>
                                                                    )}
                                                                    {prescription.medicine && prescription.medicine.length > 0 && (
                                                                        <p className='text-xs text-blue-600'>
                                                                            {prescription.medicine.filter(med => med && (typeof med === 'string' || typeof med === 'object')).length} medication(s) prescribed
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className='flex space-x-2'>
                                                                {prescription.filePath ? (
                                                                    <a 
                                                                        href={`${backendUrl}${prescription.filePath}`}
                                                                        target='_blank' 
                                                                        rel='noopener noreferrer'
                                                                        className='text-blue-600 hover:text-blue-800 text-sm underline'
                                                                    >
                                                                        View PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className='text-gray-400 text-sm'>No file</span>
                                                                )}
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

                                        {/* Generate Summary Button */}
                                        <div className='mt-8'>
                                            <button 
                                                onClick={generatePatientSummary}
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
                            </div>
                        ) : (
                            <div className='text-center py-12 text-gray-500'>
                                <p>Failed to load patient data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Modal */}
            {showSummaryModal && summary && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4'>
                    <div className='bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-2xl font-bold text-gray-900'>Patient Medical Summary</h3>
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
                                    <div className='space-y-6'>
                                        {summary.summary && (
                                            <div className='bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg'>
                                                <h4 className='text-xl font-bold text-blue-800 mb-3 flex items-center'>
                                                    <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                                    </svg>
                                                    Medical Summary
                                                </h4>
                                                <div className='text-blue-700 leading-relaxed'>
                                                    {typeof summary.summary === 'object' ? (
                                                        <div className='space-y-2'>
                                                            {Array.isArray(summary.summary) ? summary.summary.map((item, idx) => (
                                                                <div key={idx} className='flex items-start space-x-2'>
                                                                    <span className='text-blue-500 mt-1'>•</span>
                                                                    <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                                                                </div>
                                                            )) : Object.entries(summary.summary).map(([key, value]) => (
                                                                <div key={key} className='flex items-start space-x-2'>
                                                                    <span className='text-blue-500 mt-1'>•</span>
                                                                    <span><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        summary.summary.split('\n').map((line, idx) => line.trim() && (
                                                            <div key={idx} className='flex items-start space-x-2 mb-2'>
                                                                <span className='text-blue-500 mt-1'>•</span>
                                                                <span>{line.trim()}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {summary.medications && (
                                            <div className='bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg'>
                                                <h4 className='text-xl font-bold text-green-800 mb-4 flex items-center'>
                                                    <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                                                    </svg>
                                                    Current Medications
                                                </h4>
                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                                    {(() => {
                                                        if (typeof summary.medications === 'string') {
                                                            // Handle string format - split by newlines or common separators
                                                            const lines = summary.medications.split(/\n|;|\*|•|-/).filter(line => line.trim());
                                                            return lines.map((line, idx) => {
                                                                const cleanLine = line.trim().replace(/^[-•*]\s*/, '');
                                                                const parts = cleanLine.split(/[-,:]/).map(p => p.trim());
                                                                const medName = parts[0] || 'Medication';
                                                                const dosage = parts.find(p => p.match(/\d+\s*(mg|ml|g|tablet|capsule)/i)) || '';
                                                                const frequency = parts.find(p => p.match(/(daily|twice|thrice|morning|evening|night|times)/i)) || '';
                                                                const duration = parts.find(p => p.match(/\d+\s*(day|week|month)/i)) || '';
                                                                
                                                                return (
                                                                    <div key={idx} className='bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow'>
                                                                        <div className='flex items-start space-x-3'>
                                                                            <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                                                <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                                                                                </svg>
                                                                            </div>
                                                                            <div className='flex-1 min-w-0'>
                                                                                <h5 className='font-semibold text-gray-900 text-sm truncate'>{medName}</h5>
                                                                                {dosage && (
                                                                                    <p className='text-xs text-green-600 mt-1'>
                                                                                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                                                            {dosage}
                                                                                        </span>
                                                                                    </p>
                                                                                )}
                                                                                <div className='flex flex-wrap gap-1 mt-2'>
                                                                                    {frequency && (
                                                                                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
                                                                                            {frequency}
                                                                                        </span>
                                                                                    )}
                                                                                    {duration && (
                                                                                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800'>
                                                                                            {duration}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {!dosage && !frequency && !duration && parts.length > 1 && (
                                                                                    <p className='text-xs text-gray-500 mt-1'>{parts.slice(1).join(', ')}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        } else if (Array.isArray(summary.medications)) {
                                                            // Handle array format
                                                            return summary.medications.map((item, idx) => {
                                                                if (typeof item === 'object' && item !== null) {
                                                                    return (
                                                                        <div key={idx} className='bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow'>
                                                                            <div className='flex items-start space-x-3'>
                                                                                <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                                                    <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                                                        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className='flex-1 min-w-0'>
                                                                                    <h5 className='font-semibold text-gray-900 text-sm'>{item.name || 'Medication'}</h5>
                                                                                    {item.dosage && (
                                                                                        <p className='text-xs text-green-600 mt-1'>
                                                                                            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                                                                {item.dosage}
                                                                                            </span>
                                                                                        </p>
                                                                                    )}
                                                                                    <div className='flex flex-wrap gap-1 mt-2'>
                                                                                        {item.frequency && (
                                                                                            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
                                                                                                {item.frequency}
                                                                                            </span>
                                                                                        )}
                                                                                        {item.duration && (
                                                                                            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800'>
                                                                                                {item.duration}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {item.purpose && (
                                                                                        <p className='text-xs text-gray-500 mt-2 italic'>For: {item.purpose}</p>
                                                                                    )}
                                                                                    {item.instructions && (
                                                                                        <p className='text-xs text-gray-600 mt-1'>{item.instructions}</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    // Simple string item
                                                                    const cleanItem = String(item).trim();
                                                                    const parts = cleanItem.split(/[-,:]/).map(p => p.trim());
                                                                    const medName = parts[0] || 'Medication';
                                                                    const details = parts.slice(1).join(', ');
                                                                    
                                                                    return (
                                                                        <div key={idx} className='bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow'>
                                                                            <div className='flex items-start space-x-3'>
                                                                                <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                                                    <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className='flex-1 min-w-0'>
                                                                                    <h5 className='font-semibold text-gray-900 text-sm'>{medName}</h5>
                                                                                    {details && (
                                                                                        <p className='text-xs text-gray-500 mt-1'>{details}</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            });
                                                        } else if (typeof summary.medications === 'object') {
                                                            // Handle object format
                                                            return Object.entries(summary.medications).map(([key, value]) => (
                                                                <div key={key} className='bg-white border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow'>
                                                                    <div className='flex items-start space-x-3'>
                                                                        <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                                            <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                                                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                                                            </svg>
                                                                        </div>
                                                                        <div className='flex-1 min-w-0'>
                                                                            <h5 className='font-semibold text-gray-900 text-sm'>
                                                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                            </h5>
                                                                            <p className='text-xs text-gray-600 mt-1'>
                                                                                {typeof value === 'object' ? JSON.stringify(value) : value}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        } else {
                                                            // Fallback - single medication card
                                                            return [(
                                                                <div key="single" className='bg-white border border-green-200 rounded-lg p-3 shadow-sm'>
                                                                    <div className='flex items-start space-x-3'>
                                                                        <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                                            <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                                                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                                                                            </svg>
                                                                        </div>
                                                                        <div className='flex-1 min-w-0'>
                                                                            <h5 className='font-semibold text-gray-900 text-sm'>Medication Details</h5>
                                                                            <p className='text-xs text-gray-600 mt-1'>{summary.medications}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )];
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {summary.insights && (
                                            <div className='bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg'>
                                                <h4 className='text-xl font-bold text-purple-800 mb-3 flex items-center'>
                                                    <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
                                                    </svg>
                                                    Clinical Insights
                                                </h4>
                                                <div className='text-purple-700 leading-relaxed'>
                                                    {typeof summary.insights === 'object' ? (
                                                        <div className='space-y-2'>
                                                            {Array.isArray(summary.insights) ? summary.insights.map((item, idx) => (
                                                                <div key={idx} className='flex items-start space-x-2'>
                                                                    <span className='text-purple-500 mt-1'>•</span>
                                                                    <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                                                                </div>
                                                            )) : Object.entries(summary.insights).map(([key, value]) => (
                                                                <div key={key} className='flex items-start space-x-2'>
                                                                    <span className='text-purple-500 mt-1'>•</span>
                                                                    <span><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        summary.insights.split('\n').map((line, idx) => line.trim() && (
                                                            <div key={idx} className='flex items-start space-x-2 mb-2'>
                                                                <span className='text-purple-500 mt-1'>•</span>
                                                                <span>{line.trim()}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {summary.recommendations && (
                                            <div className='bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg'>
                                                <h4 className='text-xl font-bold text-orange-800 mb-3 flex items-center'>
                                                    <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
                                                    </svg>
                                                    Recommendations
                                                </h4>
                                                <div className='text-orange-700 leading-relaxed'>
                                                    {typeof summary.recommendations === 'object' ? (
                                                        <div className='space-y-2'>
                                                            {Array.isArray(summary.recommendations) ? summary.recommendations.map((item, idx) => (
                                                                <div key={idx} className='flex items-start space-x-2'>
                                                                    <span className='text-orange-500 mt-1'>•</span>
                                                                    <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                                                                </div>
                                                            )) : Object.entries(summary.recommendations).map(([key, value]) => (
                                                                <div key={key} className='flex items-start space-x-2'>
                                                                    <span className='text-orange-500 mt-1'>•</span>
                                                                    <span><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        summary.recommendations.split('\n').map((line, idx) => line.trim() && (
                                                            <div key={idx} className='flex items-start space-x-2 mb-2'>
                                                                <span className='text-orange-500 mt-1'>•</span>
                                                                <span>{line.trim()}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Fallback for other possible keys */}
                                        {summary.patientInfo && (
                                            <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg'>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Patient Information</h4>
                                                <div className='text-gray-600'>{typeof summary.patientInfo === 'object' ? JSON.stringify(summary.patientInfo, null, 2) : summary.patientInfo}</div>
                                            </div>
                                        )}
                                        {summary.conditions && (
                                            <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg'>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Medical Conditions</h4>
                                                <div className='text-gray-600'>{typeof summary.conditions === 'object' ? JSON.stringify(summary.conditions, null, 2) : summary.conditions}</div>
                                            </div>
                                        )}
                                        {summary.fullSummary && (
                                            <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg'>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Complete Summary</h4>
                                                <div className='text-gray-600 whitespace-pre-wrap'>{typeof summary.fullSummary === 'object' ? JSON.stringify(summary.fullSummary, null, 2) : summary.fullSummary}</div>
                                            </div>
                                        )}
                                        
                                        {/* If no recognized keys, show raw object */}
                                        {!summary.summary && !summary.insights && !summary.recommendations && !summary.medications &&
                                         !summary.patientInfo && !summary.conditions && !summary.fullSummary && (
                                            <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg'>
                                                <h4 className='text-lg font-semibold text-gray-800 mb-2'>Generated Summary</h4>
                                                <pre className='text-gray-600 whitespace-pre-wrap text-sm bg-white p-4 rounded border'>
                                                    {JSON.stringify(summary, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className='bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg'>
                                        <h4 className='text-xl font-bold text-blue-800 mb-3'>Medical Summary</h4>
                                        <div className='text-blue-700 whitespace-pre-wrap leading-relaxed'>
                                            {summary.split('\n').map((line, idx) => line.trim() && (
                                                <div key={idx} className='flex items-start space-x-2 mb-2'>
                                                    <span className='text-blue-500 mt-1'>•</span>
                                                    <span>{line.trim()}</span>
                                                </div>
                                            ))}
                                        </div>
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
                                        element.download = `patient-summary-${patientData?.name}-${new Date().toISOString().split('T')[0]}.txt`;
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
        </>
    )
}

export default PatientProfileModal