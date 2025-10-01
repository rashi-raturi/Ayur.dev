import { useState, useEffect, useContext, useCallback } from 'react';
import { User, ChevronLeft, ChevronRight, Save, Clock, Eye, Search, X, Plus, UtensilsCrossed } from 'lucide-react';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';

// Ayurvedic Food Database
const FOOD_DATABASE = [
  {
    id: 1,
    name: 'Basmati Rice (cooked)',
    description: 'Aromatic long-grain rice, cooling and easy to digest',
    categories: ['Grains', 'Indian', 'Sweet'],
    nutrition: { calories: 205, protein: 4.3, carbs: 44.8, fat: 0.4, fiber: 0.6 },
    servingSize: '1 cup cooked',
    servingGrams: 158
  },
  {
    id: 2,
    name: 'Moong Dal (cooked)',
    description: 'Light, easily digestible lentil, excellent for all constitutions',
    categories: ['Legumes', 'Indian', 'Sweet'],
    nutrition: { calories: 212, protein: 14.1, carbs: 38.6, fat: 0.8, fiber: 15.4 },
    servingSize: '1 cup cooked',
    servingGrams: 202
  },
  {
    id: 3,
    name: 'Spinach (cooked)',
    description: 'Iron-rich leafy green, excellent for blood building',
    categories: ['Vegetables', 'International', 'Sweet', 'Astringent'],
    nutrition: { calories: 41, protein: 5.2, carbs: 6.5, fat: 0.7, fiber: 4.3 },
    servingSize: '1 cup cooked',
    servingGrams: 180
  },
  {
    id: 4,
    name: 'Almonds (soaked)',
    description: 'Brain-healthy nuts, best when soaked overnight',
    categories: ['Nuts', 'International', 'Sweet'],
    nutrition: { calories: 69, protein: 2.5, carbs: 2.6, fat: 6, fiber: 1.4 },
    servingSize: '10 almonds',
    servingGrams: 12
  },
  {
    id: 5,
    name: 'Pure Ghee',
    description: 'Sacred clarified butter, enhances digestion and absorption',
    categories: ['Fats', 'Indian', 'Sweet'],
    nutrition: { calories: 36, protein: 0, carbs: 0, fat: 4, fiber: 0 },
    servingSize: '1 teaspoon',
    servingGrams: 4
  },
  {
    id: 6,
    name: 'Turmeric Milk (Golden Milk)',
    description: 'Anti-inflammatory drink with turmeric and warm milk',
    categories: ['Beverages', 'Indian', 'Sweet', 'Bitter'],
    nutrition: { calories: 149, protein: 7.7, carbs: 11.7, fat: 7.9, fiber: 0 },
    servingSize: '1 cup',
    servingGrams: 244
  }
];

