import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'


export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)
    const [prescriptions, setPrescriptions] = useState([])
    const [patients, setPatients] = useState([])
    
    // Cache timestamps to prevent unnecessary refetches
    const [lastFetch, setLastFetch] = useState({
        appointments: 0,
        profile: 0,
        dashboard: 0,
        prescriptions: 0,
        patients: 0
    })
    
    const CACHE_DURATION = 60000 // 1 minute cache

    // Getting Doctor appointment data from Database using API
    const getAppointments = async (force = false) => {
        try {
            // Check cache unless force refresh
            const now = Date.now()
            if (!force && appointments.length > 0 && (now - lastFetch.appointments) < CACHE_DURATION) {
                return // Use cached data
            }

            const { data } = await axios.get(backendUrl + '/api/doctor/appointments', { headers: { dToken } })

            if (data.success) {
                setAppointments(data.appointments.reverse())
                setLastFetch(prev => ({ ...prev, appointments: now }))
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Getting Doctor profile data from Database using API
    const getProfileData = async (force = false) => {
        try {
            // Check cache unless force refresh
            const now = Date.now()
            if (!force && profileData && (now - lastFetch.profile) < CACHE_DURATION) {
                return // Use cached data
            }

            const { data } = await axios.get(backendUrl + '/api/doctor/profile', { headers: { dToken } })
            //console.log(data.profileData)
            setProfileData(data.profileData)
            setLastFetch(prev => ({ ...prev, profile: now }))

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to cancel doctor appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments(true) // Force refresh
                // after creating dashboard
                getDashData(true) // Force refresh
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to confirm appointment using API
    const confirmAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/confirm-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments(true) // Force refresh
                getDashData(true) // Force refresh
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Function to start appointment using API
    const startAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/start-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments(true) // Force refresh
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Function to Mark appointment completed using API
    const completeAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments(true) // Force refresh
                // Later after creating getDashData Function
                getDashData(true) // Force refresh
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting Doctor dashboard data using API
    const getDashData = async (force = false) => {
        try {
            // Check cache unless force refresh
            const now = Date.now()
            if (!force && dashData && (now - lastFetch.dashboard) < CACHE_DURATION) {
                return // Use cached data
            }

            const { data } = await axios.get(backendUrl + '/api/doctor/dashboard', { headers: { dToken } })

            if (data.success) {
                setDashData(data.dashData)
                setLastFetch(prev => ({ ...prev, dashboard: now }))
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Fetch prescriptions for this doctor's patients
    const getDoctorPrescriptions = async (force = false) => {
        try {
            // Check cache unless force refresh
            const now = Date.now()
            if (!force && prescriptions.length > 0 && (now - lastFetch.prescriptions) < CACHE_DURATION) {
                return // Use cached data
            }

            const { data } = await axios.get(backendUrl + '/api/doctor/prescriptions', { headers: { dToken } })
            if (data.success) {
                setPrescriptions(data.prescriptions)
                setLastFetch(prev => ({ ...prev, prescriptions: now }))
            } else toast.error(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Fetch patients for this doctor with caching
    const getPatients = async (force = false) => {
        try {
            // Check cache unless force refresh
            const now = Date.now()
            if (!force && patients.length > 0 && (now - lastFetch.patients) < CACHE_DURATION) {
                return patients // Return cached data
            }

            const { data } = await axios.get(backendUrl + '/api/doctor/patients', { headers: { dToken } })
            if (data.success) {
                setPatients(data.patients)
                setLastFetch(prev => ({ ...prev, patients: now }))
                return data.patients
            } else {
                toast.error(data.message)
                return []
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return []
        }
    }

    const value = {
        dToken, setDToken, backendUrl,
        appointments,
        getAppointments,
        cancelAppointment,
        confirmAppointment,
        startAppointment,
        completeAppointment,
        dashData, getDashData,
        profileData, setProfileData,
        getProfileData,
        prescriptions, getDoctorPrescriptions,
        patients, getPatients
    }

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )


}

export default DoctorContextProvider