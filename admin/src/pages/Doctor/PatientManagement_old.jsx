import { useState, useEffect, useContext, useCallback } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, Plus, Eye, Edit2, Phone, Calendar, User, Stethoscope, Activity, CheckCircle, Clock, AlertCircle, Users, Download, UserPlus, X, Filter } from 'lucide-react';

const PatientManagement = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [addPatientData, setAddPatientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gender: '',
    dob: ''
  });
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  
  // Edit patient states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal, medical, medications, notes

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/doctor/patients`, {
        headers: { dToken }
      });

      if (data.success) {
        setPatients(data.patients);
      } else {
        toast.error(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [dToken, backendUrl]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4" />;
      case 'Follow-up':
        return <Clock className="w-4 h-4" />;
      case 'New':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddPatientLoading(true);

    try {
      // Validate required fields
      if (!addPatientData.name || !addPatientData.email || !addPatientData.dob || !addPatientData.gender) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      formData.append('name', addPatientData.name);
      formData.append('email', addPatientData.email);
      formData.append('phone', addPatientData.phone);
      formData.append('address', JSON.stringify(addPatientData.address));
      formData.append('gender', addPatientData.gender);
      formData.append('dob', addPatientData.dob);

      const { data } = await axios.post(`${backendUrl}/api/doctor/add-patient`, formData, {
        headers: { 
          dToken,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        toast.success('Patient added successfully');
        setShowAddPatientModal(false);
        setAddPatientData({
          name: '',
          email: '',
          phone: '',
          address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          },
          gender: 'Not Selected',
          dob: ''
        });
        fetchPatients(); // Refresh patient list
      } else {
        toast.error(data.message || 'Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setAddPatientLoading(false);
    }
  };

  // Handler functions for patient editing
  const handleEditPatient = (patient) => {
    setEditPatientData({
      ...patient,
      address: typeof patient.address === 'string' 
        ? JSON.parse(patient.address || '{}') 
        : patient.address || {},
      medications: patient.medications || [],
      notes: patient.notes || '',
      constitution: patient.constitution || '',
      condition: patient.condition || ''
    });
    setIsEditMode(true);
  };

  const handleSavePatient = async () => {
    if (!editPatientData) return;
    
    setEditLoading(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/doctor/patient/${editPatientData.id}`,
        {
          ...editPatientData,
          address: JSON.stringify(editPatientData.address)
        },
        {
          headers: { dToken }
        }
      );

      if (data.success) {
        toast.success('Patient updated successfully');
        setIsEditMode(false);
        setEditPatientData(null);
        fetchPatients(); // Refresh patient list
        
        // Update the selected patient for the modal
        setSelectedPatient(data.patient);
      } else {
        toast.error(data.message || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditPatientData(null);
  };

  // Helper functions for status display
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'under treatment':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'recovered':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>;
      case 'inactive':
        return <div className="w-2 h-2 bg-slate-400 rounded-full"></div>;
      case 'under treatment':
        return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>;
      case 'recovered':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };
    if (!isOpen || !patient) return null;

    const currentData = isEditMode ? editPatientData : patient;

    const renderTabContent = () => {
      switch (activeTab) {
        case 'personal':
          return (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-8 border border-slate-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
              </div>
              {isEditMode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        type="text"
                        value={editPatientData?.name || ''}
                        onChange={(e) => setEditPatientData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={editPatientData?.email || ''}
                        onChange={(e) => setEditPatientData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                      <input
                        type="text"
                        value={editPatientData?.phone || ''}
                        onChange={(e) => setEditPatientData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Gender</label>
                      <select
                        value={editPatientData?.gender || ''}
                        onChange={(e) => setEditPatientData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={editPatientData?.dob ? new Date(editPatientData.dob).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditPatientData(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Address</label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={editPatientData?.address?.line1 || ''}
                        onChange={(e) => setEditPatientData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, line1: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2"
                        value={editPatientData?.address?.line2 || ''}
                        onChange={(e) => setEditPatientData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, line2: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={editPatientData?.address?.city || ''}
                        onChange={(e) => setEditPatientData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={editPatientData?.address?.state || ''}
                        onChange={(e) => setEditPatientData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Age</span>
                    <span className="text-slate-800 font-semibold">{currentData.age} years</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Gender</span>
                    <span className="text-slate-800 font-semibold">{currentData.gender}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Phone</span>
                    <span className="text-slate-800 font-semibold">{currentData.phone}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Email</span>
                    <span className="text-slate-800 font-semibold text-sm">{currentData.email}</span>
                  </div>
                  <div className="flex items-start justify-between py-3">
                    <span className="text-slate-600 font-medium">Address</span>
                    <span className="text-slate-800 font-semibold text-sm text-right max-w-xs">{currentData.address}</span>
                  </div>
                </div>
              )}
            </div>
          );

        case 'medical':
          return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-2xl p-8 border border-emerald-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Medical Information</h3>
              </div>
              {isEditMode ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Ayurvedic Constitution</label>
                    <select
                      value={editPatientData?.constitution || ''}
                      onChange={(e) => setEditPatientData(prev => ({ ...prev, constitution: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                    >
                      <option value="">Select Constitution</option>
                      <option value="Vata">Vata (Air & Space)</option>
                      <option value="Pitta">Pitta (Fire & Water)</option>
                      <option value="Kapha">Kapha (Earth & Water)</option>
                      <option value="Vata-Pitta">Vata-Pitta</option>
                      <option value="Pitta-Kapha">Pitta-Kapha</option>
                      <option value="Vata-Kapha">Vata-Kapha</option>
                      <option value="Tridosha">Tridosha (Balanced)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Current Health Condition</label>
                    <input
                      type="text"
                      value={editPatientData?.condition || ''}
                      onChange={(e) => setEditPatientData(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                      placeholder="Describe current health condition"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between py-3 border-b border-emerald-100">
                    <span className="text-slate-600 font-medium">Constitution</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                      {currentData.constitution || 'Not assessed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-emerald-100">
                    <span className="text-slate-600 font-medium">Current Condition</span>
                    <span className="text-slate-800 font-semibold">{currentData.condition || 'General consultation'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-slate-600 font-medium">Status</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(currentData.status)}`}>
                      {getStatusIcon(currentData.status)}
                      {currentData.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );

        case 'medications':
          return (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50/30 rounded-2xl p-8 border border-purple-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Current Medications</h3>
              </div>
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Medications & Dosage</label>
                    <textarea
                      value={editPatientData?.medications?.join('\n') || ''}
                      onChange={(e) => setEditPatientData(prev => ({ 
                        ...prev, 
                        medications: e.target.value.split('\n').filter(med => med.trim())
                      }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm resize-none"
                      rows="8"
                      placeholder="Enter medications with dosage (one per line)&#10;&#10;Example:&#10;Ashwagandha 500mg - Twice daily&#10;Triphala churna 1 tsp - Before bed&#10;Brahmi tablets 2 tabs - Morning"
                    />
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      Enter each medication on a new line with dosage instructions
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentData.medications && currentData.medications.length > 0 ? (
                    currentData.medications.map((medication, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium text-slate-800">{medication}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl p-6 border border-purple-200/50 shadow-sm text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="w-6 h-6 text-purple-500" />
                      </div>
                      <span className="text-slate-500 italic">No medications recorded</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case 'notes':
          return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-2xl p-8 border border-amber-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Doctor&apos;s Notes</h3>
              </div>
              {isEditMode ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Clinical Notes & Observations</label>
                  <textarea
                    value={editPatientData?.notes || ''}
                    onChange={(e) => setEditPatientData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 shadow-sm resize-none"
                    rows="10"
                    placeholder="Enter your clinical observations, treatment progress, recommendations, and any other relevant notes about the patient..."
                  />
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    Document patient progress, symptoms, and treatment observations
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 border border-amber-200/50 shadow-sm min-h-[200px]">
                  {currentData.notes ? (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {currentData.notes}
                    </p>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Edit2 className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-slate-500 italic">No notes available</span>
                      <p className="text-sm text-slate-400 mt-1">Click edit to add clinical observations</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">{currentData.name}</h2>
                  <p className="text-slate-200 text-lg">{currentData.condition || 'General consultation'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-300">Patient ID: {currentData.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={editLoading}
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePatient}
                      disabled={editLoading}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                    >
                      {editLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditPatient(patient)}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-200 group"
                >
                  <span className="text-lg group-hover:rotate-90 transition-transform duration-200">✕</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 bg-slate-50/50">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'personal', label: 'Personal Info', icon: User, color: 'blue' },
                { id: 'medical', label: 'Medical Info', icon: Stethoscope, color: 'emerald' },
                { id: 'medications', label: 'Medications', icon: Activity, color: 'purple' },
                { id: 'notes', label: 'Notes', icon: Edit2, color: 'amber' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-6 px-4 border-b-3 font-medium text-sm flex items-center gap-3 transition-all duration-200 ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50`
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8 max-h-[calc(90vh-300px)] overflow-y-auto">
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {renderTabContent()}
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditMode && (
            <div className="flex gap-4 p-8 pt-0">
              <button 
                onClick={() => handleEditPatient(patient)}
                className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <Edit2 className="w-5 h-5" />
                Edit Patient
              </button>
              <button className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium">
                <Calendar className="w-5 h-5" />
                Schedule Appointment
              </button>
              <button className="flex items-center gap-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-8 py-4 rounded-2xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium">
                <Phone className="w-5 h-5" />
                Contact Patient
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/50 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Patient Management</h1>
                <p className="text-slate-600 mt-1">Manage and monitor your patient records</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-100 rounded-2xl p-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-sm">{filteredPatients.length}</span>
                </div>
                <span className="text-slate-600 font-medium pr-2">Total Patients</span>
              </div>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add New Patient
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patients by name, condition, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient._id || patient.id}
              className="group bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden"
              onClick={() => handlePatientClick(patient)}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              
              <div className="relative z-10">
                {/* Patient Avatar and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${getStatusColor(patient.status)}`}>
                    {getStatusIcon(patient.status)}
                    {patient.status || 'Active'}
                  </div>
                </div>

                {/* Patient Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {patient.name}
                    </h3>
                    <p className="text-slate-500 text-sm">{patient.condition || 'General consultation'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-slate-600 text-xs">📧</span>
                      </div>
                      <span className="text-slate-600 truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-slate-600 text-xs">📱</span>
                      </div>
                      <span className="text-slate-600">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-slate-600 text-xs">🎂</span>
                      </div>
                      <span className="text-slate-600">{patient.age} years old • {patient.gender}</span>
                    </div>
                  </div>

                  {/* Constitution Badge */}
                  {patient.constitution && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                        {patient.constitution}
                      </span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientClick(patient);
                      }}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit action
                      }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No patients found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search criteria to find the patient you're looking for."
                  : "Start by adding your first patient to begin managing their care."
                }
              </p>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Patient
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Patient</h2>
                    <p className="text-slate-200 mt-1">Create a comprehensive patient record with medical details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-200 group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddPatient} className="p-8">
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        value={addPatientData.name}
                        onChange={(e) => setAddPatientData({...addPatientData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="Enter patient's full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        value={addPatientData.email}
                        onChange={(e) => setAddPatientData({...addPatientData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="patient@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                      <input
                        type="tel"
                        value={addPatientData.phone}
                        onChange={(e) => setAddPatientData({...addPatientData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Gender</label>
                      <select
                        value={addPatientData.gender}
                        onChange={(e) => setAddPatientData({...addPatientData, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="Not Selected">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={addPatientData.dob}
                        onChange={(e) => setAddPatientData({...addPatientData, dob: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-2xl p-6 border border-emerald-200/50">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Address Line 1</label>
                      <input
                        type="text"
                        value={addPatientData.address.line1}
                        onChange={(e) => setAddPatientData({
                          ...addPatientData, 
                          address: {...addPatientData.address, line1: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                        placeholder="Street address, apartment, suite, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Address Line 2</label>
                      <input
                        type="text"
                        value={addPatientData.address.line2}
                        onChange={(e) => setAddPatientData({
                          ...addPatientData, 
                          address: {...addPatientData.address, line2: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                        placeholder="Additional address information"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">City</label>
                      <input
                        type="text"
                        value={addPatientData.address.city}
                        onChange={(e) => setAddPatientData({
                          ...addPatientData, 
                          address: {...addPatientData.address, city: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">State</label>
                      <input
                        type="text"
                        value={addPatientData.address.state}
                        onChange={(e) => setAddPatientData({
                          ...addPatientData, 
                          address: {...addPatientData.address, state: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                        placeholder="State"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="flex-1 py-3 px-6 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addPatientLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {addPatientLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Patient Record...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Patient
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
                    <input
                      type="date"
                      value={addPatientData.dob}
                      onChange={(e) => setAddPatientData({...addPatientData, dob: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Address Section Divider */}
                <div className="pt-4">
                  <h2 className="text-base font-medium text-gray-900 mb-4">Address Information (Optional)</h2>
                  <div className="border-t border-gray-200 mb-4"></div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                  <input
                    type="text"
                    value={addPatientData.address.line1}
                    onChange={(e) => setAddPatientData({
                      ...addPatientData, 
                      address: {...addPatientData.address, line1: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Street address"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    value={addPatientData.address.line2}
                    onChange={(e) => setAddPatientData({
                      ...addPatientData, 
                      address: {...addPatientData.address, line2: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                {/* City, State, Pincode Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={addPatientData.address.city}
                      onChange={(e) => setAddPatientData({
                        ...addPatientData, 
                        address: {...addPatientData.address, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={addPatientData.address.state}
                      onChange={(e) => setAddPatientData({
                        ...addPatientData, 
                        address: {...addPatientData.address, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={addPatientData.address.pincode}
                      onChange={(e) => setAddPatientData({
                        ...addPatientData, 
                        address: {...addPatientData.address, pincode: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={addPatientLoading}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {addPatientLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding Patient...
                    </div>
                  ) : (
                    'Add Patient'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Modal */}
      <PatientModal
        patient={selectedPatient}
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
      />
    </div>
  );
};

export default PatientManagement;