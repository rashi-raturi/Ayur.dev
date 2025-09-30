import { useState, useEffect, useContext, useCallback } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { FileText, Plus, Eye, Download, Search, Calendar, Clock, User, ChevronDown, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import PrescriptionPreview from '../../components/PrescriptionPreview';
import { toast } from 'react-toastify';

const Prescriptions = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    age: '',
    gender: '',
    contactNumber: '',
    constitution: '',
    chiefComplaint: '',
    diagnosis: '',
    medications: [],
    dietaryRecommendations: '',
    lifestyleAdvice: '',
    followUpDate: ''
  });
  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    timing: '',
    instructions: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);

  useEffect(() => {
    // Fetch prescriptions from API
    const fetchPrescriptions = async () => {
      try {
        console.log('Fetching prescriptions...', { backendUrl, dToken: !!dToken });
        const { data } = await axios.get(`${backendUrl}/api/doctor/prescriptions`, {
          headers: { dToken }
        });
        console.log('Prescriptions API response:', data);
        if (data.success) {
          setPrescriptions(data.prescriptions);
        } else {
          console.error('API returned success: false', data.message);
          toast.error('Failed to load prescriptions: ' + (data.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Show error to user
        toast.error('Error loading prescriptions: ' + (error.response?.data?.message || error.message));
        
        // Only use mock data if no backend connection
        if (!backendUrl || error.response?.status === 404) {
          const mockData = [
            {
              id: 'RX001',
              patientName: 'Rajesh Kumar',
              date: '2024-01-15',
              status: 'Completed',
              medications: [{name: 'Triphala', dosage: '3g', frequency: 'Twice daily'}],
              chiefComplaint: 'Chronic digestive issues, acid reflux, and mild anxiety',
              diagnosis: 'Pitta-Vata imbalance with Mandagni (weak digestive fire)',
              doctorInfo: { name: 'Dr. Ayurvedic Sharma', registrationNumber: 'AYU12345', speciality: 'Ayurveda' },
              patientInfo: { name: 'Rajesh Kumar', age: 45, gender: 'Male', contactNumber: '+91 9876543210', constitution: 'Pitta-Vata' },
              dietaryRecommendations: 'Avoid spicy and acidic foods. Include cooling foods like cucumber, coconut water.',
              lifestyleAdvice: 'Practice pranayama daily for 15 minutes. Oil massage twice weekly.',
              followUpDate: '2024-02-15'
            }
          ];
          setPrescriptions(mockData);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (dToken && backendUrl) {
      fetchPrescriptions();
    } else {
      console.error('Missing dToken or backendUrl', { dToken: !!dToken, backendUrl });
      setLoading(false);
    }
  }, [backendUrl, dToken]);

  // Fetch patients when form is opened
  const fetchPatients = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/patients`, {
        headers: { dToken }
      });
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback to mock data
      setPatients([
        {
          id: 'P001',
          name: 'Rajesh Kumar',
          age: 45,
          gender: 'Male',
          phone: '+91 98765 43210',
          email: 'rajesh.kumar@email.com'
        },
        {
          id: 'P002',
          name: 'Priya Sharma',
          age: 32,
          gender: 'Female',
          phone: '+91 87654 32109',
          email: 'priya.sharma@email.com'
        },
        {
          id: 'P003',
          name: 'Amit Singh',
          age: 38,
          gender: 'Male',
          phone: '+91 76543 21098',
          email: 'amit.singh@email.com'
        },
        {
          id: 'P004',
          name: 'Sunita Patel',
          age: 29,
          gender: 'Female',
          phone: '+91 65432 10987',
          email: 'sunita.patel@email.com'
        }
      ]);
    }
  }, [backendUrl, dToken]);

  useEffect(() => {
    if (showCreateForm) {
      fetchPatients();
    }
  }, [showCreateForm, fetchPatients]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.phone.includes(patientSearchTerm)
  );

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      contactNumber: patient.phone
    }));
    setPatientSearchTerm(patient.name);
    setShowPatientDropdown(false);
  };

  const filteredPrescriptions = (Array.isArray(prescriptions) ? prescriptions : []).filter(prescription =>
    prescription && prescription.patientName && prescription.id &&
    (prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     prescription.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedStatus === 'All Status' || prescription.status === selectedStatus)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const addMedication = () => {
    if (currentMedication.name && currentMedication.dosage) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...currentMedication, id: Date.now() }]
      }));
      setCurrentMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        timing: '',
        instructions: ''
      });
    }
  };

  const removeMedication = (id) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id)
    }));
  };

  const handleSavePrescription = async () => {
    try {
      // Validate required fields
      if (!formData.patientId || !formData.chiefComplaint) {
        toast.error('Please select a patient and enter chief complaint');
        return;
      }

      const prescriptionData = {
        patientId: formData.patientId,
        patientInfo: {
          name: formData.patientName,
          age: formData.age,
          gender: formData.gender,
          contactNumber: formData.contactNumber,
          constitution: formData.constitution
        },
        chiefComplaint: formData.chiefComplaint,
        diagnosis: formData.diagnosis,
        medications: formData.medications,
        dietaryRecommendations: formData.dietaryRecommendations,
        lifestyleAdvice: formData.lifestyleAdvice,
        followUpDate: formData.followUpDate
      };

      let apiUrl, method;
      if (editingPrescription) {
        // Update existing prescription
        apiUrl = `${backendUrl}/api/doctor/prescription/${editingPrescription.id}`;
        method = 'put';
      } else {
        // Create new prescription
        apiUrl = `${backendUrl}/api/doctor/prescription/create`;
        method = 'post';
      }

      const { data } = await axios[method](apiUrl, prescriptionData, { headers: { dToken } });

      if (data.success) {
        if (editingPrescription) {
          // Update existing prescription in the list
          setPrescriptions(prev => prev.map(p => 
            p.id === editingPrescription.id ? { ...p, ...data.prescription } : p
          ));
          toast.success('Prescription updated successfully!');
        } else {
          // Add new prescription to the list
          setPrescriptions(prev => [data.prescription, ...prev]);
          toast.success('Prescription created successfully!');
        }
        
        setShowCreateForm(false);
        setEditingPrescription(null);
        
        // Reset form
        setFormData({
          patientId: '',
          patientName: '',
          age: '',
          gender: '',
          contactNumber: '',
          constitution: '',
          chiefComplaint: '',
          diagnosis: '',
          medications: [],
          dietaryRecommendations: '',
          lifestyleAdvice: '',
          followUpDate: ''
        });
        setSelectedPatient(null);
        setPatientSearchTerm('');
        setShowPatientDropdown(false);
        
        // Success message is already handled above
      } else {
        toast.error(data.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Error saving prescription: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePreviewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedPrescription(null);
  };

  const handleEditPrescription = (prescription) => {
    // Populate the form with prescription data
    setFormData({
      patientId: prescription.patientInfo?.id || '',
      patientName: prescription.patientInfo?.name || prescription.patientName,
      age: prescription.patientInfo?.age || '',
      gender: prescription.patientInfo?.gender || '',
      contactNumber: prescription.patientInfo?.contactNumber || '',
      constitution: prescription.patientInfo?.constitution || '',
      chiefComplaint: prescription.chiefComplaint || '',
      diagnosis: prescription.diagnosis || '',
      medications: prescription.medications || [],
      dietaryRecommendations: prescription.dietaryRecommendations || '',
      lifestyleAdvice: prescription.lifestyleAdvice || '',
      followUpDate: prescription.followUpDate ? new Date(prescription.followUpDate).toISOString().split('T')[0] : ''
    });
    
    setEditingPrescription(prescription);
    setShowCreateForm(true);
  };

  const handleDeletePrescription = (prescription) => {
    setPrescriptionToDelete(prescription);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePrescription = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${backendUrl}/api/doctor/prescription/${prescriptionToDelete.id}`, {
        headers: { dToken }
      });

      if (data.success) {
        // Remove from local state
        setPrescriptions(prev => prev.filter(p => p.id !== prescriptionToDelete.id));
        toast.success('Prescription deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete prescription');
      }
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Error deleting prescription: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setPrescriptionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPrescriptionToDelete(null);
  };

  if (showCreateForm) {
    return (
      <div className="bg-white min-h-screen w-full px-6 pt-6">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editingPrescription ? 'Edit Prescription' : 'Create New Prescription'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {editingPrescription 
                  ? 'Update the prescription details below' 
                  : 'Fill out the form to create a comprehensive Ayurvedic prescription'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPrescription(null);
                  setSelectedPatient(null);
                  setPatientSearchTerm('');
                  setShowPatientDropdown(false);
                  // Reset form data
                  setFormData({
                    patientId: '',
                    patientName: '',
                    age: '',
                    gender: '',
                    contactNumber: '',
                    constitution: '',
                    chiefComplaint: '',
                    diagnosis: '',
                    medications: [],
                    dietaryRecommendations: '',
                    lifestyleAdvice: '',
                    followUpDate: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrescription}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <FileText className="w-4 h-4" />
                {editingPrescription ? 'Update Prescription' : 'Save Prescription'}
              </button>
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Search for a patient..."
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  
                  {/* Patient Dropdown */}
                  {showPatientDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => selectPatient(patient)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">{patient.phone} • {patient.gender}, {patient.age} years</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No patients found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
                  placeholder="Auto-filled from patient data"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <input
                  type="text"
                  value={formData.gender}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
                  placeholder="Auto-filled from patient data"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
                  placeholder="Auto-filled from patient data"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Constitution (Prakriti)</label>
              <select
                value={formData.constitution}
                onChange={(e) => setFormData(prev => ({ ...prev, constitution: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-500"
              >
                <option value="">Select constitution</option>
                <option value="Vata">Vata</option>
                <option value="Pitta">Pitta</option>
                <option value="Kapha">Kapha</option>
                <option value="Vata-Pitta">Vata-Pitta</option>
                <option value="Pitta-Kapha">Pitta-Kapha</option>
                <option value="Vata-Kapha">Vata-Kapha</option>
                <option value="Tridosha">Tridosha</option>
              </select>
            </div>
          </div>

          {/* Clinical Assessment Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Clinical Assessment</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.chiefComplaint}
                onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
                placeholder="Describe the patient's main symptoms and concerns"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
                placeholder="Enter Ayurvedic diagnosis including dosha imbalance"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Medications & Formulations</h2>
            </div>

            {/* Current Medications List */}
            {formData.medications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Added Medications</h3>
                <div className="space-y-2">
                  {formData.medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{med.name}</span>
                        <span className="text-gray-600 ml-2">- {med.dosage}</span>
                        {med.frequency && <span className="text-gray-600 ml-2">({med.frequency})</span>}
                      </div>
                      <button
                        onClick={() => removeMedication(med.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Medication Form */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Add New Medication</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentMedication.name}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g., Triphala Churna"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentMedication.dosage}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g., 3g, 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select
                    value={currentMedication.frequency}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={currentMedication.duration}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timing</label>
                  <select
                    value={currentMedication.timing}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, timing: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-500"
                  >
                    <option value="">Select timing</option>
                    <option value="Before food">Before food</option>
                    <option value="After food">After food</option>
                    <option value="With food">With food</option>
                    <option value="Empty stomach">Empty stomach</option>
                    <option value="Bedtime">Bedtime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <input
                    type="text"
                    value={currentMedication.instructions}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g., Mix with warm water"
                  />
                </div>
              </div>

              <button
                onClick={addMedication}
                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recommendations</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Recommendations</label>
              <textarea
                value={formData.dietaryRecommendations}
                onChange={(e) => setFormData(prev => ({ ...prev, dietaryRecommendations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
                placeholder="Provide dietary guidelines based on constitution and condition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lifestyle Advice</label>
              <textarea
                value={formData.lifestyleAdvice}
                onChange={(e) => setFormData(prev => ({ ...prev, lifestyleAdvice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
                placeholder="Include yoga, pranayama, daily routine suggestions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen w-full pt-6">
        <div className="w-full px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-gray-50 min-h-screen w-full px-6 pt-6">
      <div className="w-full">
        {/* Header */}
        {/* Header Row with Search, Status, and New Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Prescription Management</h1>
            <p className="text-gray-600 text-sm">Create, manage, and download Ayurvedic prescriptions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Draft</option>
            </select>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Prescription
            </button>
          </div>
        </div>

        {/* Tab Interface */}
        <div className="bg-gray-100 rounded-full shadow-sm border border-gray-200 overflow-hidden mb-6 flex">
          <div
            className="flex-1 flex items-center justify-center gap-2 bg-white px-6 py-3 cursor-pointer"
          >
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">All Prescriptions ({filteredPrescriptions.length})</span>
          </div>
          <div
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Create New</span>
          </div>
        </div>

          {/* Prescription Cards */}
          <div className="p-6">
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Left Side - Patient & Prescription Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{prescription.patientName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>ID: {prescription.id}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {prescription.date ? new Date(prescription.date).toLocaleDateString() : 'N/A'}
                          </span>
                          <span>
                            {Array.isArray(prescription.medications) 
                              ? `${prescription.medications.length} medication${prescription.medications.length !== 1 ? 's' : ''}`
                              : `${prescription.medications || 0} medication${prescription.medications !== 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clinical Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</h4>
                        <p className="text-sm text-gray-600">{prescription.chiefComplaint || 'N/A'}</p>
                            {/* Divider */}
                            <hr className="border-t border-gray-200 my-4" />
                            {/* Created & Follow-up Info */}
                            <div className="flex items-center text-sm text-gray-500 gap-6">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Created: {prescription.date ? new Date(prescription.date).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Follow-up: {prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h4>
                        <p className="text-sm text-gray-600">{prescription.diagnosis || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewPrescription(prescription)}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleEditPrescription(prescription)}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePrescription(prescription)}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No prescriptions found matching your search.' : 'No prescriptions created yet.'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400 text-sm mt-2">
                    Create your first prescription to get started.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Preview Modal */}
      <PrescriptionPreview
        prescription={selectedPrescription}
        isOpen={showPreview}
        onClose={handleClosePreview}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Prescription</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the prescription for{' '}
              <span className="font-medium">{prescriptionToDelete?.patientName}</span>?
              <br />
              <span className="text-sm text-gray-500">
                Created on {prescriptionToDelete && new Date(prescriptionToDelete.date).toLocaleDateString()}
              </span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePrescription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Prescriptions;
