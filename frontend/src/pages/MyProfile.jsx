import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Calendar, MapPin, Phone, Mail, Heart, Activity, FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const MyProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [appointments, setAppointments] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    
    const { token, backendUrl, userData, setUserData, setToken, loadUserProfileData } = useContext(AppContext);

    const loadAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } });
            if (data.success) {
                setAppointments(data.appointments);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to load appointments');
        }
    };

    useEffect(() => {
        if (token) {
            loadAppointments();
        }
    }, [token]);

    useEffect(() => {
        if (userData) {
            setEditFormData({
                name: userData.name || '',
                phone: userData.phone || '',
                gender: userData.gender || '',
                dob: userData.dob || '',
                address: userData.address || { line1: '', line2: '' }
            });
        }
    }, [userData]);

    const getInitials = (name) => {
        return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    const getStatusColor = (status) => {
        const statusColors = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };
        return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editFormData.name);
            formData.append('phone', editFormData.phone);
            formData.append('gender', editFormData.gender);
            formData.append('dob', editFormData.dob);
            formData.append('address', JSON.stringify(editFormData.address));
            
            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } });
            
            if (data.success) {
                toast.success('Profile updated successfully');
                await loadUserProfileData();
                setIsEditModalOpen(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to update profile');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(false);
        navigate('/login');
        toast.success('Logged out successfully');
    };

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {userData.image && !userData.image.includes('data:image') ? (
                                <img 
                                    src={userData.image} 
                                    alt={userData.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {getInitials(userData.name)}
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{userData.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{userData.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(userData.dob)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-md"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${
                                activeTab === 'profile'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <User className="w-5 h-5 inline mr-2" />
                            My Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${
                                activeTab === 'appointments'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Calendar className="w-5 h-5 inline mr-2" />
                            Appointments
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-6 h-6 text-purple-600" />
                                Personal Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                                    <p className="text-gray-900 font-medium">{userData.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Gender</label>
                                    <p className="text-gray-900 font-medium">{userData.gender}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900 font-medium">{userData.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone</label>
                                    <p className="text-gray-900 font-medium">{userData.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                    <p className="text-gray-900 font-medium">{formatDate(userData.dob)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Address</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.address?.line1 && `${userData.address.line1}`}
                                        {userData.address?.line2 && `, ${userData.address.line2}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Health Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Heart className="w-6 h-6 text-red-600" />
                                Health Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ayurvedic Constitution</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.constitution || 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Allergies</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.foodAllergies || 'None'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Current Medications</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.medications?.length > 0 
                                            ? userData.medications.join(', ')
                                            : 'None'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.emergencyContact || 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Height</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.height?.feet && userData.height?.inches
                                            ? `${userData.height.feet}' ${userData.height.inches}"`
                                            : 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Weight</label>
                                    <p className="text-gray-900 font-medium">
                                        {userData.weight ? `${userData.weight} kg` : 'Not specified'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
                        {appointments.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.map((appointment) => (
                                    <div 
                                        key={appointment._id}
                                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4 mb-3">
                                                    {appointment.docId?.image ? (
                                                        <img 
                                                            src={appointment.docId.image}
                                                            alt={appointment.docId.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                            {getInitials(appointment.docId?.name)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Dr. {appointment.docId?.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {appointment.docId?.speciality}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(appointment.slotDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FileText className="w-4 h-4" />
                                                        <span>{appointment.slotTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Activity className="w-4 h-4" />
                                                        <span className="capitalize">
                                                            {appointment.appointmentType || 'Consultation'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="capitalize">
                                                            {appointment.locationType || 'Clinic'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status || 'scheduled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                                <p className="text-gray-500">Your upcoming appointments will appear here</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-6">
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={editFormData.phone}
                                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <select
                                            value={editFormData.gender}
                                            onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={editFormData.dob}
                                            onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 1
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.address?.line1 || ''}
                                        onChange={(e) => setEditFormData({
                                            ...editFormData, 
                                            address: {...editFormData.address, line1: e.target.value}
                                        })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 2
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.address?.line2 || ''}
                                        onChange={(e) => setEditFormData({
                                            ...editFormData, 
                                            address: {...editFormData.address, line2: e.target.value}
                                        })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </PageTransition>
    );
};

export default MyProfile;