const DietChartGenerator = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('saved'); // Start with 'saved' to show the cards
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'details'
  const [selectedChart, setSelectedChart] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Step 2 - Food Selection States
  const [step2Tab, setStep2Tab] = useState('manual'); // 'manual' or 'overview'
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [foodSearchTerm, setFoodSearchTerm] = useState('');
  const [nutritionTargets, setNutritionTargets] = useState({
    calories: 1800,
    protein: 46,
    carbs: 130,
    fat: 60,
    fiber: 26,
    iron: 15
  });

  const [formData, setFormData] = useState({
    // Patient Information
    patientId: '',
    patientName: '',
    age: '',
    gender: '',
    constitution: '',
    primaryHealthCondition: '',
    currentSymptoms: '',
    foodAllergies: '',
    healthGoals: [],
    
    // Food Selection
    selectedFoods: {
      breakfast: [],
      midMorning: [],
      lunch: [],
      eveningSnack: [],
      dinner: []
    }
  });

  const healthGoalOptions = [
    'Weight Management',
    'Digestive Health',
    'Energy Boost',
    'Immunity Building',
    'Stress Relief',
    'Better Sleep',
    'Skin Health',
    'Heart Health'
  ];

  const constitutionOptions = [
    'Vata',
    'Pitta',
    'Kapha',
    'Vata-Pitta',
    'Pitta-Kapha',
    'Vata-Kapha',
    'Tridosha'
  ];

  // Mock saved diet charts data
  const savedCharts = [
    {
      id: 1,
      patientName: 'Priya Sharma',
      constitution: 'Vata Constitution',
      age: 28,
      gender: 'female',
      totalCalories: 1850,
      created: 'Jan 15, 2024',
      modified: 'Jan 20, 2024',
      primaryCondition: 'Digestive Issues',
      tags: ['Vata Balancing', 'Digestive Support'],
      status: 'active'
    },
    {
      id: 2,
      patientName: 'Raj Kumar',
      constitution: 'Pitta Constitution',
      age: 45,
      gender: 'male',
      totalCalories: 1950,
      created: 'Jan 10, 2024',
      modified: 'Jan 18, 2024',
      primaryCondition: 'Hypertension',
      tags: ['Pitta Balancing', 'Heart Health'],
      status: 'completed'
    },
    {
      id: 3,
      patientName: 'Anita Patel',
      constitution: 'Kapha Constitution',
      age: 35,
      gender: 'female',
      totalCalories: 1650,
      created: 'Jan 8, 2024',
      modified: 'Jan 22, 2024',
      primaryCondition: 'Weight Management',
      tags: ['Kapha Balancing', 'Weight Loss'],
      status: 'paused'
    },
    {
      id: 4,
      patientName: 'Dr. Sarah Johnson',
      constitution: 'Vata-Pitta Constitution',
      age: 42,
      gender: 'female',
      totalCalories: 2100,
      created: 'Jan 25, 2024',
      modified: 'Jan 25, 2024',
      primaryCondition: 'Stress Management',
      tags: ['Stress Management', 'Sleep Support', 'Dual Constitution'],
      status: 'active'
    },
    {
      id: 5,
      patientName: 'Arjun Singh',
      constitution: 'Kapha Constitution',
      age: 29,
      gender: 'male',
      totalCalories: 1750,
      created: 'Jan 12, 2024',
      modified: 'Jan 19, 2024',
      primaryCondition: 'Metabolic Support',
      tags: ['Metabolism Boost', 'Kapha Balancing'],
      status: 'active'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleHealthGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal]
    }));
  };

  // Fetch patients
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
      toast.error('Failed to fetch patients');
    }
  }, [backendUrl, dToken]);

  // Fetch most recent prescription for a patient
  const fetchLatestPrescription = async (patientId) => {
    try {
      console.log('Fetching prescriptions for patient:', patientId);
      const { data } = await axios.get(`${backendUrl}/api/doctor/prescriptions`, {
        headers: { dToken }
      });
      console.log('Prescriptions response:', data);
      
      if (data.success && data.prescriptions) {
        // Filter prescriptions for selected patient and get the most recent
        // Convert both to strings for comparison since ObjectId might be string or object
        const patientPrescriptions = data.prescriptions.filter(
          p => p.patientId?.toString() === patientId.toString() || p.patientId === patientId
        );
        
        console.log(`Found ${patientPrescriptions.length} prescriptions for patient`);
        
        if (patientPrescriptions.length > 0) {
          // Sort by date (most recent first)
          patientPrescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
          const latestPrescription = patientPrescriptions[0];
          console.log('Latest prescription:', {
            diagnosis: latestPrescription.diagnosis,
            chiefComplaint: latestPrescription.chiefComplaint
          });
          return latestPrescription;
        } else {
          console.log('No prescriptions found for this patient');
        }
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to fetch prescription data');
    }
    return null;
  };

  // Handle patient selection
  const handlePatientSelect = async (patientId) => {
    if (!patientId) {
      setSelectedPatientId('');
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientName: '',
        age: '',
        gender: '',
        constitution: '',
        primaryHealthCondition: '',
        currentSymptoms: ''
      }));
      return;
    }

    setSelectedPatientId(patientId);
    setLoadingPatient(true);

    try {
      const patient = patients.find(p => p._id === patientId);
      if (patient) {
        // Calculate age from dob
        let age = patient.age;
        if (patient.dob && patient.age === 'N/A') {
          const birthDate = new Date(patient.dob);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Fetch latest prescription for diagnosis and chief complaint
        const latestPrescription = await fetchLatestPrescription(patientId);
        
        console.log('Setting form data with prescription:', {
          diagnosis: latestPrescription?.diagnosis,
          chiefComplaint: latestPrescription?.chiefComplaint
        });

        setFormData(prev => ({
          ...prev,
          patientId: patient._id,
          patientName: patient.name,
          age: age.toString(),
          gender: patient.gender === 'Not Selected' ? '' : patient.gender,
          constitution: patient.constitution || '',
          foodAllergies: patient.foodAllergies || '',
          primaryHealthCondition: latestPrescription?.diagnosis || '',
          currentSymptoms: latestPrescription?.chiefComplaint || ''
        }));

        // Show success message if prescription data was found
        if (latestPrescription) {
          toast.success('Patient data loaded with latest prescription info');
        } else {
          toast.info('Patient data loaded (no previous prescriptions found)');
        }
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoadingPatient(false);
    }
  };

  // Fetch patients on mount
  useEffect(() => {
    if (dToken) {
      fetchPatients();
    }
  }, [dToken, fetchPatients]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate required fields
      if (!formData.patientName || !formData.age || !formData.gender || !formData.constitution) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    toast.success('Diet chart saved successfully!');
    // TODO: Implement save functionality
  };

  const handleViewDetails = (chart) => {
    setSelectedChart(chart);
    setViewMode('details');
  };

  const handleCloseDetails = () => {
    setViewMode('grid');
    setSelectedChart(null);
  };

  const handleEditChart = () => {
    setViewMode('grid');
    setActiveTab('create');
    // TODO: Populate form with selected chart data
  };

  const steps = [
    { number: 1, label: 'Patient Info' },
    { number: 2, label: 'Food Selection' },
    { number: 3, label: 'Final Chart' }
  ];

  return (
    <div className="bg-white min-h-screen w-full p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Diet Chart Management</h1>
          <p className="text-gray-600 text-xs md:text-sm">Create, manage, and track personalized Ayurvedic meal plans</p>
        </div>

        {/* Tab Interface */}
        <div className="bg-gray-100 rounded-full shadow-sm border border-gray-200 overflow-hidden mb-4 md:mb-6 flex w-full md:w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2 cursor-pointer transition-colors text-xs md:text-sm flex-1 md:flex-initial ${
              activeTab === 'create' ? 'bg-white' : 'text-gray-600'
            }`}
          >
            <span className="text-base">+</span>
            <span className="font-medium text-gray-900 hidden sm:inline">Create New Chart</span>
            <span className="font-medium text-gray-900 sm:hidden">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2 cursor-pointer transition-colors text-xs md:text-sm flex-1 md:flex-initial ${
              activeTab === 'saved' ? 'bg-white' : 'text-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-medium text-gray-900 hidden sm:inline">Saved Charts (5)</span>
            <span className="font-medium text-gray-900 sm:hidden">Saved</span>
          </button>
        </div>

        {activeTab === 'create' ? (
          <>
            {/* Step Indicator */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between max-w-full md:max-w-3xl">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${
                          currentStep >= step.number
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step.number}
                      </div>
                      <span
                        className={`mt-1 md:mt-2 text-xs md:text-sm font-medium text-center ${
                          currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 md:mx-4 ${
                          currentStep > step.number ? 'bg-gray-900' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
              {currentStep === 1 && (
                <>
                  {/* Patient Information Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-4 h-4 text-gray-600" />
                      <h2 className="text-base font-semibold text-gray-900">Patient Information</h2>
                    </div>

                    {/* Patient Selection and Age */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Select Patient <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedPatientId}
                          onChange={(e) => handlePatientSelect(e.target.value)}
                          disabled={loadingPatient}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white text-gray-500"
                        >
                          <option value="">Select a patient</option>
                          {patients.map(patient => (
                            <option key={patient._id} value={patient._id}>
                              {patient.name} - {patient.age} {patient.gender !== 'Not Selected' ? `(${patient.gender})` : ''}
                            </option>
                          ))}
                        </select>
                        {loadingPatient && (
                          <p className="text-xs text-blue-600 mt-1">Loading patient data...</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          placeholder="Age in years"
                          readOnly={!!selectedPatientId}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                            selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Gender and Constitution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.gender}
                          readOnly={!!selectedPatientId}
                          placeholder="Gender"
                          className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                            selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Ayurvedic Constitution <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.constitution}
                          readOnly={!!selectedPatientId}
                          placeholder="Constitution"
                          className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                            selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Primary Health Condition */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Primary Health Condition
                        {selectedPatientId && formData.primaryHealthCondition && (
                          <span className="text-xs text-blue-600 ml-2">(from latest prescription)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.primaryHealthCondition}
                        onChange={(e) => handleInputChange('primaryHealthCondition', e.target.value)}
                        placeholder="e.g., Diabetes, Hypertension, Digestive issues"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                      />
                    </div>

                    {/* Current Symptoms */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Current Symptoms
                        {selectedPatientId && formData.currentSymptoms && (
                          <span className="text-xs text-blue-600 ml-2">(from latest prescription)</span>
                        )}
                      </label>
                      <textarea
                        value={formData.currentSymptoms}
                        onChange={(e) => handleInputChange('currentSymptoms', e.target.value)}
                        placeholder="Describe current symptoms and concerns"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                      />
                    </div>

                    {/* Food Allergies & Restrictions */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Food Allergies & Restrictions
                      </label>
                      <textarea
                        value={formData.foodAllergies}
                        onChange={(e) => handleInputChange('foodAllergies', e.target.value)}
                        placeholder="List any food allergies, intolerances, or dietary restrictions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                      />
                    </div>

                    {/* Health Goals */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Health Goals
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {healthGoalOptions.map(goal => (
                          <label
                            key={goal}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.healthGoals.includes(goal)}
                              onChange={() => toggleHealthGoal(goal)}
                              className="w-4 h-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div>
                  {/* Header with icon */}
                  <div className="flex items-center gap-2 mb-6">
                    <UtensilsCrossed className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Food Selection & Diet Planning</h2>
                  </div>

                  {/* Daily Nutrition Targets Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                      </div>
                      <h3 className="font-semibold text-blue-700 text-base">Daily Nutrition Targets</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Calories: <span className="font-normal">{nutritionTargets.calories}</span></p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Protein: <span className="font-normal">{nutritionTargets.protein}g</span></p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Carbs: <span className="font-normal">{nutritionTargets.carbs}g</span></p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Fat: <span className="font-normal">{nutritionTargets.fat}g</span></p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Fiber: <span className="font-normal">{nutritionTargets.fiber}g</span></p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-700">Iron: <span className="font-normal">{nutritionTargets.iron}mg</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Selection / Diet Plan Overview Toggle */}
                  <div className="bg-gray-200 rounded-2xl p-1 mb-6 flex">
                    <button
                      onClick={() => setStep2Tab('manual')}
                      className={`flex-1 py-2 rounded-xl font-medium transition-colors text-sm ${
                        step2Tab === 'manual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'bg-transparent text-gray-600'
                      }`}
                    >
                      Manual Selection
                    </button>
                    <button
                      onClick={() => setStep2Tab('overview')}
                      className={`flex-1 py-2 rounded-xl font-medium transition-colors text-sm ${
                        step2Tab === 'overview'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'bg-transparent text-gray-600'
                      }`}
                    >
                      Diet Plan Overview
                    </button>
                  </div>

                  {step2Tab === 'manual' ? (
                    <>
                      {/* Meal Type & Category Filters */}
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4">
                        <select
                          value={selectedMealType}
                          onChange={(e) => setSelectedMealType(e.target.value)}
                          className="px-3 md:px-4 py-2 rounded-xl bg-gray-100 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 w-full sm:w-[180px]"
                        >
                          <option>Breakfast</option>
                          <option>Mid-Morning</option>
                          <option>Lunch</option>
                          <option>Evening Snack</option>
                          <option>Dinner</option>
                        </select>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="px-3 md:px-4 py-2 rounded-xl bg-gray-100 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 w-full sm:w-[180px]"
                        >
                          <option>All Categories</option>
                          <option>Grains</option>
                          <option>Legumes</option>
                          <option>Vegetables</option>
                          <option>Fruits</option>
                          <option>Nuts</option>
                          <option>Fats</option>
                          <option>Beverages</option>
                        </select>
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={foodSearchTerm}
                            onChange={(e) => setFoodSearchTerm(e.target.value)}
                            placeholder="Search foods (8,000+ items)..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs md:text-sm bg-gray-100 border-0"
                          />
                        </div>
                      </div>

                      {/* Two Column Layout: Available Foods | Selected Foods */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Available Foods */}
                        <div className="lg:col-span-2">
                          <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                            Available Foods ({FOOD_DATABASE.filter(food => {
                              const matchesSearch = foodSearchTerm === '' || 
                                food.name.toLowerCase().includes(foodSearchTerm.toLowerCase()) ||
                                food.description.toLowerCase().includes(foodSearchTerm.toLowerCase());
                              const matchesCategory = selectedCategory === 'All Categories' || 
                                food.categories.includes(selectedCategory);
                              return matchesSearch && matchesCategory;
                            }).length})
                          </h3>
                          <div className="border border-gray-200 rounded-xl p-4 bg-white">
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {FOOD_DATABASE.filter(food => {
                              const matchesSearch = foodSearchTerm === '' || 
                                food.name.toLowerCase().includes(foodSearchTerm.toLowerCase()) ||
                                food.description.toLowerCase().includes(foodSearchTerm.toLowerCase());
                              const matchesCategory = selectedCategory === 'All Categories' || 
                                food.categories.includes(selectedCategory);
                              return matchesSearch && matchesCategory;
                            }).map(food => (
                              <div key={food.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                                <div className="mb-2">
                                  <h4 className="font-medium text-gray-900">{food.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{food.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {food.categories.map((cat, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-600">{food.nutrition.calories} cal, {food.nutrition.protein}g protein</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="text-xs border border-gray-300 rounded px-2 py-1"
                                      defaultValue={food.servingSize}
                                    >
                                      <option>{food.servingSize}</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        const mealKey = selectedMealType.toLowerCase().replace(/[- ]/g, '');
                                        const mealKeyMap = {
                                          'breakfast': 'breakfast',
                                          'midmorning': 'midMorning',
                                          'lunch': 'lunch',
                                          'eveningsnack': 'eveningSnack',
                                          'dinner': 'dinner'
                                        };
                                        const mappedKey = mealKeyMap[mealKey] || mealKey;
                                        
                                        setFormData(prev => ({
                                          ...prev,
                                          selectedFoods: {
                                            ...prev.selectedFoods,
                                            [mappedKey]: [...(prev.selectedFoods[mappedKey] || []), { ...food, servingSize: food.servingSize }]
                                          }
                                        }));
                                        toast.success(`Added ${food.name} to ${selectedMealType}`);
                                      }}
                                      className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add to {selectedMealType}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          </div>
                        </div>

                        {/* Selected Foods */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                            Selected Foods ({Object.values(formData.selectedFoods).flat().length})
                          </h3>
                          <div className="border border-gray-200 rounded-xl p-3 md:p-4 bg-white">
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {Object.entries(formData.selectedFoods).map(([mealType, foods]) => {
                              if (foods.length === 0) return null;
                              const mealLabels = {
                                breakfast: 'Breakfast',
                                midMorning: 'Mid-Morning',
                                lunch: 'Lunch',
                                eveningSnack: 'Evening Snack',
                                dinner: 'Dinner'
                              };
                              return (
                                <div key={mealType} className="space-y-2">
                                  {foods.map((food, idx) => (
                                    <div key={`${food.id}-${idx}`} className="bg-gray-100 rounded-lg p-3 flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900 text-sm mb-1">{food.name}</h5>
                                        <p className="text-xs text-gray-500 font-normal mb-1">
                                          {mealLabels[mealType]}
                                        </p>
                                        <p className="text-xs text-gray-700">
                                          {food.servingGrams}g • {food.nutrition.calories} cal
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedFoods: {
                                              ...prev.selectedFoods,
                                              [mealType]: prev.selectedFoods[mealType].filter((_, i) => i !== idx)
                                            }
                                          }));
                                          toast.info(`Removed ${food.name}`);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                            {Object.values(formData.selectedFoods).flat().length === 0 && (
                              <div className="text-center py-12 text-gray-400">
                                <p>No foods selected yet</p>
                                <p className="text-sm mt-2">Add foods from the available list</p>
                              </div>
                            )}
                          </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Diet Plan Overview Tab */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {/* Left Column - Daily Nutrition Summary */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">Daily Nutrition Summary</h3>
                        <div className="space-y-4">
                          {(() => {
                            const allFoods = Object.values(formData.selectedFoods).flat();
                            const totals = allFoods.reduce((acc, food) => ({
                              calories: acc.calories + (food.nutrition?.calories || 0),
                              protein: acc.protein + (food.nutrition?.protein || 0),
                              carbs: acc.carbs + (food.nutrition?.carbs || 0),
                              fat: acc.fat + (food.nutrition?.fat || 0),
                              fiber: acc.fiber + (food.nutrition?.fiber || 0)
                            }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

                            const nutrients = [
                              { name: 'Calories', current: totals.calories, target: nutritionTargets.calories, unit: '' },
                              { name: 'Protein', current: totals.protein.toFixed(1), target: nutritionTargets.protein, unit: 'g' },
                              { name: 'Carbs', current: totals.carbs.toFixed(1), target: nutritionTargets.carbs, unit: 'g' },
                              { name: 'Fat', current: totals.fat.toFixed(1), target: nutritionTargets.fat, unit: 'g' },
                              { name: 'Fiber', current: totals.fiber.toFixed(1), target: nutritionTargets.fiber, unit: 'g' }
                            ];

                            return nutrients.map((nutrient, idx) => {
                              const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100);
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{nutrient.name}</span>
                                    <span className="text-sm text-gray-600">
                                      {nutrient.current} / {nutrient.target}{nutrient.unit}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mb-1">{Math.round(percentage)}% of target</div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-black h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Right Column - Meal Distribution */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">Meal Distribution</h3>
                        <div className="space-y-6">
                          {Object.entries(formData.selectedFoods).map(([mealType, foods]) => {
                            const mealLabels = {
                              breakfast: 'Breakfast',
                              midMorning: 'Mid-Morning',
                              lunch: 'Lunch',
                              eveningSnack: 'Evening Snack',
                              dinner: 'Dinner'
                            };
                            
                            const mealTotals = foods.reduce((acc, food) => ({
                              calories: acc.calories + (food.nutrition?.calories || 0),
                              protein: acc.protein + (food.nutrition?.protein || 0),
                              carbs: acc.carbs + (food.nutrition?.carbs || 0),
                              fat: acc.fat + (food.nutrition?.fat || 0)
                            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                            return (
                              <div key={mealType} className="border-b border-gray-100 pb-4 last:border-b-0">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {mealLabels[mealType]} ({foods.length} {foods.length === 1 ? 'item' : 'items'})
                                </h4>
                                {foods.length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <p className="text-xs text-gray-600">Calories: <span className="font-medium">{mealTotals.calories}</span></p>
                                      <p className="text-xs text-gray-600">Protein: <span className="font-medium">{mealTotals.protein.toFixed(1)}g</span></p>
                                      <p className="text-xs text-gray-600">Carbs: <span className="font-medium">{mealTotals.carbs.toFixed(1)}g</span></p>
                                      <p className="text-xs text-gray-600">Fat: <span className="font-medium">{mealTotals.fat.toFixed(1)}g</span></p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {foods.map(f => f.name).join(', ')}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-400">
                                    <p>Calories: 0</p>
                                    <p className="mt-1">Protein: 0g</p>
                                    <p className="mt-1">Carbs: 0g</p>
                                    <p className="mt-1">Fat: 0g</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Final Diet Chart</h2>
                  <div className="text-center py-12 text-gray-500">
                    <p>Final diet chart preview will be displayed here</p>
                    <p className="text-sm mt-2">Review and save the complete meal plan</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium transition-colors text-sm md:text-base ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex gap-2 md:gap-3">
                {currentStep === 3 && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save Chart</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Saved Charts Tab */
          <div>
            {viewMode === 'grid' ? (
              /* Grid View */
              <>
                {/* Saved Charts Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Saved Diet Charts</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage and view your patient diet charts</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                  >
                    <span className="text-base">+</span>
                    Create New Chart
                  </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by patient name, constitution, or tags..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Status</option>
                  <option>active</option>
                  <option>completed</option>
                  <option>paused</option>
                </select>
              </div>
            </div>

            {/* Diet Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCharts.map((chart) => (
                <div
                  key={chart.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header with Name and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {chart.patientName}
                      </h3>
                      <p className="text-sm text-gray-500">{chart.constitution}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chart.status)}`}>
                      {chart.status}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Age/Gender</p>
                      <p className="font-medium text-gray-900">
                        {chart.age} / {chart.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Calories</p>
                      <p className="font-medium text-gray-900">{chart.totalCalories} kcal</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Created</p>
                      <p className="text-sm font-medium text-gray-900">{chart.created}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Modified</p>
                      <p className="text-sm font-medium text-gray-900">{chart.modified}</p>
                    </div>
                  </div>

                  {/* Primary Condition */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Primary Condition</p>
                    <p className="font-medium text-gray-900">{chart.primaryCondition}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {chart.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* View Details Button */}
                  <button 
                    onClick={() => handleViewDetails(chart)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-white transition-colors font-medium text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>
              </>
            ) : (
              /* Details View */
              <div>
                {/* Back Button Header */}
                <div className="mb-6">
                  <button
                    onClick={handleCloseDetails}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-medium mb-4"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Saved Charts
                  </button>
                </div>

                {selectedChart && (
                  <div className="space-y-4">
                    {/* Header with Status and Edit */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-xl font-bold text-gray-900 mb-1">
                            Diet Chart - {selectedChart.patientName}
                          </h1>
                          <p className="text-gray-600 text-sm">
                            Created on {selectedChart.created} • Last modified {selectedChart.modified}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedChart.status)}`}>
                            {selectedChart.status}
                          </span>
                          <button
                            onClick={handleEditChart}
                            className="px-3 py-1.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-white transition-colors text-sm flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            Edit Chart
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <h2 className="text-base font-semibold text-gray-900 mb-2">Patient Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Basic Info */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Patient Name</p>
                            <p className="text-sm font-medium text-gray-900">{selectedChart.patientName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Age</p>
                            <p className="text-sm font-medium text-gray-900">{selectedChart.age} years</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Gender</p>
                            <p className="text-sm font-medium text-gray-900">{selectedChart.gender}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Constitution (Prakriti)</p>
                            <p className="text-sm font-medium text-gray-900">{selectedChart.constitution}</p>
                          </div>
                        </div>

                        {/* Symptoms */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Symptoms</h3>
                          <div className="bg-white rounded-xl p-3">
                            <p className="text-sm text-gray-700">
                              {selectedChart.symptoms || 'No specific symptoms recorded'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Primary Condition</p>
                            <p className="text-sm font-medium text-gray-900">{selectedChart.primaryCondition}</p>
                          </div>
                        </div>

                        {/* Health Goals & Tags */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Health Goals</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedChart.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nutrition Analysis */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <h2 className="text-base font-semibold text-gray-900 mb-2">Daily Nutrition Analysis</h2>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Calories</span>
                            <span className="text-sm text-gray-600">{selectedChart.totalCalories} / 2000 kcal (16%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '16%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Protein</span>
                            <span className="text-sm text-gray-600">15g / 50g (30%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Carbs</span>
                            <span className="text-sm text-gray-600">125g / 250g (50%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Fat</span>
                            <span className="text-sm text-gray-600">1.5g / 70g (2%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '2%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Complete Diet Plan */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <h2 className="text-base font-semibold text-gray-900 mb-2">Complete Diet Plan</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column - Breakfast and Lunch */}
                        <div className="space-y-4">
                          {/* Breakfast */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-sm">Breakfast</h3>
                            </div>
                            <div className="border-l-2 border-gray-200 pl-3">
                              <div className="mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">Moong Dal (cooked)</h4>
                                <p className="text-xs text-gray-500 mt-0.5">100g • 105 calories</p>
                                <p className="text-xs text-gray-600 mt-1">Light, easily digestible lentil, excellent for all constitutions</p>
                                <div className="mt-2">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Balances all doshas
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Lunch */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-sm">Lunch</h3>
                            </div>
                            <div className="border-l-2 border-gray-200 pl-3">
                              <div className="mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">Basmati Rice (cooked)</h4>
                                <p className="text-xs text-gray-500 mt-0.5">150g • 195 calories</p>
                                <p className="text-xs text-gray-600 mt-1">Aromatic long-grain rice, cooling and easy to digest</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Balances Pitta
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Increases Kapha
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dinner */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-sm">Dinner</h3>
                            </div>
                            <div className="border-l-2 border-gray-200 pl-3">
                              <div className="mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">Spinach (cooked)</h4>
                                <p className="text-xs text-gray-500 mt-0.5">100g • 23 calories</p>
                                <p className="text-xs text-gray-600 mt-1">Iron-rich leafy green, excellent for blood building</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Reduces Pitta
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Increases Vata
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    Balances Kapha
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Mid-Morning and Evening Snack */}
                        <div className="space-y-4">
                          {/* Mid-Morning */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-sm">Mid-Morning</h3>
                            </div>
                            <div className="border-l-2 border-gray-200 pl-3">
                              <p className="text-sm text-gray-500 italic">No foods selected for this meal</p>
                            </div>
                          </div>

                          {/* Evening Snack */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-sm">Evening Snack</h3>
                            </div>
                            <div className="border-l-2 border-gray-200 pl-3">
                              <p className="text-sm text-gray-500 italic">No foods selected for this meal</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Treatment Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <h2 className="text-base font-semibold text-gray-900 mb-2">Treatment Notes & Recommendations</h2>
                      <textarea
                        readOnly
                        value={`Follow this diet plan for 30 days. Drink warm water throughout the day. Avoid cold and raw foods. Practice mindful eating and maintain regular meal times.`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-700"
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm">
                        <Save className="w-4 h-4" />
                        Download PDF
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-white transition-colors text-sm">
                        <User className="w-4 h-4" />
                        Share Chart
                      </button>
                      <button
                        onClick={handleEditChart}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-white transition-colors text-sm"
                      >
                        <User className="w-4 h-4" />
                        Edit Chart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietChartGenerator;
