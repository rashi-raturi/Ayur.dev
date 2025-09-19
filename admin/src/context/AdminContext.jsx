import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";


/* eslint-disable react/prop-types */
export const AdminContext = createContext()

const AdminContextProvider = ({ children }) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)
    const [doctorDetails, setDoctorDetails] = useState(null)

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Fetch a single doctor's details
    const getDoctorDetails = async (id) => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/admin/doctor/${id}`,
                { headers: { aToken } }
            )
            if (data.success) setDoctorDetails(data.doctor)
            else toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Update a doctor's details
    const updateDoctorDetails = async (id, updateData, imageFile) => {
        try {
            let response
            if (imageFile) {
                const formData = new FormData()
                Object.keys(updateData).forEach((key) => {
                    const value = updateData[key]
                    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
                })
                formData.append('image', imageFile)
                response = await axios.put(
                    `${backendUrl}/api/admin/doctor/${id}`,
                    formData,
                    { headers: { aToken, 'Content-Type': 'multipart/form-data' } }
                )
            } else {
                response = await axios.put(
                    `${backendUrl}/api/admin/doctor/${id}`,
                    updateData,
                    { headers: { aToken } }
                )
            }
            const { data } = response
            if (data.success) {
                toast.success(data.message || 'Doctor updated')
                setDoctorDetails(data.doctor)
            } else toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to delete a doctor by admin
    const deleteDoctor = async (docId) => {
        try {
            const { data } = await axios.delete(
                `${backendUrl}/api/admin/doctor/${docId}`,
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        deleteDoctor,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        doctorDetails, getDoctorDetails, updateDoctorDetails
    }

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider