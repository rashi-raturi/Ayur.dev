import { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { User, ChevronLeft, ChevronRight, Save, Clock, Eye, Search, X, Plus, UtensilsCrossed, Calendar, Filter, SlidersHorizontal, ArrowUpDown, Tag, Coffee } from 'lucide-react';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import CustomGoalsModal from '../../components/CustomGoalsModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import AILoadingModal from '../../components/AILoadingModal';
import axios from 'axios';

const DietChartGenerator = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('saved'); // Start with 'saved' to show the cards
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'details'
  const [selectedChart, setSelectedChart] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [savedDietCharts, setSavedDietCharts] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [currentChartId, setCurrentChartId] = useState(null); // Track current chart ID for PDF download
  
  // Food database state (fetched from backend)
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Step 2 - Food Selection States
  const [step2Tab, setStep2Tab] = useState('manual'); // 'manual' or 'overview'
  const [selectedMealType, setSelectedMealType] = useState('Mon');
  const [selectedCategory, setSelectedCategory] = useState(''); // Empty = no category filter
  const [foodSearchTerm, setFoodSearchTerm] = useState('');
  
  // Food Modal States
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  
  // Advanced Filters
  const [selectedRasa, setSelectedRasa] = useState('All Rasas');
  const [selectedDoshas, setSelectedDoshas] = useState([]); // Multi-select array
  const [selectedDietType, setSelectedDietType] = useState('All'); // 'All', 'Veg', 'Veg+Egg', 'Non-Veg'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'calories', 'protein', 'carbs', 'fiber'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  
  // Serving size state for food modal
  const [foodServingSizes, setFoodServingSizes] = useState({}); // { foodId: amount }
  const [foodServingUnits, setFoodServingUnits] = useState({}); // { foodId: unit }
  
  // Custom Goals Modal State
  const [isCustomGoalsModalOpen, setIsCustomGoalsModalOpen] = useState(false);
  
  // AI Auto-Fill State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [formData, setFormData] = useState({
    // Patient Information
    patientId: '',
    patientName: '',
    age: '',
    gender: '',
    height: { feet: 0, inches: 0 },
    weight: 0,
    bowel_movements: '',
    constitution: '',
    primaryHealthCondition: '',
    currentSymptoms: '',
    foodAllergies: '',
    healthGoals: [],
    
    // Custom Nutrition Goals (default to 0 - AI will calculate if not set)
    customNutritionGoals: {
      macronutrients: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      vitamins: {
        vitamin_a: 0,
        vitamin_b1: 0,
        vitamin_b2: 0,
        vitamin_b3: 0,
        vitamin_b6: 0,
        vitamin_b12: 0,
        vitamin_c: 0,
        vitamin_d: 0,
        vitamin_e: 0,
        vitamin_k: 0,
        folate: 0
      },
      minerals: {
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0
      }
    },
    
    // Food Selection - Weekly meal plan
    weeklyMealPlan: {
      Mon: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Tue: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Wed: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Thu: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Fri: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Sat: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
      Sun: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }
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
      const { data } = await axios.get(`${backendUrl}/api/doctor/prescriptions`, {
        headers: { dToken }
      });

      
      if (data.success && data.prescriptions) {
        // Filter prescriptions for selected patient and get the most recent
        // Convert both to strings for comparison since ObjectId might be string or object
        const patientPrescriptions = data.prescriptions.filter(
          p => p.patientId?.toString() === patientId.toString() || p.patientId === patientId
        );
        
        if (patientPrescriptions.length > 0) {
          // Sort by date (most recent first)
          patientPrescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
          const latestPrescription = patientPrescriptions[0];
          
          return latestPrescription;
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
        
  

        setFormData(prev => ({
          ...prev,
          patientId: patient._id,
          patientName: patient.name,
          age: age.toString(),
          gender: patient.gender === 'Not Selected' ? '' : patient.gender,
          height: patient.height || { feet: 0, inches: 0 },
          weight: patient.weight || 0,
          bowel_movements: patient.bowel_movements || '',
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

  // Fetch food database with localStorage caching
  const fetchFoodDatabase = useCallback(async () => {
    
    const CACHE_KEY = 'ayurveda_food_database';
    const CACHE_VERSION_KEY = 'ayurveda_food_version';
    const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds (monthly cache)
    
    setLoadingFoods(true);
    try {
      // Check localStorage cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      
      if (cachedData) {
        try {
          const { foods, timestamp, version } = JSON.parse(cachedData);
          const now = Date.now();
          
          // If cache is still valid (less than 30 days old) and version matches
          if (foods && timestamp && (now - timestamp < CACHE_DURATION)) {
            const cacheAgeDays = Math.floor((now - timestamp) / 1000 / 60 / 60 / 24);
            
            setFoodDatabase(foods);
            setLoadingFoods(false);
            return;
          }
    
        } catch (e) {
          console.log('Error parsing cached data, fetching fresh:', e);
        }
      }
      
      // Cache miss or expired - fetch from API
      const { data } = await axios.get(`${backendUrl}/api/doctor/foods`, {
        headers: { dToken }
      });
      
      if (data.success) {
        // Transform the food data to match our component structure
        const transformedFoods = data.foods.map(food => ({
          id: food._id,
          food_id: food.food_id,
          name: food.name,
          name_hindi: food.name_hindi,
          description: `${food.name_hindi ? food.name_hindi + ' - ' : ''}${getAyurvedicDescription(food)}`,
          categories: [
            food.category.charAt(0).toUpperCase() + food.category.slice(1),
            ...food.ayurvedic_properties.rasa.map(r => r.charAt(0).toUpperCase() + r.slice(1))
          ],
          nutrition: {
            calories: food.macronutrients.calories_kcal,
            protein: food.macronutrients.proteins_g,
            carbs: food.macronutrients.carbohydrates_g,
            fat: food.macronutrients.fats_g,
            fiber: food.macronutrients.fiber_g
          },
          servingSize: `${food.serving_size.amount}${food.serving_size.unit}`,
          servingGrams: food.serving_size.amount,
          ayurvedicProperties: food.ayurvedic_properties,
          vitamins: food.vitamins,
          minerals: food.minerals
        }));
        
        // Save to localStorage cache with version
        try {
          const cacheData = {
            foods: transformedFoods,
            timestamp: Date.now(),
            version: data.cacheVersion || '1.0.0'
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          localStorage.setItem(CACHE_VERSION_KEY, data.cacheVersion || '1.0.0');
        
        } catch (e) {
          console.warn('Failed to cache food data in localStorage:', e);
          // If localStorage is full, clear old cache and try again
          if (e.name === 'QuotaExceededError') {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_VERSION_KEY);
            console.log('Cleared old cache due to quota exceeded');
          }
        }
        
        setFoodDatabase(transformedFoods);
        // toast.success(`Loaded ${transformedFoods.length} foods from ${data.cached ? 'server cache' : 'database'}`);
      } else {

        toast.error(data.message || 'Failed to load food database');
      }
    } catch (error) {


      toast.error('Failed to load food database: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingFoods(false);
    }
  }, [backendUrl, dToken]);

  // Helper function to get Ayurvedic description
  const getAyurvedicDescription = (food) => {
    const doshaEffects = [];
    if (food.ayurvedic_properties.dosha_effects.vata === 'decreases') doshaEffects.push('Balances Vata');
    if (food.ayurvedic_properties.dosha_effects.pitta === 'decreases') doshaEffects.push('Balances Pitta');
    if (food.ayurvedic_properties.dosha_effects.kapha === 'decreases') doshaEffects.push('Balances Kapha');
    
    const actions = food.ayurvedic_properties.karma.physical_actions.slice(0, 2).join(', ');
    return `${actions}${doshaEffects.length > 0 ? ' - ' + doshaEffects.join(', ') : ''}`;
  };

  // Fetch saved diet charts from database with caching
  const fetchSavedDietCharts = useCallback(async () => {
    if (!dToken) return;
    
    // Check cache first
    const CACHE_KEY = 'saved_diet_charts';
    const CACHE_TIMESTAMP_KEY = 'saved_diet_charts_timestamp';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      if (age < CACHE_DURATION) {
        console.log('Using cached diet charts list');
        setSavedDietCharts(JSON.parse(cachedData));
        return;
      }
    }
    
    setLoadingCharts(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/diet-charts`, {
        headers: { dToken }
      });

      console.log('Fetched diet charts:', data);

      if (data.success) {
        const charts = data.dietCharts || data.charts || [];
        setSavedDietCharts(charts);
        
        // Cache the list
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(charts));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e) {
          console.warn('Failed to cache diet charts list:', e);
        }
      } else {
        console.error('Failed to fetch diet charts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching diet charts:', error);
      toast.error('Failed to load saved diet charts');
    } finally {
      setLoadingCharts(false);
    }
  }, [backendUrl, dToken]);

  // Fetch patients, food database, and saved charts on mount
  useEffect(() => {
    if (dToken) {
      fetchPatients();
      fetchFoodDatabase();
      fetchSavedDietCharts();
    }
  }, [dToken, fetchPatients, fetchFoodDatabase, fetchSavedDietCharts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [foodSearchTerm, selectedCategory, selectedRasa, selectedDoshas, selectedDietType, sortBy, sortDirection]);

  // Check if we should open the create diet chart from navigation state
  useEffect(() => {
    if (location.state?.openCreateDietChart) {
      // Add a small delay for smooth transition after navigation
      const timer = setTimeout(() => {
        setActiveTab('create');
        setCurrentStep(1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location]);

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

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.patientId || !formData.patientName) {
        toast.error('Patient information is required');
        return;
      }

      // Prepare the data for backend
      const dietChartData = {
        patientId: formData.patientId,
        patientDetails: {
          patientName: formData.patientName,
          age: formData.age,
          gender: formData.gender,
          constitution: formData.constitution,
          primaryHealthCondition: formData.primaryHealthCondition,
          currentSymptoms: formData.currentSymptoms,
          foodAllergies: formData.foodAllergies,
          healthGoals: formData.healthGoals
        },
        customNutritionGoals: formData.customNutritionGoals,
        weeklyMealPlan: formData.weeklyMealPlan,
        prescriptionId: formData.prescriptionId || null,
        specialInstructions: formData.specialInstructions || '',
        dietaryRestrictions: formData.dietaryRestrictions || [],
        startDate: new Date(),
        endDate: null // Can be set later
      };

      // Save to backend
      const { data } = await axios.post(backendUrl + '/api/doctor/diet-chart/create', dietChartData, { 
        headers: { dToken } 
      });

      if (data.success) {
        toast.success('Diet chart saved successfully!');
        
        // Store the chart ID for PDF download
        setCurrentChartId(data.dietChart._id || data.dietChart.id);
        
        // Clear cache to force refresh
        localStorage.removeItem('saved_diet_charts');
        localStorage.removeItem('saved_diet_charts_timestamp');
        
        // Refresh the saved charts list from database
        await fetchSavedDietCharts();
        
        // Switch to saved charts tab
        setActiveTab('saved');
        
        // Reset form for new chart
        setCurrentStep(1);
        setCurrentChartId(null); // Reset chart ID
        setFormData({
          patientId: '',
          patientName: '',
          age: '',
          gender: '',
          constitution: '',
          primaryHealthCondition: '',
          currentSymptoms: '',
          foodAllergies: '',
          healthGoals: [],
          customNutritionGoals: {
            macronutrients: {
              calories: 2000,
              protein: 50,
              carbs: 250,
              fat: 65,
              fiber: 25
            },
            vitamins: {
              vitamin_a: 700,
              vitamin_b1: 1.1,
              vitamin_b2: 1.1,
              vitamin_b3: 14,
              vitamin_b6: 1.3,
              vitamin_b12: 2.4,
              vitamin_c: 75,
              vitamin_d: 15,
              vitamin_e: 15,
              vitamin_k: 90,
              folate: 400
            },
            minerals: {
              calcium: 1000,
              iron: 10,
              magnesium: 310,
              phosphorus: 700,
              potassium: 2600,
              sodium: 1500,
              zinc: 8
            }
          },
          weeklyMealPlan: {
            Mon: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Tue: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Wed: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Thu: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Fri: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Sat: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
            Sun: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }
          }
        });
        setSelectedPatientId('');
      } else {
        toast.error(data.message || 'Failed to save diet chart');
      }
    } catch (error) {
      console.error('Error saving diet chart:', error);
      toast.error('Failed to save diet chart. Please try again.');
    }
  };

  const handleAIAutoFill = async () => {
    try {
      // Validate Step 1 data
      if (!formData.patientName || !formData.age || !formData.constitution) {
        toast.error('Please complete patient information in Step 1 first');
        return;
      }

      setIsGeneratingAI(true);

      // Prepare patient details
      const patientDetails = {
        patientName: formData.patientName,
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        bowel_movements: formData.bowel_movements,
        constitution: formData.constitution,
        primaryHealthCondition: formData.primaryHealthCondition,
        currentSymptoms: formData.currentSymptoms,
        foodAllergies: formData.foodAllergies,
        healthGoals: formData.healthGoals
      };

      // Call backend AI generation endpoint (no custom goals - let AI calculate)
      const { data } = await axios.post(
        backendUrl + '/api/doctor/diet-chart/generate-ai',
        {
          patientDetails,
          customNutritionGoals: null // Let AI calculate goals based on patient profile
        },
        { headers: { dToken } }
      );

      if (data.success) {
        // Update form with AI-generated data
        setFormData(prev => ({
          ...prev,
          customNutritionGoals: data.customNutritionGoals || prev.customNutritionGoals,
          weeklyMealPlan: data.weeklyMealPlan
        }));

        toast.success('✨ AI has successfully generated your diet chart!');
        
        // Show supplement recommendations if provided
        if (data.considerations && data.considerations.length > 0) {
          const supplements = data.considerations.filter(c => 
            c.toLowerCase().includes('churna') || 
            c.toLowerCase().includes('triphala') || 
            c.toLowerCase().includes('ashwagandha') ||
            c.toLowerCase().includes('chyawanprash') ||
            c.toLowerCase().includes('shatavari') ||
            c.toLowerCase().includes('brahmi') ||
            c.toLowerCase().includes('guduchi') ||
            c.includes('-') // Supplement format has dashes
          );
          
          if (supplements.length > 0) {
            // Show supplement recommendations in a styled toast
            const supplementMessage = (
              <div className="text-sm">
                <p className="font-semibold mb-2">🌿 Recommended Ayurvedic Supplements:</p>
                <ul className="space-y-1 text-xs">
                  {supplements.map((supp, idx) => (
                    <li key={idx} className="pl-2">• {supp}</li>
                  ))}
                </ul>
              </div>
            );
            
            toast.info(supplementMessage, { 
              autoClose: 15000,
              style: { minWidth: '400px' }
            });
          }
        }

        // Move to Step 3 to review
        setCurrentStep(3);
      } else {
        toast.error(data.message || 'Failed to generate AI diet chart');
      }
    } catch (error) {
      console.error('Error generating AI diet chart:', error);
      toast.error('Failed to generate AI diet chart. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDownloadPDF = async (savedChart = null) => {
    try {
      setIsDownloadingPDF(true);

      let chartId = currentChartId;
      let patientName = formData.patientName;

      // If downloading from a saved chart, use that chart's data
      if (savedChart) {
        chartId = savedChart._id || savedChart.id;
        const populatedPatient = savedChart.patient_id || {};
        const patientSnapshot = savedChart.patient_snapshot || {};
        const patientDetails = savedChart.patientDetails || {};
        patientName = populatedPatient.name || patientDetails.patientName || savedChart.patientName || 'Patient';
      }

      // If chart hasn't been saved yet, save it first
      if (!chartId) {
        // Validate required fields
        if (!formData.patientId || !formData.patientName) {
          toast.error('Patient information is required');
          setIsDownloadingPDF(false);
          return;
        }

        toast.info('Saving diet chart...');

        // Prepare the data for backend
        const dietChartData = {
          patientId: formData.patientId,
          patientDetails: {
            patientName: formData.patientName,
            age: formData.age,
            gender: formData.gender,
            constitution: formData.constitution,
            primaryHealthCondition: formData.primaryHealthCondition,
            currentSymptoms: formData.currentSymptoms,
            foodAllergies: formData.foodAllergies,
            healthGoals: formData.healthGoals
          },
          customNutritionGoals: formData.customNutritionGoals,
          weeklyMealPlan: formData.weeklyMealPlan,
          prescriptionId: formData.prescriptionId || null,
          specialInstructions: formData.specialInstructions || '',
          dietaryRestrictions: formData.dietaryRestrictions || [],
          startDate: new Date(),
          endDate: null
        };

        // Save to backend
        const { data } = await axios.post(
          backendUrl + '/api/doctor/diet-chart/create', 
          dietChartData, 
          { headers: { dToken } }
        );

        if (data.success) {
          chartId = data.dietChart._id || data.dietChart.id;
          setCurrentChartId(chartId);
          toast.success('Diet chart saved successfully!');
          
          // Clear cache to force refresh
          localStorage.removeItem('saved_diet_charts');
          localStorage.removeItem('saved_diet_charts_timestamp');
          
          // Refresh the saved charts list
          await fetchSavedDietCharts();
        } else {
          toast.error(data.message || 'Failed to save diet chart');
          setIsDownloadingPDF(false);
          return;
        }
      }

      // Now generate and download the PDF
      toast.info('Generating PDF...');
      
      const response = await axios.post(
        `${backendUrl}/api/doctor/diet-chart/${chartId}/pdf`,
        {}, // empty body - docId will be extracted from token
        {
          headers: { dToken },
          responseType: 'blob'
        }
      );

      // Create a download link
      const contentDisposition = response.headers['content-disposition'];
      let filename = `diet_chart_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Extract filename from content-disposition header if available
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('✅ PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      
      // Provide more specific error messages
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          toast.error('Diet chart not found. Please save the chart first.');
        } else if (status === 401) {
          toast.error('You are not authorized to download this chart.');
        } else if (status === 500) {
          toast.error('Server error while generating PDF. Please try again.');
        } else if (data && data.message) {
          toast.error(`Error: ${data.message}`);
        } else {
          toast.error(`Failed to download PDF (${status}). Please try again.`);
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to download PDF. Please try again.');
      }
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleViewDetails = async (chart) => {
    try {
      const chartId = chart._id || chart.id;
      
      console.log('Fetching chart details for ID:', chartId);
      
      // Check cache first
      const cacheKey = `diet_chart_${chartId}`;
      const cachedChart = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      if (cachedChart && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < CACHE_DURATION) {
          console.log('Using cached chart details');
          const parsedChart = JSON.parse(cachedChart);
          console.log('Cached chart meal plan:', parsedChart.weekly_meal_plan);
          setSelectedChart(parsedChart);
          setViewMode('details');
          return;
        }
      }
      
      // Fetch full chart details with populated food references
      const { data } = await axios.get(`${backendUrl}/api/doctor/diet-chart/${chartId}`, {
        headers: { dToken }
      });

      console.log('Chart details response:', data);
      console.log('Meal plan structure:', data.dietChart?.weekly_meal_plan);

      if (data.success) {
        // Cache the chart
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data.dietChart));
          localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        } catch (e) {
          console.warn('Failed to cache chart:', e);
        }
        
        setSelectedChart(data.dietChart);
        setViewMode('details');
      } else {
        console.error('Failed to load chart details:', data.message);
        toast.error(data.message || 'Failed to load chart details');
      }
    } catch (error) {
      console.error('Error loading chart details:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load chart details');
    }
  };

  const handleCloseDetails = () => {
    setViewMode('grid');
    setSelectedChart(null);
  };

  const handleEditChart = () => {
    if (selectedChart) {
      // Populate form with selected chart data
      setFormData({
        patientId: selectedChart.patientId,
        patientName: selectedChart.patientName,
        age: selectedChart.age,
        gender: selectedChart.gender,
        constitution: selectedChart.constitution,
        primaryHealthCondition: selectedChart.primaryHealthCondition,
        currentSymptoms: selectedChart.currentSymptoms,
        foodAllergies: selectedChart.foodAllergies,
        healthGoals: selectedChart.healthGoals,
        weeklyMealPlan: selectedChart.weeklyMealPlan
      });
      setSelectedPatientId(selectedChart.patientId);
    }
    setViewMode('grid');
    setActiveTab('create');
    setCurrentStep(2); // Go to step 2 to edit meals
  };

  const handleDeleteChart = async (chartId, hardDelete = false) => {
    try {
      const url = hardDelete 
        ? `${backendUrl}/api/doctor/diet-chart/${chartId}?hardDelete=true`
        : `${backendUrl}/api/doctor/diet-chart/${chartId}`;
        
      const { data } = await axios.delete(url, {
        headers: { dToken }
      });

      if (data.success) {
        toast.success(hardDelete ? 'Diet chart permanently deleted' : 'Diet chart deleted successfully');
        
        // Clear caches
        localStorage.removeItem('saved_diet_charts');
        localStorage.removeItem('saved_diet_charts_timestamp');
        localStorage.removeItem(`diet_chart_${chartId}`);
        localStorage.removeItem(`diet_chart_${chartId}_timestamp`);
        
        // Refresh the charts list
        await fetchSavedDietCharts();
        // If we're in details view, go back to grid
        if (viewMode === 'details') {
          setViewMode('grid');
          setSelectedChart(null);
        }
      } else {
        toast.error(data.message || 'Failed to delete diet chart');
      }
    } catch (error) {
      console.error('Error deleting diet chart:', error);
      toast.error('Failed to delete diet chart. Please try again.');
    }
  };

  // Handle Add Food button click
  const handleAddFoodClick = (day, meal) => {
    // If food database is not loaded yet, fetch it first
    if (foodDatabase.length === 0 && !loadingFoods) {
      fetchFoodDatabase();
      toast.info('Loading food database...');
      return;
    }
    
    // If currently loading, don't open modal
    if (loadingFoods) {
      toast.info('Please wait, loading food database...');
      return;
    }
    
    setSelectedDay(day);
    setSelectedMeal(meal);
    setIsFoodModalOpen(true);
  };

  // Handle food addition
  // Helper function to calculate nutrition based on serving size
  const calculateNutrition = (food, servingAmount) => {
    const baseAmount = food.serving_size?.amount || 100;
    const multiplier = servingAmount / baseAmount;
    
    return {
      calories: Math.round(food.nutrition.calories * multiplier),
      protein: parseFloat((food.nutrition.protein * multiplier).toFixed(1)),
      carbs: parseFloat((food.nutrition.carbs * multiplier).toFixed(1)),
      fat: parseFloat((food.nutrition.fat * multiplier).toFixed(1)),
      fiber: parseFloat((food.nutrition.fiber * multiplier).toFixed(1))
    };
  };

  const handleAddFood = (food) => {
    // Get custom serving size and unit or use default from DB
    const servingAmount = foodServingSizes[food.id] || food.serving_size?.amount || 100;
    const servingUnit = foodServingUnits[food.id] || food.serving_size?.unit || 'g';
    
    const foodWithAmount = {
      ...food,
      amount: servingAmount,
      serving_unit: servingUnit,
      nutrition: calculateNutrition(food, servingAmount)
    };

    setFormData(prev => ({
      ...prev,
      weeklyMealPlan: {
        ...prev.weeklyMealPlan,
        [selectedDay]: {
          ...prev.weeklyMealPlan[selectedDay],
          [selectedMeal]: [...prev.weeklyMealPlan[selectedDay][selectedMeal], foodWithAmount]
        }
      }
    }));

    toast.success(`Added ${food.name} to ${selectedMeal}`);
    setIsFoodModalOpen(false);
  };

  // Handle food removal
  const handleRemoveFood = (day, meal, foodIndex) => {
    setFormData(prev => ({
      ...prev,
      weeklyMealPlan: {
        ...prev.weeklyMealPlan,
        [day]: {
          ...prev.weeklyMealPlan[day],
          [meal]: prev.weeklyMealPlan[day][meal].filter((_, index) => index !== foodIndex)
        }
      }
    }));
  };

  // Calculate total calories for a meal
  const calculateMealCalories = (day, meal) => {
    const foods = formData.weeklyMealPlan[day][meal];
    return foods.reduce((total, food) => {
      const caloriesPerGram = food.nutrition.calories / 100;
      return total + (caloriesPerGram * food.amount);
    }, 0);
  };

  // Calculate total calories for a day
  const calculateDayCalories = (day) => {
    return (
      calculateMealCalories(day, 'Breakfast') +
      calculateMealCalories(day, 'Lunch') +
      calculateMealCalories(day, 'Snacks') +
      calculateMealCalories(day, 'Dinner')
    );
  };

  // Transform saved meal plan foods to editable format
  const transformSavedMealPlanForEditing = (savedMealPlan) => {
    const transformedPlan = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

    days.forEach(day => {
      transformedPlan[day] = {};
      meals.forEach(meal => {
        const savedFoods = savedMealPlan?.[day]?.[meal] || [];
        transformedPlan[day][meal] = savedFoods.map(food => {
          // Transform to match the format expected by Step 2
          return {
            id: food._id || food.food_id || food.id,
            _id: food._id || food.food_id || food.id,
            name: food.name,
            name_hindi: food.name_hindi || '',
            category: food.category,
            categories: Array.isArray(food.categories) ? food.categories : [food.category],
            amount: food.amount || 100,
            serving_unit: food.serving_unit || 'g',
            serving_size: {
              amount: food.amount || 100,
              unit: food.serving_unit || 'g'
            },
            nutrition: food.calculated_nutrition || food.nutrition || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0
            },
            calculated_nutrition: food.calculated_nutrition || food.nutrition,
            vitamins: food.vitamins || {},
            minerals: food.minerals || {},
            ayurvedicProperties: food.ayurvedic_properties || {
              rasa: food.rasa || [],
              virya: food.virya || '',
              vipaka: food.vipaka || '',
              dosha_effects: food.dosha_effects || {}
            },
            description: food.description || `${food.name_hindi || ''} - Ayurvedic food`
          };
        });
      });
    });

    return transformedPlan;
  };

  // Get paginated foods
  const getPaginatedFoods = (filteredFoods) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFoods.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = (filteredFoods) => {
    return Math.ceil(filteredFoods.length / ITEMS_PER_PAGE);
  };

  // Get filtered and sorted foods for modal
  const getFilteredFoods = () => {
    
    let filtered = foodDatabase.filter(food => {
      // Search term filter
      const matchesSearch = food.name.toLowerCase().includes(foodSearchTerm.toLowerCase()) ||
                           food.name_hindi?.toLowerCase().includes(foodSearchTerm.toLowerCase()) ||
                           food.description.toLowerCase().includes(foodSearchTerm.toLowerCase());
      
      // Category filter (empty means no filter)
      const matchesCategory = !selectedCategory || 
                             food.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase());
      
      // Rasa (taste) filter
      const matchesRasa = selectedRasa === 'All Rasas' || 
                         (food.ayurvedicProperties?.rasa || []).some(r => 
                           r.toLowerCase() === selectedRasa.toLowerCase()
                         );
      
      // Dosha filter (multi-select - food must match ALL selected doshas)
      let matchesDosha = true;
      if (selectedDoshas.length > 0) {
        const doshaEffects = food.ayurvedicProperties?.dosha_effects;
        if (doshaEffects) {
          matchesDosha = selectedDoshas.every(selectedValue => {
            const doshaOption = getDoshaOptions().find(opt => opt.value === selectedValue);
            if (!doshaOption) return false;
            return doshaEffects[doshaOption.dosha] === doshaOption.effect;
          });
        } else {
          matchesDosha = false;
        }
      }
      
      // Diet Type filter
      const matchesDietType = selectedDietType === 'All' || getDietType(food) === selectedDietType;
      
      return matchesSearch && matchesCategory && matchesRasa && matchesDosha && matchesDietType;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'calories':
          aValue = a.nutrition.calories;
          bValue = b.nutrition.calories;
          break;
        case 'protein':
          aValue = a.nutrition.protein;
          bValue = b.nutrition.protein;
          break;
        case 'carbs':
          aValue = a.nutrition.carbs;
          bValue = b.nutrition.carbs;
          break;
        case 'fiber':
          aValue = a.nutrition.fiber;
          bValue = b.nutrition.fiber;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return filtered;
  };

  // Get unique categories from food database
  const getCategories = () => {
    const categories = new Set();
    const rasaTerms = ['sweet', 'sour', 'salty', 'bitter', 'pungent', 'astringent', 'rasa', 'taste'];
    
    foodDatabase.forEach(food => {
      food.categories.forEach(cat => {
        // Filter out any category that contains rasa/taste related terms
        const catLower = cat.toLowerCase();
        const isRasaCategory = rasaTerms.some(term => catLower.includes(term));
        if (!isRasaCategory) {
          categories.add(cat);
        }
      });
    });
    return Array.from(categories).sort();
  };

  // Get unique rasa (tastes) from food database
  const getRasaOptions = () => {
    const rasas = new Set();
    foodDatabase.forEach(food => {
      if (food.ayurvedicProperties?.rasa) {
        food.ayurvedicProperties.rasa.forEach(r => {
          rasas.add(r.charAt(0).toUpperCase() + r.slice(1));
        });
      }
    });
    return ['All Rasas', ...Array.from(rasas).sort()];
  };

  // Get serving unit options
  const getServingUnitOptions = () => {
    return [
      { value: 'g', label: 'grams (g)' },
      { value: 'ml', label: 'milliliters (ml)' },
      { value: 'cup', label: 'cup' },
      { value: 'tbsp', label: 'tablespoon (tbsp)' },
      { value: 'tsp', label: 'teaspoon (tsp)' },
      { value: 'piece', label: 'piece' },
      { value: 'slice', label: 'slice' },
      { value: 'bowl', label: 'bowl' }
    ];
  };

  // Helper function to determine diet type from categories/name
  const getDietType = (food) => {
    const categoriesStr = food.categories.join(' ').toLowerCase();
    const nameStr = food.name.toLowerCase();
    const combinedStr = `${categoriesStr} ${nameStr}`;
    
    // Non-Veg keywords
    const nonVegKeywords = ['meat', 'chicken', 'mutton', 'fish', 'seafood', 'prawn', 'crab', 'pork', 'beef', 'lamb', 'turkey', 'duck', 'bacon', 'sausage', 'non-veg', 'non veg'];
    
    // Egg keywords
    const eggKeywords = ['egg', 'omelette', 'omelet'];
    
    // Check for non-veg
    if (nonVegKeywords.some(keyword => combinedStr.includes(keyword))) {
      return 'Non-Veg';
    }
    
    // Check for egg
    if (eggKeywords.some(keyword => combinedStr.includes(keyword))) {
      return 'Veg+Egg';
    }
    
    // Default to veg
    return 'Veg';
  };

  // Get dosha filter options
  const getDoshaOptions = () => {
    return [
      { value: 'balances-vata', label: 'Balances Vata', effect: 'decreases', dosha: 'vata' },
      { value: 'balances-pitta', label: 'Balances Pitta', effect: 'decreases', dosha: 'pitta' },
      { value: 'balances-kapha', label: 'Balances Kapha', effect: 'decreases', dosha: 'kapha' },
      { value: 'increases-vata', label: 'Increases Vata', effect: 'increases', dosha: 'vata' },
      { value: 'increases-pitta', label: 'Increases Pitta', effect: 'increases', dosha: 'pitta' },
      { value: 'increases-kapha', label: 'Increases Kapha', effect: 'increases', dosha: 'kapha' }
    ];
  };

  // Toggle dosha selection
  const toggleDoshaFilter = (doshaValue) => {
    setSelectedDoshas(prev => 
      prev.includes(doshaValue) 
        ? prev.filter(d => d !== doshaValue)
        : [...prev, doshaValue]
    );
  };

  // Calculate weekly nutritional totals
  const calculateWeeklyNutrition = (mealPlan, customGoals = null) => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      vitamins: {
        vitamin_a: 0,
        vitamin_b1: 0,
        vitamin_b2: 0,
        vitamin_b3: 0,
        vitamin_b6: 0,
        vitamin_b12: 0,
        vitamin_c: 0,
        vitamin_d: 0,
        vitamin_e: 0,
        vitamin_k: 0,
        folate: 0
      },
      minerals: {
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0
      }
    };

    // Use custom goals if provided, otherwise use default recommended values
    const goals = customGoals || formData.customNutritionGoals;
    const dailyRecommended = {
      calories: goals.macronutrients.calories,
      protein: goals.macronutrients.protein,
      carbs: goals.macronutrients.carbs,
      fat: goals.macronutrients.fat,
      fiber: goals.macronutrients.fiber,
      vitamins: {
        vitamin_a: goals.vitamins.vitamin_a,
        vitamin_b1: goals.vitamins.vitamin_b1,
        vitamin_b2: goals.vitamins.vitamin_b2,
        vitamin_b3: goals.vitamins.vitamin_b3,
        vitamin_b6: goals.vitamins.vitamin_b6,
        vitamin_b12: goals.vitamins.vitamin_b12,
        vitamin_c: goals.vitamins.vitamin_c,
        vitamin_d: goals.vitamins.vitamin_d,
        vitamin_e: goals.vitamins.vitamin_e,
        vitamin_k: goals.vitamins.vitamin_k,
        folate: goals.vitamins.folate
      },
      minerals: {
        calcium: goals.minerals.calcium,
        iron: goals.minerals.iron,
        magnesium: goals.minerals.magnesium,
        phosphorus: goals.minerals.phosphorus,
        potassium: goals.minerals.potassium,
        sodium: goals.minerals.sodium,
        zinc: goals.minerals.zinc
      }
    };

    // Iterate through each day and meal
    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(mealItems => {
        mealItems.forEach(food => {
          // Handle both calculated_nutrition and macronutrients (from backend)
          const nutrition = food.calculated_nutrition || food.nutrition || food.macronutrients;
          
          if (nutrition) {
            totals.calories += nutrition.calories || nutrition.calories_kcal || 0;
            totals.protein += nutrition.protein || nutrition.proteins_g || 0;
            totals.carbs += nutrition.carbs || nutrition.carbohydrates_g || 0;
            totals.fat += nutrition.fat || nutrition.fats_g || 0;
            totals.fiber += nutrition.fiber || nutrition.fiber_g || 0;
          }

          // Add vitamins if available
          if (food.vitamins) {
            totals.vitamins.vitamin_a += food.vitamins.vitamin_a_mcg || food.vitamins.vitamin_a || 0;
            totals.vitamins.vitamin_b1 += food.vitamins.vitamin_b1_mg || food.vitamins.vitamin_b1 || 0;
            totals.vitamins.vitamin_b2 += food.vitamins.vitamin_b2_mg || food.vitamins.vitamin_b2 || 0;
            totals.vitamins.vitamin_b3 += food.vitamins.vitamin_b3_mg || food.vitamins.vitamin_b3 || 0;
            totals.vitamins.vitamin_b6 += food.vitamins.vitamin_b6_mg || food.vitamins.vitamin_b6 || 0;
            totals.vitamins.vitamin_b12 += food.vitamins.vitamin_b12_mcg || food.vitamins.vitamin_b12 || 0;
            totals.vitamins.vitamin_c += food.vitamins.vitamin_c_mg || food.vitamins.vitamin_c || 0;
            totals.vitamins.vitamin_d += food.vitamins.vitamin_d_mcg || food.vitamins.vitamin_d || 0;
            totals.vitamins.vitamin_e += food.vitamins.vitamin_e_mg || food.vitamins.vitamin_e || 0;
            totals.vitamins.vitamin_k += food.vitamins.vitamin_k_mcg || food.vitamins.vitamin_k || 0;
            totals.vitamins.folate += food.vitamins.folate_mcg || food.vitamins.folate || 0;
          }

          // Add minerals if available
          if (food.minerals) {
            totals.minerals.calcium += food.minerals.calcium_mg || food.minerals.calcium || 0;
            totals.minerals.iron += food.minerals.iron_mg || food.minerals.iron || 0;
            totals.minerals.magnesium += food.minerals.magnesium_mg || food.minerals.magnesium || 0;
            totals.minerals.phosphorus += food.minerals.phosphorus_mg || food.minerals.phosphorus || 0;
            totals.minerals.potassium += food.minerals.potassium_mg || food.minerals.potassium || 0;
            totals.minerals.sodium += food.minerals.sodium_mg || food.minerals.sodium || 0;
            totals.minerals.zinc += food.minerals.zinc_mg || food.minerals.zinc || 0;
          }
        });
      });
    });

    // Calculate daily averages and percentages
    const dailyAverages = {
      calories: parseFloat((totals.calories / 7).toFixed(1)),
      protein: parseFloat((totals.protein / 7).toFixed(1)),
      carbs: parseFloat((totals.carbs / 7).toFixed(1)),
      fat: parseFloat((totals.fat / 7).toFixed(1)),
      fiber: parseFloat((totals.fiber / 7).toFixed(1)),
      vitamins: {},
      minerals: {}
    };

    // Calculate vitamin averages
    Object.keys(totals.vitamins).forEach(key => {
      dailyAverages.vitamins[key] = parseFloat((totals.vitamins[key] / 7).toFixed(2));
    });

    // Calculate mineral averages
    Object.keys(totals.minerals).forEach(key => {
      dailyAverages.minerals[key] = parseFloat((totals.minerals[key] / 7).toFixed(2));
    });

    // Calculate percentages (don't cap at 100 to show actual values, but handle 0 goals)
    const percentages = {
      calories: dailyRecommended.calories > 0 ? Math.round((dailyAverages.calories / dailyRecommended.calories) * 100) : 0,
      protein: dailyRecommended.protein > 0 ? Math.round((dailyAverages.protein / dailyRecommended.protein) * 100) : 0,
      carbs: dailyRecommended.carbs > 0 ? Math.round((dailyAverages.carbs / dailyRecommended.carbs) * 100) : 0,
      fat: dailyRecommended.fat > 0 ? Math.round((dailyAverages.fat / dailyRecommended.fat) * 100) : 0,
      fiber: dailyRecommended.fiber > 0 ? Math.round((dailyAverages.fiber / dailyRecommended.fiber) * 100) : 0,
      vitamins: {},
      minerals: {}
    };

    // Calculate vitamin percentages (handle 0 goals)
    Object.keys(dailyRecommended.vitamins).forEach(key => {
      const avg = dailyAverages.vitamins[key] || 0;
      const rec = dailyRecommended.vitamins[key];
      percentages.vitamins[key] = rec > 0 ? Math.round((avg / rec) * 100) : 0;
    });

    // Calculate mineral percentages (handle 0 goals)
    Object.keys(dailyRecommended.minerals).forEach(key => {
      const avg = dailyAverages.minerals[key] || 0;
      const rec = dailyRecommended.minerals[key];
      percentages.minerals[key] = rec > 0 ? Math.round((avg / rec) * 100) : 0;
    });

    return {
      totals,
      dailyAverages,
      dailyRecommended,
      percentages
    };
  };

  // Render Weekly Meal Calendar (reusable for both Step 3 and Preview)
  const renderWeeklyMealCalendar = (mealPlan) => {
    console.log('renderWeeklyMealCalendar called with:', mealPlan);
    
    if (!mealPlan) {
      console.log('No meal plan provided');
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No meal plan available</p>
        </div>
      );
    }

    // Debug: Check structure
    console.log('Meal plan keys:', Object.keys(mealPlan));
    if (mealPlan.Mon) {
      console.log('Monday meals:', mealPlan.Mon);
      console.log('Monday Breakfast:', mealPlan.Mon.Breakfast);
    }

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Weekly Meal Calendar</h2>
          </div>
          <button className="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            7-Day Plan
          </button>
        </div>

        {/* Meal Time Headers */}
        <div className="flex gap-4 mb-6">
          {/* Empty space for day label alignment */}
          <div className="w-32 flex-shrink-0"></div>
          
          {/* Meal headers aligned with columns below */}
          <div className="grid grid-cols-4 gap-4 flex-1">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-2xl mb-2 block">🍳</span>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Breakfast</h3>
              <p className="text-xs text-gray-500">7:00 - 9:00 AM</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-2xl mb-2 block">🍛</span>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Lunch</h3>
              <p className="text-xs text-gray-500">12:00 - 2:00 PM</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-2xl mb-2 block">🥗</span>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Snacks</h3>
              <p className="text-xs text-gray-500">3:00 - 5:00 PM</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-2xl mb-2 block">🍲</span>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Dinner</h3>
              <p className="text-xs text-gray-500">7:00 - 9:00 PM</p>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => {
            const fullDayName = {
              Mon: 'Monday',
              Tue: 'Tuesday',
              Wed: 'Wednesday',
              Thu: 'Thursday',
              Fri: 'Friday',
              Sat: 'Saturday',
              Sun: 'Sunday'
            }[day];
            
            const dayColors = {
              Mon: 'bg-blue-50 border-blue-100',
              Tue: 'bg-green-50 border-green-100',
              Wed: 'bg-purple-50 border-purple-100',
              Thu: 'bg-amber-50 border-amber-100',
              Fri: 'bg-orange-50 border-orange-100',
              Sat: 'bg-pink-50 border-pink-100',
              Sun: 'bg-indigo-50 border-indigo-100'
            }[day];

            const dateNumber = dayIndex + 2; // Oct 2, 3, 4, etc.

            return (
              <div key={day} className={`border rounded-xl p-4 ${dayColors}`}>
                <div className="flex gap-4">
                  {/* Day Label */}
                  <div className="w-32 flex flex-col justify-center flex-shrink-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{fullDayName}</h3>
                    <p className="text-sm text-gray-500">Oct {dateNumber}</p>
                  </div>

                  {/* Meals */}
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((meal) => {
                      const dayMeals = mealPlan[day];
                      console.log(`${day} - ${meal}:`, dayMeals ? dayMeals[meal] : 'Day not found');
                      
                      const foods = (dayMeals && dayMeals[meal]) ? dayMeals[meal] : [];
                      
                      const mealCalories = foods.reduce((total, food) => {
                        const nutrition = food.calculated_nutrition || food.nutrition || food.macronutrients;
                        if (!nutrition) return total;
                        return total + (nutrition.calories || nutrition.calories_kcal || 0);
                      }, 0);

                      // Filter out unpopulated food refs
                      const validFoods = foods.filter(f => !f.food_ref || f.name);
                      
                      return (
                        <div key={meal} className="bg-white rounded-lg p-3 flex flex-col min-h-[120px]">
                          {validFoods.length > 0 ? (
                            <>
                              <div className="space-y-3 flex-1">
                                {validFoods.map((food, index) => {
                                  console.log(`Rendering food item ${index}:`, food);
                                  
                                  // Skip if this is just a food_ref (not populated)
                                  if (food.food_ref && !food.name) {
                                    console.log('Skipping unpopulated food_ref');
                                    return null;
                                  }
                                  
                                  // Handle both calculated_nutrition and macronutrients
                                  const nutrition = food.calculated_nutrition || food.nutrition || food.macronutrients;
                                  const calories = nutrition ? (nutrition.calories || nutrition.calories_kcal || 0) : 0;
                                  const servingUnit = food.serving_unit || (food.serving_size?.unit) || 'g';
                                  const amount = food.amount || (food.serving_size?.amount) || 100;
                                  const foodName = food.name || 'Unknown Food';
                                  
                                  // Extract Ayurvedic properties
                                  const rasa = food.rasa || [];
                                  const virya = food.virya || '';
                                  const doshaEffects = food.dosha_effects || {};
                                  
                                  // Determine primary dosha effect
                                  let primaryDoshaEffect = '';
                                  if (doshaEffects.vata) {
                                    primaryDoshaEffect = doshaEffects.vata === 'increases' ? 'Increases Vata' : 'Balances Vata';
                                  } else if (doshaEffects.pitta) {
                                    primaryDoshaEffect = doshaEffects.pitta === 'increases' ? 'Increases Pitta' : 'Balances Pitta';
                                  } else if (doshaEffects.kapha) {
                                    primaryDoshaEffect = doshaEffects.kapha === 'increases' ? 'Increases Kapha' : 'Balances Kapha';
                                  }
                                  
                                  return (
                                  <div key={index}>
                                    <h4 className="font-medium text-gray-900 text-sm">{foodName}</h4>
                                    <p className="text-xs text-gray-600 mb-1">{amount}{servingUnit} • {Math.round(calories)} cal</p>
                                    
                                    {/* Ayurvedic Properties Badges */}
                                    <div className="flex flex-wrap gap-1">
                                      {/* Rasa Badge */}
                                      {rasa.length > 0 && (
                                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                          {Array.isArray(rasa) ? rasa[0] : rasa}
                                        </span>
                                      )}
                                      
                                      {/* Virya Badge */}
                                      {virya && (
                                        <span className={`text-xs px-2 py-0.5 rounded border ${
                                          virya.toLowerCase().includes('hot') || virya.toLowerCase().includes('ushna')
                                            ? 'text-red-700 bg-red-50 border-red-200'
                                            : 'text-blue-700 bg-blue-50 border-blue-200'
                                        }`}>
                                          {virya}
                                        </span>
                                      )}
                                      
                                      {/* Dosha Effect Badge */}
                                      {primaryDoshaEffect && (
                                        <span className={`text-xs px-2 py-0.5 rounded border ${
                                          primaryDoshaEffect.includes('Balances')
                                            ? 'text-green-700 bg-green-50 border-green-200'
                                            : 'text-orange-700 bg-orange-50 border-orange-200'
                                        }`}>
                                          {primaryDoshaEffect}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  );
                                }).filter(Boolean)}
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-900">
                                  Total: {Math.round(mealCalories)} cal
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No foods added</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
            <span className="font-medium text-gray-900 hidden sm:inline">Saved Charts ({savedDietCharts.length})</span>
            <span className="font-medium text-gray-900 sm:hidden">Saved ({savedDietCharts.length})</span>
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="animate-fadeIn">
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

                    {/* Height, Weight, and Bowel Movements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Height */}
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Height
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="number"
                              value={formData.height.feet || ''}
                              onChange={(e) => handleInputChange('height', { ...formData.height, feet: parseInt(e.target.value) || 0 })}
                              placeholder="Feet"
                              readOnly={!!selectedPatientId}
                              min="0"
                              max="8"
                              className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                                selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                              }`}
                            />
                            <span className="text-xs text-gray-500 mt-1 block">ft</span>
                          </div>
                          <div>
                            <input
                              type="number"
                              value={formData.height.inches || ''}
                              onChange={(e) => handleInputChange('height', { ...formData.height, inches: parseInt(e.target.value) || 0 })}
                              placeholder="Inches"
                              readOnly={!!selectedPatientId}
                              min="0"
                              max="11"
                              className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                                selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                              }`}
                            />
                            <span className="text-xs text-gray-500 mt-1 block">in</span>
                          </div>
                        </div>
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={formData.weight || ''}
                          onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                          placeholder="Weight in kg"
                          readOnly={!!selectedPatientId}
                          min="0"
                          step="0.1"
                          className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                            selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>

                      {/* Bowel Movements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Bowel Movements
                        </label>
                        <select
                          value={formData.bowel_movements}
                          onChange={(e) => handleInputChange('bowel_movements', e.target.value)}
                          disabled={!!selectedPatientId}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                            selectedPatientId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                          <option value="Constipation">Constipation</option>
                          <option value="Loose">Loose/Diarrhea</option>
                        </select>
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
                  {/* Header with buttons */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Weekly Meal Planning</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsCustomGoalsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Set Custom Goals
                      </button>
                      <button 
                        onClick={handleAIAutoFill}
                        disabled={isGeneratingAI || !formData.patientName}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isGeneratingAI || !formData.patientName
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {isGeneratingAI ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <span>✨</span>
                            AI Auto-Fill
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Plan meals for {formData.patientName || 'patient'} - {formData.constitution || 'Constitution'} constitution
                  </p>

                  {/* Daily Nutrition Targets Card - Modern Minimalistic Design */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Daily Nutrition Targets</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Personalized nutritional goals for optimal health</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Macronutrients - Primary Focus */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-1 w-1 rounded-full bg-gray-900"></div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Macronutrients</h4>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Calories</p>
                          <p className="text-lg font-bold text-gray-900">{formData.customNutritionGoals.macronutrients.calories}</p>
                          <p className="text-xs text-gray-400">kcal</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Protein</p>
                          <p className="text-lg font-bold text-gray-900">{formData.customNutritionGoals.macronutrients.protein}</p>
                          <p className="text-xs text-gray-400">grams</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Carbs</p>
                          <p className="text-lg font-bold text-gray-900">{formData.customNutritionGoals.macronutrients.carbs}</p>
                          <p className="text-xs text-gray-400">grams</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Fat</p>
                          <p className="text-lg font-bold text-gray-900">{formData.customNutritionGoals.macronutrients.fat}</p>
                          <p className="text-xs text-gray-400">grams</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                          <p className="text-xs text-gray-500 mb-1">Fiber</p>
                          <p className="text-lg font-bold text-gray-900">{formData.customNutritionGoals.macronutrients.fiber}</p>
                          <p className="text-xs text-gray-400">grams</p>
                        </div>
                      </div>
                    </div>

                    {/* Vitamins & Minerals - Compact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vitamins */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1 w-1 rounded-full bg-gray-900"></div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Vitamins</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-600">Vitamin A</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_a} <span className="text-xs text-gray-500">mcg</span></span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit B1</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_b1} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit B2</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_b2} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit B3</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_b3} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit B6</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_b6} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit B12</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_b12} mcg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit C</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_c} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit D</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_d} mcg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit E</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_e} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Vit K</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.vitamin_k} mcg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Folate</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.vitamins.folate} mcg</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Minerals */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1 w-1 rounded-full bg-gray-900"></div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Minerals</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-600">Calcium</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.customNutritionGoals.minerals.calcium} <span className="text-xs text-gray-500">mg</span></span>
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-600">Iron</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.customNutritionGoals.minerals.iron} <span className="text-xs text-gray-500">mg</span></span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Magnesium</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.minerals.magnesium} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Phosphorus</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.minerals.phosphorus} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Potassium</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.minerals.potassium} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-xs text-gray-600">Sodium</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.minerals.sodium} mg</span>
                            </div>
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors col-span-2">
                              <span className="text-xs text-gray-600">Zinc</span>
                              <span className="text-xs font-semibold text-gray-900">{formData.customNutritionGoals.minerals.zinc} mg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Overview Section */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Weekly Overview</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const dayCalories = Math.round(calculateDayCalories(day));
                        return (
                          <div
                            key={day}
                            onClick={() => setSelectedMealType(day)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedMealType === day
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-center">
                              <p className={`text-sm font-semibold mb-2 ${selectedMealType === day ? 'text-white' : 'text-gray-900'}`}>
                                {day}
                              </p>
                              <p className={`text-xs ${selectedMealType === day ? 'text-gray-300' : 'text-gray-500'}`}>
                                {dayCalories} cal
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual Day Meal Plan */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      {selectedMealType || 'Monday'} Meal Plan
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Breakfast Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🍳</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Breakfast</h4>
                            <p className="text-xs text-gray-500">
                              {Math.round(calculateMealCalories(selectedMealType, 'Breakfast'))} cal
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          {formData.weeklyMealPlan[selectedMealType].Breakfast.length > 0 ? (
                            formData.weeklyMealPlan[selectedMealType].Breakfast.map((food, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">{food.name}</h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {food.amount}g • {Math.round((food.nutrition.calories / 100) * food.amount)} cal
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveFood(selectedMealType, 'Breakfast', index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400">
                              <div className="text-center">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-500">No foods added</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleAddFoodClick(selectedMealType, 'Breakfast')}
                          disabled={loadingFoods}
                          className={`w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                            loadingFoods 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {loadingFoods ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Food
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lunch Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🍛</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Lunch</h4>
                            <p className="text-xs text-gray-500">
                              {Math.round(calculateMealCalories(selectedMealType, 'Lunch'))} cal
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          {formData.weeklyMealPlan[selectedMealType].Lunch.length > 0 ? (
                            formData.weeklyMealPlan[selectedMealType].Lunch.map((food, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">{food.name}</h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {food.amount}g • {Math.round((food.nutrition.calories / 100) * food.amount)} cal
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveFood(selectedMealType, 'Lunch', index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400">
                              <div className="text-center">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-500">No foods added</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleAddFoodClick(selectedMealType, 'Lunch')}
                          disabled={loadingFoods}
                          className={`w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                            loadingFoods 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {loadingFoods ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Food
                            </>
                          )}
                        </button>
                      </div>

                      {/* Snacks Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🥗</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Snacks</h4>
                            <p className="text-xs text-gray-500">
                              {Math.round(calculateMealCalories(selectedMealType, 'Snacks'))} cal
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          {formData.weeklyMealPlan[selectedMealType].Snacks.length > 0 ? (
                            formData.weeklyMealPlan[selectedMealType].Snacks.map((food, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">{food.name}</h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {food.amount}g • {Math.round((food.nutrition.calories / 100) * food.amount)} cal
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveFood(selectedMealType, 'Snacks', index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400">
                              <div className="text-center">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-500">No foods added</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleAddFoodClick(selectedMealType, 'Snacks')}
                          disabled={loadingFoods}
                          className={`w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                            loadingFoods 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {loadingFoods ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Food
                            </>
                          )}
                        </button>
                      </div>

                      {/* Dinner Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🍲</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Dinner</h4>
                            <p className="text-xs text-gray-500">
                              {Math.round(calculateMealCalories(selectedMealType, 'Dinner'))} cal
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          {formData.weeklyMealPlan[selectedMealType].Dinner.length > 0 ? (
                            formData.weeklyMealPlan[selectedMealType].Dinner.map((food, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">{food.name}</h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {food.amount}g • {Math.round((food.nutrition.calories / 100) * food.amount)} cal
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveFood(selectedMealType, 'Dinner', index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400">
                              <div className="text-center">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-500">No foods added</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleAddFoodClick(selectedMealType, 'Dinner')}
                          disabled={loadingFoods}
                          className={`w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                            loadingFoods 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {loadingFoods ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Food
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  {/* Weekly Nutritional Overview */}
                  {(() => {
                    const nutrition = calculateWeeklyNutrition(formData.weeklyMealPlan);
                    
                    return (
                      <div className="mb-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                              <UtensilsCrossed className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Weekly Nutritional Overview</h2>
                          </div>
                          <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPDF}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md ${
                              isDownloadingPDF
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {isDownloadingPDF ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating PDF...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download PDF
                              </>
                            )}
                          </button>
                        </div>

                        {/* Macronutrients Section */}
                        <div className="mb-8">
                          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">Macronutrients</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {/* Calories */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-28 h-28 mb-4">
                                <svg className="w-28 h-28 transform -rotate-90">
                                  <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                  <circle
                                    cx="56" cy="56" r="50"
                                    stroke="#f97316"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.calories, 100) * 3.14} ${100 * 3.14}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-bold text-gray-900">{nutrition.percentages.calories}%</span>
                                  <span className="text-xs text-gray-500">daily</span>
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">Calories</h4>
                              <p className="text-sm text-gray-600">{nutrition.dailyAverages.calories}/{nutrition.dailyRecommended.calories}kcal/day</p>
                              <p className="text-xs text-gray-500">{Math.round(nutrition.totals.calories)}kcal/week</p>
                            </div>

                            {/* Protein */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-28 h-28 mb-4">
                                <svg className="w-28 h-28 transform -rotate-90">
                                  <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                  <circle
                                    cx="56" cy="56" r="50"
                                    stroke="#f97316"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.protein, 100) * 3.14} ${100 * 3.14}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-bold text-gray-900">{nutrition.percentages.protein}%</span>
                                  <span className="text-xs text-gray-500">daily</span>
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">Protein</h4>
                              <p className="text-sm text-gray-600">{nutrition.dailyAverages.protein}/{nutrition.dailyRecommended.protein}g/day</p>
                              <p className="text-xs text-gray-500">{Math.round(nutrition.totals.protein)}g/week</p>
                            </div>

                            {/* Carbs */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-28 h-28 mb-4">
                                <svg className="w-28 h-28 transform -rotate-90">
                                  <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                  <circle
                                    cx="56" cy="56" r="50"
                                    stroke="#f97316"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.carbs, 100) * 3.14} ${100 * 3.14}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-bold text-gray-900">{nutrition.percentages.carbs}%</span>
                                  <span className="text-xs text-gray-500">daily</span>
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">Carbs</h4>
                              <p className="text-sm text-gray-600">{nutrition.dailyAverages.carbs}/{nutrition.dailyRecommended.carbs}g/day</p>
                              <p className="text-xs text-gray-500">{Math.round(nutrition.totals.carbs)}g/week</p>
                            </div>

                            {/* Fat */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-28 h-28 mb-4">
                                <svg className="w-28 h-28 transform -rotate-90">
                                  <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                  <circle
                                    cx="56" cy="56" r="50"
                                    stroke="#f97316"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.fat, 100) * 3.14} ${100 * 3.14}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-bold text-gray-900">{nutrition.percentages.fat}%</span>
                                  <span className="text-xs text-gray-500">daily</span>
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">Fat</h4>
                              <p className="text-sm text-gray-600">{nutrition.dailyAverages.fat}/{nutrition.dailyRecommended.fat}g/day</p>
                              <p className="text-xs text-gray-500">{Math.round(nutrition.totals.fat)}g/week</p>
                            </div>
                          </div>
                        </div>

                        {/* Vitamins Section */}
                        <div className="mb-8">
                          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">Vitamins</h3>
                          <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                            {/* Vitamin A */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_a === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_a, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_a}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin A</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_a}/{nutrition.dailyRecommended.vitamins.vitamin_a}mcg</p>
                            </div>

                            {/* Vitamin B1 */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_b1 === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_b1, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_b1}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin B1</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_b1}/{nutrition.dailyRecommended.vitamins.vitamin_b1}mg</p>
                            </div>

                            {/* Vitamin B2 */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_b2 === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_b2, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_b2}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin B2</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_b2}/{nutrition.dailyRecommended.vitamins.vitamin_b2}mg</p>
                            </div>

                            {/* Vitamin B6 */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_b6 === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_b6, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_b6}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin B6</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_b6}/{nutrition.dailyRecommended.vitamins.vitamin_b6}mg</p>
                            </div>

                            {/* Vitamin B12 */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_b12 === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_b12, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_b12}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin B12</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_b12}/{nutrition.dailyRecommended.vitamins.vitamin_b12}mcg</p>
                            </div>

                            {/* Vitamin C */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_c === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_c, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_c}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin C</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_c}/{nutrition.dailyRecommended.vitamins.vitamin_c}mg</p>
                            </div>

                            {/* Vitamin D */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_d === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_d, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_d}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin D</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_d}/{nutrition.dailyRecommended.vitamins.vitamin_d}mcg</p>
                            </div>

                            {/* Vitamin E */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.vitamin_e === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.vitamin_e, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.vitamin_e}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Vitamin E</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.vitamin_e}/{nutrition.dailyRecommended.vitamins.vitamin_e}mg</p>
                            </div>

                            {/* Folate */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.vitamins.folate === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.vitamins.folate, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.vitamins.folate}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Folate</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.vitamins.folate}/{nutrition.dailyRecommended.vitamins.folate}mcg</p>
                            </div>
                          </div>
                        </div>

                        {/* Minerals Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">Minerals</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {/* Calcium */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.calcium === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.calcium, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.calcium}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Calcium</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.calcium}/{nutrition.dailyRecommended.minerals.calcium}mg</p>
                            </div>

                            {/* Iron */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.iron === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.iron, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.iron}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Iron</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.iron}/{nutrition.dailyRecommended.minerals.iron}mg</p>
                            </div>

                            {/* Magnesium */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.magnesium === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.magnesium, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.magnesium}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Magnesium</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.magnesium}/{nutrition.dailyRecommended.minerals.magnesium}mg</p>
                            </div>

                            {/* Phosphorus */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.phosphorus === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.phosphorus, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.phosphorus}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Phosphorus</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.phosphorus}/{nutrition.dailyRecommended.minerals.phosphorus}mg</p>
                            </div>

                            {/* Potassium */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.potassium === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.potassium, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.potassium}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Potassium</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.potassium}/{nutrition.dailyRecommended.minerals.potassium}mg</p>
                            </div>

                            {/* Zinc */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke={nutrition.percentages.minerals.zinc === 100 ? "#22c55e" : "#f97316"}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${Math.min(nutrition.percentages.minerals.zinc, 100) * 2.26} ${100 * 2.26}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{nutrition.percentages.minerals.zinc}%</span>
                                </div>
                              </div>
                              <h5 className="text-xs font-semibold text-gray-900">Zinc</h5>
                              <p className="text-xs text-gray-500">{nutrition.dailyAverages.minerals.zinc}/{nutrition.dailyRecommended.minerals.zinc}mg</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Weekly Meal Calendar */}
                  {renderWeeklyMealCalendar(formData.weeklyMealPlan)}

                  
                  
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors text-sm ${
                  currentStep === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              <div className="flex gap-3">
                {currentStep === 3 && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Chart
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Clear cache and refresh
                        localStorage.removeItem('saved_diet_charts');
                        localStorage.removeItem('saved_diet_charts_timestamp');
                        fetchSavedDietCharts();
                        toast.info('Refreshing diet charts...');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      title="Refresh list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                    >
                      <span className="text-base">+</span>
                      Create New Chart
                    </button>
                  </div>
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
                  <option value="All Status">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Diet Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingCharts ? (
                <div className="col-span-full text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-gray-500 text-sm">Loading diet charts...</p>
                </div>
              ) : savedDietCharts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">No saved diet charts yet</p>
                  <p className="text-gray-400 text-sm mb-4">Create your first diet chart to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                  >
                    <span className="text-base">+</span>
                    Create New Chart
                  </button>
                </div>
              ) : (
                (() => {
                  // Apply search and filter
                  const filteredCharts = savedDietCharts.filter((chart) => {
                    // Extract patient data from populated patient_id or patientDetails
                    const populatedPatient = chart.patient_id || {};
                    const patientSnapshot = chart.patient_snapshot || {};
                    const patientDetails = chart.patientDetails || {};
                    
                    const patientName = populatedPatient.name || patientDetails.patientName || chart.patientName || 'Unknown Patient';
                    const constitution = patientSnapshot.constitution || patientDetails.constitution || chart.constitution || 'Not specified';
                    const healthGoals = patientSnapshot.health_goals || patientDetails.healthGoals || chart.healthGoals || [];
                    
                    // Status filter
                    if (statusFilter !== 'All Status' && chart.status !== statusFilter) {
                      return false;
                    }
                    
                    // Search filter
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      const matchesName = patientName.toLowerCase().includes(searchLower);
                      const matchesConstitution = constitution.toLowerCase().includes(searchLower);
                      const matchesGoals = healthGoals.some(goal => 
                        goal.toLowerCase().includes(searchLower)
                      );
                      
                      if (!matchesName && !matchesConstitution && !matchesGoals) {
                        return false;
                      }
                    }
                    
                    return true;
                  });
                  
                  if (filteredCharts.length === 0) {
                    return (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-lg mb-2">No charts found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                      </div>
                    );
                  }
                  
                  return filteredCharts.map((chart) => {
                  // Extract patient data from populated patient_id or patientDetails
                  const populatedPatient = chart.patient_id || {};
                  const patientSnapshot = chart.patient_snapshot || {};
                  const patientDetails = chart.patientDetails || {};
                  
                  const patientName = populatedPatient.name || patientDetails.patientName || chart.patientName || 'Unknown Patient';
                  const age = patientSnapshot.age || populatedPatient.age || patientDetails.age || chart.age || 'N/A';
                  const gender = populatedPatient.gender || patientDetails.gender || chart.gender || 'N/A';
                  const constitution = patientSnapshot.constitution || patientDetails.constitution || chart.constitution || 'Not specified';
                  const healthGoals = patientSnapshot.health_goals || patientDetails.healthGoals || chart.healthGoals || [];
                  const avgCalories = chart.weekly_nutrition_summary?.daily_average?.calories || chart.averageDailyCalories || 0;
                  const createdDate = chart.createdAt ? new Date(chart.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (chart.created || 'N/A');
                  
                  // Weekly nutrition summary
                  const weeklyNutrition = chart.weekly_nutrition_summary || {};
                  const totalCalories = weeklyNutrition.total_calories || 0;
                  const totalProtein = weeklyNutrition.total_protein || 0;
                  const totalCarbs = weeklyNutrition.total_carbs || 0;
                  const totalFat = weeklyNutrition.total_fat || 0;
                  const vitamins = weeklyNutrition.vitamins || {};
                  const minerals = weeklyNutrition.minerals || {};

                  return (
                <div
                  key={chart._id || chart.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all hover:border-green-300"
                >
                  {/* Compact Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {patientName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{age}y • {gender}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{constitution}</span>
                      </div>
                    </div>
                    <select
                      value={chart.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const chartId = chart._id || chart.id;
                        
                        try {
                          const { data } = await axios.put(
                            `${backendUrl}/api/doctor/diet-chart/${chartId}`,
                            { status: newStatus },
                            { headers: { dToken } }
                          );

                          if (data.success) {
                            // Update local state
                            setSavedDietCharts(prev => 
                              prev.map(c => (c._id === chartId || c.id === chartId)
                                ? { ...c, status: newStatus } 
                                : c
                              )
                            );
                            toast.success(`Status updated to ${newStatus}`);
                          } else {
                            toast.error(data.message || 'Failed to update status');
                          }
                        } catch (error) {
                          console.error('Error updating status:', error);
                          toast.error('Failed to update status');
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 focus:ring-2 focus:ring-offset-1 appearance-none pr-7 ${getStatusColor(chart.status)}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='currentColor' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '12px'
                      }}
                    >
                      <option value="active">● Active</option>
                      <option value="completed">✓ Completed</option>
                      <option value="discontinued">✕ Discontinued</option>
                      <option value="draft">○ Draft</option>
                    </select>
                  </div>

                  {/* Inline Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">{avgCalories}</span>
                      <span className="text-gray-400">kcal/day</span>
                    </div>
                    <div className="text-gray-400">{createdDate}</div>
                  </div>

                  {/* Total Calories + Macronutrients */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md p-1.5 text-center border border-green-200">
                      <p className="text-xs text-green-600 font-medium">Total Cal</p>
                      <p className="text-sm font-bold text-green-700">{totalCalories}</p>
                    </div>
                    <div className="bg-blue-50 rounded-md p-1.5 text-center border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">Protein</p>
                      <p className="text-sm font-bold text-blue-700">{totalProtein}g</p>
                    </div>
                    <div className="bg-amber-50 rounded-md p-1.5 text-center border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium">Carbs</p>
                      <p className="text-sm font-bold text-amber-700">{totalCarbs}g</p>
                    </div>
                    <div className="bg-rose-50 rounded-md p-1.5 text-center border border-rose-100">
                      <p className="text-xs text-rose-600 font-medium">Fat</p>
                      <p className="text-sm font-bold text-rose-700">{totalFat}g</p>
                    </div>
                  </div>

                  {/* Micro Nutrients - Ultra Compact */}
                  {(Object.keys(vitamins).length > 0 || Object.keys(minerals).length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vitamins.vitamin_c > 0 && (
                        <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">
                          C:{Math.round(vitamins.vitamin_c)}
                        </span>
                      )}
                      {vitamins.vitamin_d > 0 && (
                        <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">
                          D:{Math.round(vitamins.vitamin_d)}
                        </span>
                      )}
                      {minerals.calcium > 0 && (
                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-xs rounded border border-teal-100">
                          Ca:{Math.round(minerals.calcium)}
                        </span>
                      )}
                      {minerals.iron > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                          Fe:{Math.round(minerals.iron)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Compact Health Goals */}
                  {healthGoals && healthGoals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {healthGoals.slice(0, 2).map((goal, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-100"
                        >
                          {goal}
                        </span>
                      ))}
                      {healthGoals.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-100">
                          +{healthGoals.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleViewDetails(chart)}
                      className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button 
                      onClick={() => {
                        // Load chart data into form for editing
                        const savedMealPlan = chart.weekly_meal_plan || chart.weeklyMealPlan || {
                          Mon: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Tue: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Wed: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Thu: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Fri: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Sat: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                          Sun: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }
                        };
                        
                        // Transform saved meal plan to editable format
                        const editableMealPlan = transformSavedMealPlanForEditing(savedMealPlan);
                        
                        const patientSnapshot = chart.patient_snapshot || {};
                        
                        setFormData({
                          patientId: chart.patient_id?._id || chart.patient_id,
                          patientName: patientName,
                          age: (patientSnapshot.age || age).toString(),
                          gender: gender,
                          constitution: constitution,
                          primaryHealthCondition: patientSnapshot.primary_health_condition || '',
                          currentSymptoms: patientSnapshot.current_symptoms || '',
                          foodAllergies: patientSnapshot.food_allergies || '',
                          healthGoals: patientSnapshot.health_goals || [],
                          customNutritionGoals: chart.custom_nutrition_goals || chart.customNutritionGoals || formData.customNutritionGoals,
                          weeklyMealPlan: editableMealPlan
                        });
                        setSelectedPatientId(chart.patient_id?._id || chart.patient_id);
                        setActiveTab('create');
                        setCurrentStep(2);
                        toast.info('Chart loaded for editing - You can now add, remove, or modify foods');
                      }}
                      className="flex items-center justify-center gap-1 py-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-all text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        const chartId = chart._id || chart.id;
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Delete Diet Chart',
                          message: `Are you sure you want to delete the diet chart for ${patientName}? This action cannot be undone.`,
                          onConfirm: () => handleDeleteChart(chartId, true),
                          type: 'danger'
                        });
                      }}
                      className="flex items-center justify-center gap-1 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-all text-xs font-medium"
                    >
                      <X className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
                });
                })()
              )}
            </div>
              </>
            ) : (
              /* Details View - Same as Step 3 */
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

                {selectedChart && (() => {
                  // Extract patient data from populated patient_id or patientDetails or patient_snapshot
                  const populatedPatient = selectedChart.patient_id || {};
                  const patientSnapshot = selectedChart.patient_snapshot || {};
                  const patientDetails = selectedChart.patientDetails || {};
                  
                  const patientName = populatedPatient.name || patientDetails.patientName || selectedChart.patientName || 'Unknown Patient';
                  const age = patientSnapshot.age || populatedPatient.age || patientDetails.age || selectedChart.age || 'N/A';
                  const gender = populatedPatient.gender || patientDetails.gender || selectedChart.gender || 'N/A';
                  const constitution = patientSnapshot.constitution || patientDetails.constitution || selectedChart.constitution || 'Not specified';
                  const createdDate = selectedChart.createdAt ? new Date(selectedChart.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (selectedChart.created || 'N/A');
                  const chartId = selectedChart._id || selectedChart.id;
                  
                  // Get meal plan data
                  const mealPlan = selectedChart.weekly_meal_plan || selectedChart.weeklyMealPlan;
                  
                  // Get custom nutrition goals from the chart or use defaults
                  const customGoals = selectedChart.custom_nutrition_goals || selectedChart.customNutritionGoals;
                  
                  // Calculate nutrition summary using custom goals
                  const nutrition = calculateWeeklyNutrition(mealPlan || {}, customGoals);

                  return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    {/* Header with Edit/Delete Actions */}
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                      <div>
                        <h1 className="text-xl font-bold text-gray-900 mb-1">
                          Diet Chart - {patientName}
                        </h1>
                        <p className="text-gray-600 text-sm">
                          {age} years • {gender} • {constitution}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Created: {createdDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Load chart data into form
                            const savedMealPlan = mealPlan || {
                              Mon: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Tue: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Wed: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Thu: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Fri: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Sat: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
                              Sun: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] }
                            };
                            
                            // Transform saved meal plan to editable format
                            const editableMealPlan = transformSavedMealPlanForEditing(savedMealPlan);
                            
                            setFormData({
                              patientId: selectedChart.patient_id?._id || selectedChart.patient_id,
                              patientName: patientName,
                              age: age.toString(),
                              gender: gender,
                              constitution: constitution,
                              primaryHealthCondition: patientSnapshot.primary_health_condition || patientDetails.primaryHealthCondition || '',
                              currentSymptoms: patientSnapshot.current_symptoms || patientDetails.currentSymptoms || '',
                              foodAllergies: patientSnapshot.food_allergies || patientDetails.foodAllergies || '',
                              healthGoals: patientSnapshot.health_goals || patientDetails.healthGoals || [],
                              customNutritionGoals: selectedChart.custom_nutrition_goals || selectedChart.customNutritionGoals || formData.customNutritionGoals,
                              weeklyMealPlan: editableMealPlan
                            });
                            setSelectedPatientId(selectedChart.patient_id?._id || selectedChart.patient_id);
                            setViewMode('grid');
                            setActiveTab('create');
                            setCurrentStep(2); // Go to food selection step
                            toast.info('Chart loaded for editing - You can now add, remove, or modify foods');
                          }}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Chart
                        </button>
                        <button
                          onClick={async () => {
                            await handleDownloadPDF(selectedChart);
                          }}
                          disabled={isDownloadingPDF}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                            isDownloadingPDF
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isDownloadingPDF ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download PDF
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Delete Diet Chart',
                              message: `Are you sure you want to delete the diet chart for ${patientName}? This action cannot be undone.`,
                              onConfirm: () => handleDeleteChart(chartId, true),
                              type: 'danger'
                            });
                          }}
                          className="px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Weekly Nutritional Overview - Same as Step 3 */}
                    <div className="mb-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Weekly Nutritional Overview</h2>
                      </div>

                      {/* Macronutrients Section */}
                      <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">Macronutrients</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {/* Calories */}
                          <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28 mb-4">
                              <svg className="w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                <circle
                                  cx="56" cy="56" r="50"
                                  stroke="#f97316"
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={`${Math.min(nutrition.percentages.calories, 100) * 3.14} ${100 * 3.14}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{nutrition.percentages.calories}%</span>
                                <span className="text-xs text-gray-500">daily</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Calories</h4>
                            <p className="text-sm text-gray-600">{nutrition.dailyAverages.calories}/{nutrition.dailyRecommended.calories}kcal/day</p>
                            <p className="text-xs text-gray-500">{Math.round(nutrition.totals.calories)}kcal/week</p>
                          </div>

                          {/* Protein */}
                          <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28 mb-4">
                              <svg className="w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                <circle
                                  cx="56" cy="56" r="50"
                                  stroke="#f97316"
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={`${Math.min(nutrition.percentages.protein, 100) * 3.14} ${100 * 3.14}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{nutrition.percentages.protein}%</span>
                                <span className="text-xs text-gray-500">daily</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Protein</h4>
                            <p className="text-sm text-gray-600">{nutrition.dailyAverages.protein}/{nutrition.dailyRecommended.protein}g/day</p>
                            <p className="text-xs text-gray-500">{Math.round(nutrition.totals.protein)}g/week</p>
                          </div>

                          {/* Carbs */}
                          <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28 mb-4">
                              <svg className="w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                <circle
                                  cx="56" cy="56" r="50"
                                  stroke="#f97316"
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={`${Math.min(nutrition.percentages.carbs, 100) * 3.14} ${100 * 3.14}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{nutrition.percentages.carbs}%</span>
                                <span className="text-xs text-gray-500">daily</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Carbs</h4>
                            <p className="text-sm text-gray-600">{nutrition.dailyAverages.carbs}/{nutrition.dailyRecommended.carbs}g/day</p>
                            <p className="text-xs text-gray-500">{Math.round(nutrition.totals.carbs)}g/week</p>
                          </div>

                          {/* Fat */}
                          <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28 mb-4">
                              <svg className="w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="50" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                <circle
                                  cx="56" cy="56" r="50"
                                  stroke="#f97316"
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={`${Math.min(nutrition.percentages.fat, 100) * 3.14} ${100 * 3.14}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{nutrition.percentages.fat}%</span>
                                <span className="text-xs text-gray-500">daily</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Fat</h4>
                            <p className="text-sm text-gray-600">{nutrition.dailyAverages.fat}/{nutrition.dailyRecommended.fat}g/day</p>
                            <p className="text-xs text-gray-500">{Math.round(nutrition.totals.fat)}g/week</p>
                          </div>
                        </div>
                      </div>

                      {/* Vitamins & Minerals - Show if available */}
                      {(Object.keys(nutrition.vitamins || {}).length > 0 || Object.keys(nutrition.minerals || {}).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.keys(nutrition.vitamins || {}).length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-600">Key Vitamins (Weekly Total)</h4>
                              <div className="space-y-3">
                                {nutrition.vitamins.vitamin_c > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Vitamin C</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.vitamins.vitamin_c)}mg</span>
                                  </div>
                                )}
                                {nutrition.vitamins.vitamin_d > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Vitamin D</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.vitamins.vitamin_d)}mcg</span>
                                  </div>
                                )}
                                {nutrition.vitamins.vitamin_a > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Vitamin A</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.vitamins.vitamin_a)}mcg</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {Object.keys(nutrition.minerals || {}).length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-600">Key Minerals (Weekly Total)</h4>
                              <div className="space-y-3">
                                {nutrition.minerals.calcium > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Calcium</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.minerals.calcium)}mg</span>
                                  </div>
                                )}
                                {nutrition.minerals.iron > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Iron</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.minerals.iron)}mg</span>
                                  </div>
                                )}
                                {nutrition.minerals.potassium > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Potassium</span>
                                    <span className="font-medium text-gray-900">{Math.round(nutrition.minerals.potassium)}mg</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Weekly Meal Calendar - Same as Step 3 */}
                    {renderWeeklyMealCalendar(mealPlan)}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the diet chart for ${patientName}? This action cannot be undone.`)) {
                            handleDeleteChart(chartId);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        <X className="w-5 h-5" />
                        Delete Chart
                      </button>
                    </div>

                  </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Food Modal */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Food to {selectedDay} - {selectedMeal}
                </h2>
                <button
                  onClick={() => setIsFoodModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Search and select foods from our database of 8,000+ items
              </p>
            </div>

            {/* Search and Filter - Modern Minimalistic Design */}
            <div className="bg-white border-b border-gray-100">
              {/* Search Bar */}
              <div className="px-6 pt-5 pb-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={foodSearchTerm}
                    onChange={(e) => setFoodSearchTerm(e.target.value)}
                    placeholder="Search foods by name, Hindi name, or description..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm text-gray-700 placeholder-gray-400 transition-all shadow-sm"
                  />
                  {foodSearchTerm && (
                    <button
                      onClick={() => setFoodSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Section */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Filters & Sort</span>
                </div>

                {/* Filter Pills Container */}
                <div className="flex flex-wrap gap-2">
                  {/* Category Filter */}
                  <div className="relative group">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                    >
                      <option value="">All Categories</option>
                      {getCategories().map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Diet Type Filter */}
                  <div className="relative group">
                    <UtensilsCrossed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <select
                      value={selectedDietType}
                      onChange={(e) => setSelectedDietType(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                    >
                      <option value="All">All Types</option>
                      <option value="Veg">🌱 Vegetarian</option>
                      <option value="Veg+Egg">🥚 Veg + Egg</option>
                      <option value="Non-Veg">🍗 Non-Vegetarian</option>
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Rasa Filter */}
                  <div className="relative group">
                    <Coffee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <select
                      value={selectedRasa}
                      onChange={(e) => setSelectedRasa(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                    >
                      {getRasaOptions().map((rasa, index) => (
                        <option key={index} value={rasa}>{rasa}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Dosha Multi-Select Dropdown */}
                  <div className="relative">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 cursor-pointer transition-all shadow-sm list-none">
                        <Filter className="w-3.5 h-3.5 text-gray-500" />
                        <span>Dosha {selectedDoshas.length > 0 && `(${selectedDoshas.length})`}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-600">Select Doshas</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                          {getDoshaOptions().map(option => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDoshas.includes(option.value)}
                                onChange={() => toggleDoshaFilter(option.value)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative group">
                      <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                      >
                        <option value="name">Name</option>
                        <option value="calories">Calories</option>
                        <option value="protein">Protein</option>
                        <option value="carbs">Carbs</option>
                        <option value="fiber">Fiber</option>
                      </select>
                      <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {/* Sort Direction Toggle */}
                    <button
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
                      title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      <div className="relative w-4 h-4">
                        {sortDirection === 'asc' ? (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Active Filters Pills */}
                {(foodSearchTerm || selectedCategory || selectedDietType !== 'All' || selectedRasa !== 'All Rasas' || selectedDoshas.length > 0) && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Active:</span>
                    
                    {foodSearchTerm && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200 shadow-sm">
                        <Search className="w-3 h-3" />
                        "{foodSearchTerm.slice(0, 20)}{foodSearchTerm.length > 20 ? '...' : ''}"
                        <button onClick={() => setFoodSearchTerm('')} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200 shadow-sm">
                        <Tag className="w-3 h-3" />
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory('')} className="hover:bg-green-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedDietType !== 'All' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 text-xs font-medium rounded-full border border-teal-200 shadow-sm">
                        <UtensilsCrossed className="w-3 h-3" />
                        {selectedDietType === 'Veg' && '🌱 Vegetarian'}
                        {selectedDietType === 'Veg+Egg' && '🥚 Veg + Egg'}
                        {selectedDietType === 'Non-Veg' && '🍗 Non-Veg'}
                        <button onClick={() => setSelectedDietType('All')} className="hover:bg-teal-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedRasa !== 'All Rasas' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200 shadow-sm">
                        <Coffee className="w-3 h-3" />
                        {selectedRasa}
                        <button onClick={() => setSelectedRasa('All Rasas')} className="hover:bg-purple-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedDoshas.map(doshaValue => {
                      const doshaOption = getDoshaOptions().find(opt => opt.value === doshaValue);
                      return doshaOption ? (
                        <span key={doshaValue} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-200 shadow-sm">
                          <Filter className="w-3 h-3" />
                          {doshaOption.label}
                          <button onClick={() => toggleDoshaFilter(doshaValue)} className="hover:bg-orange-200 rounded-full p-0.5 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    <button
                      onClick={() => {
                        setFoodSearchTerm('');
                        setSelectedCategory('');
                        setSelectedDietType('All');
                        setSelectedRasa('All Rasas');
                        setSelectedDoshas([]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Food List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingFoods ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="text-gray-500 mt-4">Loading foods...</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const filteredFoods = getFilteredFoods();
                    const paginatedFoods = getPaginatedFoods(filteredFoods);
                    const totalPages = getTotalPages(filteredFoods);
                    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
                    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredFoods.length);

                    return (
                      <>
                        {/* Results Count */}
                        <div className="mb-4 pb-3 border-b border-gray-200 flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">{startItem}-{endItem}</span> of <span className="font-semibold text-gray-900">{filteredFoods.length}</span> foods
                            {filteredFoods.length !== foodDatabase.length && (
                              <span> (filtered from {foodDatabase.length} total)</span>
                            )}
                          </p>
                          {totalPages > 1 && (
                            <p className="text-sm text-gray-500">
                              Page {currentPage} of {totalPages}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {paginatedFoods.map((food) => (
                      <div
                        key={food.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-base">{food.name}</h3>
                              {food.name_hindi && (
                                <span className="text-sm text-gray-500">({food.name_hindi})</span>
                              )}
                              {/* Ayurvedic Properties Badges */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  const rasa = food.ayurvedic_properties?.rasa;
                                  const virya = food.ayurvedic_properties?.virya;
                                  const doshaEffects = food.ayurvedic_properties?.dosha_effects;
                                  
                                  return (
                                    <>
                                      {/* Rasa (Taste) Badge */}
                                      {rasa && Array.isArray(rasa) && rasa.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium rounded-full">
                                          <span>👅</span>
                                          <span>{rasa.slice(0, 2).join(', ')}</span>
                                        </span>
                                      )}
                                      
                                      {/* Virya (Energy) Badge */}
                                      {virya && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                                          virya.toLowerCase() === 'hot' || virya.toLowerCase() === 'heating' 
                                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                        } border text-xs font-medium rounded-full`}>
                                          <span>{virya.toLowerCase() === 'hot' || virya.toLowerCase() === 'heating' ? '🔥' : '❄️'}</span>
                                          <span>{virya}</span>
                                        </span>
                                      )}
                                      
                                      {/* Dosha Effect Badge */}
                                      {doshaEffects && Object.keys(doshaEffects).length > 0 && (
                                        <>
                                          {Object.entries(doshaEffects).map(([dosha, effect]) => {
                                            if (!effect) return null;
                                            const effectLower = effect.toLowerCase();
                                            let icon = '⚖️';
                                            let bgColor = 'bg-gray-50';
                                            let textColor = 'text-gray-700';
                                            let borderColor = 'border-gray-200';
                                            
                                            if (effectLower.includes('increase') || effectLower.includes('aggravate')) {
                                              icon = '↑';
                                              bgColor = 'bg-red-50';
                                              textColor = 'text-red-700';
                                              borderColor = 'border-red-200';
                                            } else if (effectLower.includes('decrease') || effectLower.includes('pacif')) {
                                              icon = '↓';
                                              bgColor = 'bg-green-50';
                                              textColor = 'text-green-700';
                                              borderColor = 'border-green-200';
                                            } else if (effectLower.includes('balance') || effectLower.includes('neutral')) {
                                              icon = '⚖️';
                                              bgColor = 'bg-indigo-50';
                                              textColor = 'text-indigo-700';
                                              borderColor = 'border-indigo-200';
                                            }
                                            
                                            return (
                                              <span key={dosha} className={`inline-flex items-center gap-1 px-2 py-0.5 ${bgColor} ${textColor} border ${borderColor} text-xs font-medium rounded-full`}>
                                                <span>{icon}</span>
                                                <span>{dosha.charAt(0).toUpperCase() + dosha.slice(1)}</span>
                                              </span>
                                            );
                                          })}
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{food.description}</p>
                            
                            {/* Serving Size Input with Unit Selector */}
                            <div className="mb-3 flex items-center gap-2 flex-wrap">
                              <label className="text-xs text-gray-600 font-medium whitespace-nowrap">Serving Size:</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={foodServingSizes[food.id] || food.serving_size?.amount || 100}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || food.serving_size?.amount || 100;
                                  setFoodServingSizes(prev => ({
                                    ...prev,
                                    [food.id]: value
                                  }));
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <select
                                value={foodServingUnits[food.id] || food.serving_size?.unit || 'g'}
                                onChange={(e) => {
                                  setFoodServingUnits(prev => ({
                                    ...prev,
                                    [food.id]: e.target.value
                                  }));
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                {getServingUnitOptions().map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Nutrition Grid with real-time calculation */}
                            {(() => {
                              const servingAmount = foodServingSizes[food.id] || food.serving_size?.amount || 100;
                              const nutrition = calculateNutrition(food, servingAmount);
                              
                              return (
                                <div className="grid grid-cols-4 gap-2 mb-3 py-2 px-3 bg-gray-50 rounded-lg">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500">Calories</p>
                                    <p className="text-sm font-semibold text-gray-900">{nutrition.calories}</p>
                                  </div>
                                  <div className="text-center border-l border-gray-200">
                                    <p className="text-xs text-gray-500">Protein</p>
                                    <p className="text-sm font-semibold text-gray-900">{nutrition.protein}g</p>
                                  </div>
                                  <div className="text-center border-l border-gray-200">
                                    <p className="text-xs text-gray-500">Carbs</p>
                                    <p className="text-sm font-semibold text-gray-900">{nutrition.carbs}g</p>
                                  </div>
                                  <div className="text-center border-l border-gray-200">
                                    <p className="text-xs text-gray-500">Fiber</p>
                                    <p className="text-sm font-semibold text-gray-900">{nutrition.fiber}g</p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Category Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {food.categories.slice(0, 3).map((category, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
                                >
                                  {category}
                                </span>
                              ))}
                              {food.categories.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{food.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddFood(food)}
                            className="ml-4 flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                currentPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                              }`}
                            >
                              ← Previous
                            </button>

                            <div className="flex items-center gap-2">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                      currentPage === pageNum
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                currentPage === totalPages
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                              }`}
                            >
                              Next →
                            </button>
                          </div>
                        )}

                        {!loadingFoods && filteredFoods.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p>No foods found matching your search.</p>
                            <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Goals Modal */}
      <CustomGoalsModal
        isOpen={isCustomGoalsModalOpen}
        onClose={() => setIsCustomGoalsModalOpen(false)}
        initialGoals={formData.customNutritionGoals}
        onSave={(goals) => {
          setFormData(prev => ({
            ...prev,
            customNutritionGoals: goals
          }));
          toast.success('Custom nutrition goals saved!');
        }}
      />

      {/* AI Loading Modal */}
      <AILoadingModal 
        isOpen={isGeneratingAI}
        message="AI is generating your personalized diet chart..."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default DietChartGenerator;
