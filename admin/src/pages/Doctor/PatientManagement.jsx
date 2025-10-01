import { useState, useEffect, useContext, useCallback } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, Plus, Eye, Edit2, Calendar, User, Stethoscope, Activity, CheckCircle, Clock, AlertCircle, Upload, FileText, Download, Loader } from 'lucide-react';
import PrescriptionPreview from '../../components/PrescriptionPreview';

const PatientManagement = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
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
    dob: '',
    constitution: '',
    condition: '',
    foodAllergies: ''
  });
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  
  // Edit patient states
  const [activeTab, setActiveTab] = useState('overview'); // overview, reports, medications, history
  
  // Prescription/Reports states
  const [prescriptions, setPrescriptions] = useState([]);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  
  // State for editable badges
  const [symptomStatuses, setSymptomStatuses] = useState({});
  const [medicationStatuses, setMedicationStatuses] = useState({});
  const [editingSymptom, setEditingSymptom] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  const [previewPrescription, setPreviewPrescription] = useState(null);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);

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
    patient.phone.includes(searchTerm) ||
    (patient.constitution && patient.constitution.toLowerCase().includes(searchTerm.toLowerCase()))
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
    fetchPrescriptions(patient.id); // Fetch prescriptions when opening modal
  };

  // Fetch prescriptions for a patient
  const fetchPrescriptions = useCallback(async (patientId) => {
    if (!patientId) return;
    
    console.log('Frontend: Fetching prescriptions for patientId:', patientId);
    
    try {
      setPrescriptionsLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/doctor/prescriptions/${patientId}`, {
        headers: { dToken }
      });

      if (data.success) {
        setPrescriptions(data.prescriptions);
        console.log('Frontend: Received prescriptions:', data.prescriptions.length);
      } else {
        toast.error(data.message || 'Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data.message || 'Failed to fetch prescriptions');
      } else {
        toast.error('Failed to fetch prescriptions');
      }
    } finally {
      setPrescriptionsLoading(false);
    }
  }, [dToken, backendUrl]);

  // Upload prescription for a patient
  const uploadPrescription = async (patientId, file) => {
    if (!file || !patientId) return;

    try {
      setUploadingPrescription(true);
      const formData = new FormData();
      formData.append('prescription', file);

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/prescription/${patientId}`,
        formData,
        {
          headers: { 
            dToken,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (data.success) {
        toast.success('Prescription uploaded successfully');
        fetchPrescriptions(patientId); // Refresh prescriptions list
      } else {
        toast.error(data.message || 'Failed to upload prescription');
      }
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Failed to upload prescription');
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleEditPatient = (patient) => {
    console.log('Editing patient:', patient);
    setEditingPatient(patient);
    setIsEditMode(true);
    
    // Pre-fill the form with patient data
    const dobValue = patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '';
    console.log('Patient DOB:', patient.dob, 'Formatted:', dobValue);
    
    setAddPatientData({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      address: {
        line1: patient.address?.line1 || '',
        line2: patient.address?.line2 || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        pincode: patient.address?.pincode || '',
        country: patient.address?.country || 'India'
      },
      gender: patient.gender && patient.gender !== 'Not Selected' ? patient.gender : '',
      dob: dobValue,
      constitution: patient.constitution || '',
      condition: patient.condition || '',
      foodAllergies: patient.foodAllergies || ''
    });
    
    setShowAddPatientModal(true);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddPatientLoading(true);

    try {
      // Validate required fields
      if (!addPatientData.name || !addPatientData.email || !addPatientData.dob || 
          !addPatientData.gender || addPatientData.gender === 'Not Selected') {
        toast.error('Please fill in all required fields');
        setAddPatientLoading(false);
        return;
      }

      // Validate patient ID in edit mode
      if (isEditMode) {
        console.log('Edit mode - editingPatient:', editingPatient);
        if (!editingPatient || !editingPatient._id) {
          console.error('Missing patient ID in edit mode:', { editingPatient, hasId: !!editingPatient?._id });
          toast.error('Invalid patient data. Please try again.');
          setAddPatientLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('name', addPatientData.name);
      formData.append('email', addPatientData.email);
      formData.append('phone', addPatientData.phone);
      formData.append('address', JSON.stringify(addPatientData.address));
      formData.append('gender', addPatientData.gender);
      formData.append('dob', addPatientData.dob);
      formData.append('constitution', addPatientData.constitution || '');
      formData.append('condition', addPatientData.condition || '');
      formData.append('foodAllergies', addPatientData.foodAllergies || '');

      let data;
      if (isEditMode && editingPatient) {
        // Edit existing patient
        console.log('Updating patient with ID:', editingPatient._id);
        console.log('Update data:', {
          name: addPatientData.name,
          email: addPatientData.email,
          phone: addPatientData.phone,
          gender: addPatientData.gender,
          dob: addPatientData.dob
        });
        const response = await axios.put(`${backendUrl}/api/doctor/patient/${editingPatient._id}`, formData, {
          headers: { 
            dToken,
            'Content-Type': 'multipart/form-data'
          }
        });
        data = response.data;
        console.log('Update response:', data);
      } else {
        // Add new patient
        const response = await axios.post(`${backendUrl}/api/doctor/add-patient`, formData, {
          headers: { 
            dToken,
            'Content-Type': 'multipart/form-data'
          }
        });
        data = response.data;
      }

      if (data.success) {
        toast.success(isEditMode ? 'Patient updated successfully' : 'Patient added successfully');
        setShowAddPatientModal(false);
        setIsEditMode(false);
        setEditingPatient(null);
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
          gender: '',
          dob: '',
          constitution: '',
          condition: '',
          foodAllergies: ''
        });
        fetchPatients(); // Refresh patient list
      } else {
        toast.error(data.message || (isEditMode ? 'Failed to update patient' : 'Failed to add patient'));
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(isEditMode ? 'Failed to update patient' : 'Failed to add patient');
    } finally {
      setAddPatientLoading(false);
    }
  };

  const PatientModal = ({ patient, isOpen, onClose }) => {
    if (!isOpen || !patient) return null;

    const currentData = patient;

    // Helper function to get chief complaints from all prescriptions
    const getAllSymptoms = () => {
      const allComplaints = [];
      prescriptions.forEach(prescription => {
        // Get chief complaint from new schema
        if (prescription.chiefComplaint) {
          allComplaints.push(prescription.chiefComplaint);
        }
        // Also check old schema symptoms for backward compatibility
        if (prescription.symptoms && prescription.symptoms.length > 0) {
          allComplaints.push(...prescription.symptoms);
        }
      });
      return [...new Set(allComplaints)]; // Remove duplicates
    };

    // Helper function to get medications from all prescriptions
    const getAllMedicines = () => {
      const allMedicines = [];
      prescriptions.forEach(prescription => {
        // Get medications from new schema (structured objects)
        if (prescription.medications && Array.isArray(prescription.medications) && prescription.medications.length > 0) {
          prescription.medications.forEach(medication => {
            // Check if medication is an object (new schema) or string (old schema)
            if (typeof medication === 'object' && medication !== null) {
              allMedicines.push({
                fullText: medication.name,
                name: medication.name || '',
                dosage: medication.dosage || '',
                frequency: medication.frequency || '',
                duration: medication.duration || '',
                timing: medication.timing || '',
                instructions: medication.instructions || '',
                date: prescription.date || prescription.createdAt
              });
            } else if (typeof medication === 'string') {
              // Handle old schema string format
              const parts = medication.split(' - ');
              allMedicines.push({
                fullText: medication,
                name: parts[0] || medication,
                dosage: parts[1] || '',
                frequency: parts[2] || '',
                duration: parts[3] || '',
                date: prescription.date || prescription.createdAt
              });
            }
          });
        }
        // Also check old schema medicines for backward compatibility
        else if (prescription.medicines && prescription.medicines.length > 0) {
          prescription.medicines.forEach(medicine => {
            // Try to parse medicine string to extract name, dosage, etc.
            const parts = medicine.split(' - ');
            allMedicines.push({
              fullText: medicine,
              name: parts[0] || medicine,
              dosage: parts[1] || '',
              frequency: parts[2] || '',
              duration: parts[3] || '',
              date: prescription.date || prescription.createdAt
            });
          });
        }
      });
      return allMedicines;
    };

    // Helper function to get symptom status
    const getSymptomStatus = (symptom, index) => {
      const customStatus = symptomStatuses[symptom];
      if (customStatus) return customStatus;
      
      const statuses = ['Improving', 'Mild', 'Resolved', 'Ongoing', 'Severe'];
      const colors = [
        'bg-green-100 text-green-800',
        'bg-yellow-100 text-yellow-800', 
        'bg-blue-100 text-blue-800',
        'bg-orange-100 text-orange-800',
        'bg-red-100 text-red-800'
      ];
      const statusIndex = index % statuses.length;
      return {
        status: statuses[statusIndex],
        color: colors[statusIndex]
      };
    };

    // Status options for symptoms
    const symptomStatusOptions = [
      { value: 'Improving', label: 'Improving', color: 'bg-green-100 text-green-800' },
      { value: 'Mild', label: 'Mild', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'Moderate', label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
      { value: 'Severe', label: 'Severe', color: 'bg-red-100 text-red-800' },
      { value: 'Resolved', label: 'Resolved', color: 'bg-blue-100 text-blue-800' },
      { value: 'Ongoing', label: 'Ongoing', color: 'bg-purple-100 text-purple-800' },
      { value: 'New', label: 'New', color: 'bg-gray-100 text-gray-800' }
    ];

    // Status options for medications
    const medicationStatusOptions = [
      { value: 'Active', label: 'Active', color: 'bg-green-100 text-green-800' },
      { value: 'Completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
      { value: 'Discontinued', label: 'Discontinued', color: 'bg-red-100 text-red-800' },
      { value: 'On Hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'Reduced', label: 'Reduced', color: 'bg-orange-100 text-orange-800' },
      { value: 'Increased', label: 'Increased', color: 'bg-purple-100 text-purple-800' }
    ];

    // Helper functions for status management
    const updateSymptomStatus = (symptom, newStatus) => {
      const statusOption = symptomStatusOptions.find(opt => opt.value === newStatus);
      setSymptomStatuses(prev => ({
        ...prev,
        [symptom]: {
          status: statusOption.value,
          color: statusOption.color
        }
      }));
      setEditingSymptom(null);
    };

    const updateMedicationStatus = (medicationName, newStatus) => {
      const statusOption = medicationStatusOptions.find(opt => opt.value === newStatus);
      setMedicationStatuses(prev => ({
        ...prev,
        [medicationName]: {
          status: statusOption.value,
          color: statusOption.color
        }
      }));
      setEditingMedication(null);
    };

    const getMedicationStatus = (medicationName) => {
      return medicationStatuses[medicationName] || { status: 'Active', color: 'bg-green-100 text-green-800' };
    };

    const renderOverviewContent = () => {
      const symptoms = getAllSymptoms();
      
      return (
        <div className="space-y-6">
          {/* Current Symptoms Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Current Symptoms & Chief Complaints
            </h3>
            <div className="space-y-3">
              {symptoms.length > 0 ? (
                symptoms.map((symptom, index) => {
                  const { status, color } = getSymptomStatus(symptom, index);
                  const isEditing = editingSymptom === symptom;
                  
                  return (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="font-medium text-gray-900">{symptom}</div>
                        <div className="text-sm text-gray-500">From prescription records</div>
                      </div>
                      
                      {/* Editable Status Badge */}
                      <div className="relative">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={status}
                              onChange={(e) => updateSymptomStatus(symptom, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                              onBlur={() => setEditingSymptom(null)}
                            >
                              {symptomStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingSymptom(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSymptom(symptom)}
                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                            title="Click to edit status"
                          >
                            {status}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No symptoms or complaints recorded</p>
                  <p className="text-sm text-gray-400">Chief complaints and symptoms will appear here when prescriptions are created</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {prescriptions.length > 0 ? (
                prescriptions.slice(0, 3).map((prescription, index) => (
                  <div key={prescription._id || index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">Prescription Upload</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Medical Record
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {prescription.symptoms && prescription.symptoms.length > 0 
                          ? `Symptoms: ${prescription.symptoms.slice(0, 2).map(symptom => 
                              symptom.charAt(0).toUpperCase() + symptom.slice(1).toLowerCase()
                            ).join(', ')}${prescription.symptoms.length > 2 ? '...' : ''}`
                          : 'Prescription uploaded'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(prescription.date || prescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No recent activity</p>
                  <p className="text-sm text-gray-400">Activity will appear here when prescriptions are uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    const renderMedicationsContent = () => {
      const medicines = getAllMedicines();
      
      // Sort medicines: Active/Completed/On Hold first, Discontinued at the bottom
      const sortedMedicines = [...medicines].sort((a, b) => {
        const statusA = getMedicationStatus(a.name).status;
        const statusB = getMedicationStatus(b.name).status;
        
        // Discontinued medicines go to bottom
        if (statusA === 'Discontinued' && statusB !== 'Discontinued') return 1;
        if (statusA !== 'Discontinued' && statusB === 'Discontinued') return -1;
        
        // Otherwise maintain original order
        return 0;
      });
      
      // Count active and discontinued medications
      const activeMedicines = sortedMedicines.filter(m => getMedicationStatus(m.name).status !== 'Discontinued');
      const discontinuedMedicines = sortedMedicines.filter(m => getMedicationStatus(m.name).status === 'Discontinued');
      
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-green-700">Medications & Supplements</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-600 font-medium">
                {activeMedicines.length} active
              </span>
              {discontinuedMedicines.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-red-600 font-medium">
                    {discontinuedMedicines.length} discontinued
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {sortedMedicines.length > 0 ? (
              <>
                {sortedMedicines.map((medicine, index) => {
                  const medicationStatus = getMedicationStatus(medicine.name);
                  const isEditing = editingMedication === medicine.name;
                  const isDiscontinued = medicationStatus.status === 'Discontinued';
                  const isFirstDiscontinued = index > 0 && 
                    !isDiscontinued && 
                    sortedMedicines[index + 1] && 
                    getMedicationStatus(sortedMedicines[index + 1].name).status === 'Discontinued';
                  
                  return (
                    <div key={index}>
                      {/* Divider before discontinued section */}
                      {isFirstDiscontinued && (
                        <div className="flex items-center gap-3 my-6">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Discontinued Medications
                          </span>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                      )}
                      
                      <div className={`bg-white rounded-lg border-l-4 p-4 shadow-sm transition-opacity ${
                        isDiscontinued 
                          ? 'border-l-red-400 opacity-60' 
                          : 'border-l-green-500'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isDiscontinued 
                                ? 'bg-red-100' 
                                : 'bg-green-100'
                            }`}>
                              <Activity className={`w-4 h-4 ${
                                isDiscontinued 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className={`font-medium text-sm capitalize ${
                                isDiscontinued 
                                  ? 'text-gray-600 line-through' 
                                  : 'text-gray-900'
                              }`}>
                                {medicine.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Added {new Date(medicine.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                      
                      {/* Editable Medication Status */}
                      <div className="relative">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={medicationStatus.status}
                              onChange={(e) => updateMedicationStatus(medicine.name, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                              onBlur={() => setEditingMedication(null)}
                            >
                              {medicationStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingMedication(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingMedication(medicine.name)}
                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${medicationStatus.color}`}
                            title="Click to edit status"
                          >
                            {medicationStatus.status}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Medicine Details */}
                    <div className="space-y-3">
                      {(medicine.dosage || medicine.frequency || medicine.duration || medicine.timing) ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {medicine.dosage && (
                              <div className="bg-blue-50 p-2 rounded-lg">
                                <div className="text-xs text-blue-600 font-medium mb-1">DOSAGE</div>
                                <div className="font-medium text-blue-800 text-sm">
                                  {medicine.dosage}
                                </div>
                              </div>
                            )}
                            {medicine.frequency && (
                              <div className="bg-purple-50 p-2 rounded-lg">
                                <div className="text-xs text-purple-600 font-medium mb-1">FREQUENCY</div>
                                <div className="font-medium text-purple-800 text-sm">
                                  {medicine.frequency}
                                </div>
                              </div>
                            )}
                            {medicine.duration && (
                              <div className="bg-orange-50 p-2 rounded-lg">
                                <div className="text-xs text-orange-600 font-medium mb-1">DURATION</div>
                                <div className="font-medium text-orange-800 text-sm">
                                  {medicine.duration}
                                </div>
                              </div>
                            )}
                            {medicine.timing && (
                              <div className="bg-green-50 p-2 rounded-lg">
                                <div className="text-xs text-green-600 font-medium mb-1">TIMING</div>
                                <div className="font-medium text-green-800 text-sm">
                                  {medicine.timing}
                                </div>
                              </div>
                            )}
                          </div>
                          {medicine.instructions && (
                            <div className="bg-gray-50 p-2 rounded-lg border-l-2 border-gray-300">
                              <div className="text-xs text-gray-600 font-medium mb-1">INSTRUCTIONS</div>
                              <div className="text-sm text-gray-700">
                                {medicine.instructions}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-xs text-gray-600">
                            <strong>Full Prescription:</strong> {medicine.fullText}
                          </div>
                        </div>
                      )}
                    </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No medications recorded</p>
                <p className="text-sm text-gray-400">
                  Medications will appear here when prescriptions with medicine details are uploaded
                </p>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderHistoryContent = () => (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Medical History</h3>
          <p className="text-sm text-gray-500">Complete timeline of patient care</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
          
          <div className="space-y-8">
            {/* Timeline Item 1 */}
            <div className="relative flex items-start">
              <div className="absolute left-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center z-10">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <div className="ml-12 bg-white rounded-lg p-4 border shadow-sm w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-gray-900">Follow-up Consultation</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium ml-auto">
                    Follow-up
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">2024-01-15</p>
                <p className="text-sm text-gray-700">
                  Regular follow-up for digestive issues. Patient showing good improvement.
                </p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative flex items-start">
              <div className="absolute left-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center z-10">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-12 bg-white rounded-lg p-4 border shadow-sm w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">Treatment Plan Update</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium ml-auto">
                    Treatment
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">2024-01-08</p>
                <p className="text-sm text-gray-700">
                  Added stress management protocol with Ashwagandha and pranayama.
                </p>
                
                {/* Progress Review Expandable */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 text-blue-600 cursor-pointer hover:text-blue-700">
                    <div className="w-5 h-5 border border-blue-300 rounded flex items-center justify-center">
                      <span className="text-xs">▶</span>
                    </div>
                    <span className="text-sm font-medium">Progress Review</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="text-xs font-medium text-green-800 mb-2">FINDINGS</h5>
                      <p className="text-sm text-green-700">
                        Improvement in digestive symptoms noted. Patient reports 70% reduction in 
                        acid reflux episodes. Sleep quality improved. However, still experiencing mild 
                        stress-related symptoms.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h5 className="text-xs font-medium text-orange-800 mb-2">RECOMMENDATIONS</h5>
                      <p className="text-sm text-orange-700">
                        Continue current herbal protocol. Added Ashwagandha for stress management. 
                        Recommended oil massage (abhyanga) twice weekly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="relative flex items-start">
              <div className="absolute left-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center z-10">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <div className="ml-12 bg-white rounded-lg p-4 border shadow-sm w-full">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Initial Diagnosis</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium ml-auto">
                    Diagnosis
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">2023-12-20</p>
                <p className="text-sm text-gray-700">
                  Diagnosed with Pitta-Vata imbalance causing digestive irregularity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderTabContent = () => {
      switch (activeTab) {
        case 'overview':
          return renderOverviewContent();
        case 'reports':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-blue-700">Reports & Prescriptions</h3>
                <span className="text-sm text-blue-600 font-medium">
                  {prescriptions.length} {prescriptions.length === 1 ? 'report' : 'reports'} in record
                </span>
              </div>

              {/* Upload Section */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload New Prescription</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload PDF prescriptions or medical reports for this patient
                  </p>
                  <div className="relative flex justify-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadPrescription(currentData.id, file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingPrescription}
                    />
                    <button
                      disabled={uploadingPrescription}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                    >
                      {uploadingPrescription ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Choose PDF File
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Only PDF files are supported. Maximum file size: 10MB
                  </p>
                </div>
              </div>

              {/* Prescriptions List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Previous Reports & Prescriptions</h4>
                
                {prescriptionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading prescriptions...</span>
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {prescriptions.map((prescription, index) => (
                      <div key={prescription._id || index} className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">Prescription Report</h5>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Active
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Date: {new Date(prescription.date || prescription.createdAt).toLocaleDateString()}
                              </p>
                              
                              {/* Symptoms */}
                              {prescription.symptoms && prescription.symptoms.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-700">Symptoms: </span>
                                  <span className="text-xs text-gray-600">
                                    {prescription.symptoms.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Medicines */}
                              {prescription.medicines && prescription.medicines.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-700">Medicines: </span>
                                  <div className="text-xs text-gray-600">
                                    {prescription.medicines.slice(0, 2).map((medicine, idx) => (
                                      <div key={idx} className="truncate">{medicine}</div>
                                    ))}
                                    {prescription.medicines.length > 2 && (
                                      <div className="text-blue-600">
                                        +{prescription.medicines.length - 2} more medicines
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Notes */}
                              {prescription.notes && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-700">Notes: </span>
                                  <span className="text-xs text-gray-600">
                                    {prescription.notes.length > 100 
                                      ? prescription.notes.substring(0, 100) + '...' 
                                      : prescription.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {prescription.filePath && (
                              <button
                                onClick={() => window.open(`${backendUrl}${prescription.filePath}`, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setPreviewPrescription(prescription);
                                setShowPrescriptionPreview(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No prescriptions found</p>
                    <p className="text-sm text-gray-400">
                      Upload the first prescription to start building the medical record
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        case 'medications':
          return renderMedicationsContent();
        case 'history':
          return renderHistoryContent();
        default:
          return renderOverviewContent();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{currentData.name} - Patient Details</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500">Complete medical record and treatment history</p>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'reports', label: 'Reports', icon: Activity },
                  { id: 'medications', label: 'Medications', icon: Activity },
                  { id: 'history', label: 'History', icon: Clock }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-200 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              {/* Patient Summary */}
              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Age</label>
                  <p className="text-sm font-medium text-gray-900">{currentData.age} years</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Gender</label>
                  <p className="text-sm font-medium text-gray-900">{currentData.gender}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Constitution</label>
                  <p className="text-sm font-medium text-gray-900">{currentData.constitution || 'Pitta-Vata'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Status</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen w-full pt-6">
        <div className="w-full">
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
    <div className="bg-white min-h-screen w-full px-6 pt-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Patient Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Manage your patient records and appointments</p>
          </div>
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>

  {/* Search Bar */}
  <div className="mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, constitution, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            />
          </div>
        </div>

  {/* Patient Table */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 overflow-hidden w-full">
          {/* Records Count */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Patient Records ({filteredPatients.length})
          </h2>
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-8 gap-6 text-sm font-bold text-gray-900">
              <div className="col-span-2">Patient</div>
              <div className="col-span-1">Age/Gender</div>
              <div className="col-span-1">Condition</div>
              <div className="col-span-1">Constitution</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Last Visit</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="px-6 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-8 gap-6 items-center">
                  {/* Patient Info */}
                  <div className="col-span-2">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.phone}</p>
                    </div>
                  </div>

                  {/* Age/Gender */}
                  <div className="col-span-1">
                    <p className="text-sm text-gray-900">{patient.age} / {patient.gender}</p>
                  </div>

                  {/* Condition */}
                  <div className="col-span-1">
                    <p className="text-sm text-gray-900">{patient.condition}</p>
                  </div>

                  {/* Constitution */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.constitution && patient.constitution !== 'Not assessed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {patient.constitution || 'Not assessed'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                      {getStatusIcon(patient.status)}
                      {patient.status}
                    </span>
                  </div>

                  {/* Last Visit */}
                  <div className="col-span-1">
                    <div>
                      <p className="text-sm text-gray-900">
                        {patient.lastVisit && patient.lastVisit !== 'To be scheduled' 
                          ? new Date(patient.lastVisit).toLocaleDateString() 
                          : '2024-01-15'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Next: {patient.nextVisit && patient.nextVisit !== 'To be scheduled' 
                          ? (patient.nextVisit === 'To be scheduled' ? 'To be scheduled' : new Date(patient.nextVisit).toLocaleDateString())
                          : '2024-01-22'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientClick(patient);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Patient"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPatient(patient);
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                        title="Edit Patient"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredPatients.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No patients found matching your search.' : 'No patients with appointments found.'}
            </p>
            {!searchTerm && (
              <p className="text-gray-400 text-sm mt-2">
                Patients will appear here when they book appointments with you.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddPatient}>
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isEditMode ? 'Edit Patient' : 'Create New Patient'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isEditMode 
                        ? 'Update patient information in your Ayurvedic practice records' 
                        : 'Fill out the form to create a comprehensive Ayurvedic patient record'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPatientModal(false);
                        setIsEditMode(false);
                        setEditingPatient(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addPatientLoading}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4" />
                      {addPatientLoading 
                        ? (isEditMode ? 'Updating...' : 'Saving...') 
                        : (isEditMode ? 'Update Patient' : 'Save Patient')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
              <div className="space-y-4">
                {/* Name and Email Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={addPatientData.name}
                      onChange={(e) => setAddPatientData({...addPatientData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={addPatientData.email}
                      onChange={(e) => setAddPatientData({...addPatientData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Contact Number, Gender, and Date of Birth Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={addPatientData.phone}
                      onChange={(e) => setAddPatientData({...addPatientData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={addPatientData.gender}
                      onChange={(e) => setAddPatientData({...addPatientData, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-500"
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
                      value={addPatientData.dob}
                      onChange={(e) => setAddPatientData({...addPatientData, dob: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Divider after Gender/DOB/Contact */}
                <div className="pt-4">
                  <div className="border-t border-gray-200 mb-4"></div>
                </div>

                {/* Constitution and Condition Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Constitution (Prakriti)
                    </label>
                    <select
                      value={addPatientData.constitution}
                      onChange={(e) => setAddPatientData({...addPatientData, constitution: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="">Select Constitution</option>
                      <option value="Vata">Vata</option>
                      <option value="Pitta">Pitta</option>
                      <option value="Kapha">Kapha</option>
                      <option value="Vata-Pitta">Vata-Pitta</option>
                      <option value="Vata-Kapha">Vata-Kapha</option>
                      <option value="Pitta-Kapha">Pitta-Kapha</option>
                      <option value="Tridosha">Tridosha</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Condition
                    </label>
                    <input
                      type="text"
                      value={addPatientData.condition}
                      onChange={(e) => setAddPatientData({...addPatientData, condition: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="e.g., Arthritis, Digestive issues"
                    />
                  </div>
                </div>

                {/* Food Allergies & Restrictions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Allergies & Restrictions
                  </label>
                  <textarea
                    value={addPatientData.foodAllergies}
                    onChange={(e) => setAddPatientData({...addPatientData, foodAllergies: e.target.value})}
                    placeholder="e.g., Dairy allergy, Gluten sensitivity, Vegetarian"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  />
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

      {/* Prescription Preview Modal */}
      <PrescriptionPreview
        prescription={previewPrescription}
        isOpen={showPrescriptionPreview}
        onClose={() => {
          setShowPrescriptionPreview(false);
          setPreviewPrescription(null);
        }}
      />
    </div>
  );
};

export default PatientManagement;