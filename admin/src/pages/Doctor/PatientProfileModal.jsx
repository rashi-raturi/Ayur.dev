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

    const { dToken, backendUrl } = useContext(DoctorContext)
    const { calculateAge } = useContext(AppContext)

    // Function to load patient profile data
    const loadPatientProfile = async () => {
        if (!patientId || !dToken) return
        
        try {
            setLoadingProfile(true)
            const { data } = await axios.get(
                `${backendUrl}/api/user/patient-profile/${patientId}`, 
                { headers: { dToken } }
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
                `${backendUrl}/api/doctor/patient-prescriptions/${patientId}`, 
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
                `${backendUrl}/api/doctor/generate-patient-summary/${patientId}`,
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
                                                    {patientData.dob ? calculateAge(patientData.dob) + ' years' : 'Not provided'}
                                                </p>
                                                
                                                <p className='font-medium'>Date of Birth:</p>
                                                <p className='text-white/80'>
                                                    {patientData.dob ? new Date(patientData.dob).toLocaleDateString() : 'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Half - Prescriptions Management */}
                                <div className='w-1/2 bg-gray-50 p-8 rounded-lg'>
                                    <div className='max-w-lg'>
                                        <h3 className='text-3xl font-medium text-[#262626] mb-6'>Medical Records</h3>
                                        
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
                                                                    <p className='text-sm font-medium text-gray-900'>{prescription.fileName}</p>
                                                                    <p className='text-xs text-gray-500'>
                                                                        {new Date(prescription.uploadDate).toLocaleDateString()}
                                                                    </p>
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