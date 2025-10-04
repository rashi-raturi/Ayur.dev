import { useState, useEffect, useContext, useCallback } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import {
  FileText,
  Plus,
  Eye,
  Search,
  ChevronDown,
  User,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import axios from "axios";
import PrescriptionPreview from "../../components/PrescriptionPreview";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Prescriptions = () => {
  const {
    dToken,
    backendUrl,
    prescriptions: contextPrescriptions,
    getDoctorPrescriptions,
    patients: contextPatients,
    getPatients: getContextPatients,
  } = useContext(DoctorContext);

  const [prescriptions, setPrescriptions] = useState(
    contextPrescriptions || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("saved"); // 'saved' or 'create'
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    age: "",
    gender: "",
    contactNumber: "",
    constitution: "",
    height: { feet: 0, inches: 0 },
    weight: 0,
    bowel_movements: "",
    chiefComplaint: "",
    diagnosis: "",
    medications: [],
    dietaryRecommendations: "",
    lifestyleAdvice: "",
    followUpDate: "",
  });
  const [currentMedication, setCurrentMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    timing: "",
    instructions: "",
  });
  const [aiMedicationForms, setAiMedicationForms] = useState([]);
  const [showAiMedicationForms, setShowAiMedicationForms] = useState(false);
  const [editingAiMedicationId, setEditingAiMedicationId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const [isDietLoading, setIsDietLoading] = useState(false);
  const [isLifestyleLoading, setIsLifestyleLoading] = useState(false);
  const [isAIPrescriptionLoading, setIsAIPrescriptionLoading] = useState(false);
  const [showDietChartPreview, setShowDietChartPreview] = useState(false);
  const [dietChartData, setDietChartData] = useState(null);
  const [linkedDietChart, setLinkedDietChart] = useState(null);
  const [isDietChartLoading, setIsDietChartLoading] = useState(false);
  const [showDietDropdown, setShowDietDropdown] = useState(false);

  // Fetch prescriptions with caching
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        // Use cached data from context if available
        if (contextPrescriptions && contextPrescriptions.length > 0) {
          setPrescriptions(contextPrescriptions);
          setLoading(false);
          return;
        }

        setLoading(true);
        await getDoctorPrescriptions();
        setLoading(false);
      } catch (error) {
        toast.error("Error loading prescriptions");
        setLoading(false);
      }
    };

    if (dToken && backendUrl) {
      fetchPrescriptions();
    } else {
      console.error("Missing dToken or backendUrl", {
        dToken: !!dToken,
        backendUrl,
      });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken, backendUrl]); // Only run when auth changes, not when data changes

  // Update local state when context prescriptions change
  useEffect(() => {
    if (contextPrescriptions && contextPrescriptions.length > 0) {
      setPrescriptions(contextPrescriptions);
    }
  }, [contextPrescriptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openStatusDropdownId &&
        !event.target.closest(".status-dropdown-container")
      ) {
        setOpenStatusDropdownId(null);
      }
      
      if (
        showDietDropdown &&
        !event.target.closest(".diet-dropdown-container")
      ) {
        setShowDietDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openStatusDropdownId, showDietDropdown]);

  // Fetch patients when form is opened - use cached data from context
  const fetchPatients = useCallback(async () => {
    try {
      // Use cached data if available
      if (contextPatients && contextPatients.length > 0) {
        setPatients(contextPatients);
        return;
      }

      // Otherwise fetch from API through context
      const fetchedPatients = await getContextPatients();
      if (fetchedPatients && fetchedPatients.length > 0) {
        setPatients(fetchedPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, [contextPatients, getContextPatients]);

  useEffect(() => {
    if (activeTab === "create") {
      fetchPatients();
    }
  }, [activeTab, fetchPatients]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      patient.phone.includes(patientSearchTerm)
  );

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData((prev) => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      contactNumber: patient.phone,
      height: patient.height || { feet: 0, inches: 0 },
      weight: patient.weight || 0,
      bowel_movements: patient.bowel_movements || "",
    }));
    setPatientSearchTerm(patient.name);
    setShowPatientDropdown(false);
  };

  const filteredPrescriptions = (
    Array.isArray(prescriptions) ? prescriptions : []
  ).filter(
    (prescription) =>
      prescription &&
      prescription.patientName &&
      prescription.id &&
      (prescription.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        prescription.id
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (prescription.prescriptionId &&
          prescription.prescriptionId
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))) &&
      (selectedStatus === "All Status" ||
        prescription.status === selectedStatus)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Dispensed":
        return "bg-blue-100 text-blue-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const addMedication = () => {
    if (currentMedication.name && currentMedication.dosage) {
      setFormData((prev) => ({
        ...prev,
        medications: [
          ...prev.medications,
          { ...currentMedication, id: Date.now() },
        ],
      }));
      setCurrentMedication({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        timing: "",
        instructions: "",
      });
    }
  };

  const removeMedication = (id) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((med) => med.id !== id),
    }));
  };

  const handleSavePrescription = async () => {
    try {
      // Validate required fields
      if (!formData.patientId || !formData.chiefComplaint) {
        toast.error("Please select a patient and enter chief complaint");
        return;
      }

      const prescriptionData = {
        patientId: formData.patientId,
        patientInfo: {
          name: formData.patientName,
          age: formData.age,
          gender: formData.gender,
          contactNumber: formData.contactNumber,
          constitution: formData.constitution,
        },
        chiefComplaint: formData.chiefComplaint,
        diagnosis: formData.diagnosis,
        medications: formData.medications,
        dietaryRecommendations: formData.dietaryRecommendations,
        lifestyleAdvice: formData.lifestyleAdvice,
        followUpDate: formData.followUpDate,
      };

      let apiUrl, method;
      if (editingPrescription) {
        // Update existing prescription
        apiUrl = `${backendUrl}/api/doctor/prescription/${editingPrescription.id}`;
        method = "put";
      } else {
        // Create new prescription
        apiUrl = `${backendUrl}/api/doctor/prescription/create`;
        method = "post";
      }

      const { data } = await axios[method](apiUrl, prescriptionData, {
        headers: { dToken },
      });

      if (data.success) {
        // Force refresh prescriptions from server to update cache
        await getDoctorPrescriptions(true);

        if (editingPrescription) {
          toast.success("Prescription updated successfully!");
        } else {
          toast.success("Prescription created successfully!");
        }

        setActiveTab(false);
        setEditingPrescription(null);

        // Reset form
        setFormData({
          patientId: "",
          patientName: "",
          age: "",
          gender: "",
          contactNumber: "",
          constitution: "",
          chiefComplaint: "",
          diagnosis: "",
          medications: [],
          dietaryRecommendations: "",
          lifestyleAdvice: "",
          followUpDate: "",
        });
        setSelectedPatient(null);
        setPatientSearchTerm("");
        setShowPatientDropdown(false);

        // Success message is already handled above
      } else {
        toast.error(data.message || "Failed to create prescription");
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast.error(
        "Error saving prescription: " +
          (error.response?.data?.message || error.message)
      );
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

  const handlePreviewDietChart = async (chartId) => {
    try {
      // First check if we already have the data stored locally
      if (dietChartData && dietChartData._id === chartId) {
        setShowDietChartPreview(true);
        return;
      }

      // Otherwise fetch from API
      const response = await axios.get(
        `${backendUrl}/api/doctor/diet-chart/${chartId}`,
        { headers: { dToken } }
      );
      
      if (response.data.success) {
        setDietChartData(response.data.dietChart);
        setShowDietChartPreview(true);
      } else {
        toast.error('Failed to load diet chart');
      }
    } catch (error) {
      console.error('Error fetching diet chart:', error);
      toast.error('Failed to load diet chart');
    }
  };

  const handleCloseDietChartPreview = () => {
    setShowDietChartPreview(false);
    setDietChartData(null);
  };

  const handleEditPrescription = (prescription) => {
    // Populate the form with prescription data
    setFormData({
      patientId: prescription.patientInfo?.id || "",
      patientName: prescription.patientInfo?.name || prescription.patientName,
      age: prescription.patientInfo?.age || "",
      gender: prescription.patientInfo?.gender || "",
      contactNumber: prescription.patientInfo?.contactNumber || "",
      constitution: prescription.patientInfo?.constitution || "",
      chiefComplaint: prescription.chiefComplaint || "",
      diagnosis: prescription.diagnosis || "",
      medications: prescription.medications || [],
      dietaryRecommendations: prescription.dietaryRecommendations || "",
      lifestyleAdvice: prescription.lifestyleAdvice || "",
      followUpDate: prescription.followUpDate
        ? new Date(prescription.followUpDate).toISOString().split("T")[0]
        : "",
    });

    setEditingPrescription(prescription);
    setActiveTab(true);
  };

  const handleDeletePrescription = (prescription) => {
    setPrescriptionToDelete(prescription);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePrescription = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(
        `${backendUrl}/api/doctor/prescription/${prescriptionToDelete.id}`,
        {
          headers: { dToken },
        }
      );

      if (data.success) {
        // Force refresh prescriptions from server to update cache
        await getDoctorPrescriptions(true);
        toast.success("Prescription deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete prescription");
      }
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast.error(
        "Error deleting prescription: " +
          (error.response?.data?.message || error.message)
      );
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

  // Handle status change
  const handleStatusChange = async (prescriptionId, newStatus) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/doctor/prescription/${prescriptionId}`,
        { status: newStatus },
        { headers: { dToken } }
      );

      if (data.success) {
        // Force refresh prescriptions from server to update cache
        await getDoctorPrescriptions(true);
        toast.success("Status updated successfully!");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        "Error updating status: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setOpenStatusDropdownId(null);
    }
  };

  // Handle email prescription
  const handleEmailPrescription = async (prescription) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Generating PDF and sending email...");

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/prescription/${prescription.id}/email`,
        {},
        { headers: { dToken } }
      );

      toast.dismiss(loadingToast);

      if (data.success) {
        // Force refresh prescriptions from server to update cache
        await getDoctorPrescriptions(true);
        toast.success("Prescription emailed successfully!");
      } else {
        toast.error(data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error emailing prescription:", error);
      toast.error(
        "Error sending email: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle AI Diet Recommendation
  const handleAIDietRecommendation = async () => {
    try {
      setIsDietLoading(true);

      // Convert symptoms to array if it's a string
      let symptomsArray;
      if (formData.chiefComplaint) {
        symptomsArray = formData.chiefComplaint.includes(',') 
          ? formData.chiefComplaint.split(',').map(s => s.trim())
          : [formData.chiefComplaint];
      } else {
        symptomsArray = ["general wellness"];
      }

      const requestData = {
        name: formData.patientName || "Patient",
        gender: (formData.gender || "male").toLowerCase(),
        constitution_dosha: (formData.constitution || "vata").toLowerCase(),
        age: parseInt(formData.age) || 30,
        symptoms: symptomsArray,
        doctor_diagnosis: formData.diagnosis || "General consultation for wellness",
        chief_complaint: formData.chiefComplaint || "general wellness",
        weight: parseFloat(formData.weight) || 70,
        height_feet: parseInt(formData.height?.feet) || 5,
        height_inches: parseInt(formData.height?.inches) || 6,
        bowel_movements: formData.bowel_movements || "normal",
      };

      const response = await fetch(
        "https://ayurgenixai-dr4y.onrender.com/generate-diet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && (data.diet_chart || data.diet_recommendations)) {
        let dietContent = "";
        
        // Create clean formatted content from diet_recommendations
        if (data.diet_recommendations && typeof data.diet_recommendations === 'object') {
          dietContent = "PERSONALIZED DIET RECOMMENDATIONS\n\n";
          
          // Format each meal category with proper structure
          Object.entries(data.diet_recommendations).forEach(([key, value]) => {
            const categoryTitle = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            dietContent += `${categoryTitle}:\n`;
            
            if (typeof value === 'string') {
              // Split by commas or periods and create bullet points
              const items = value.split(/[,.]/).filter(item => item.trim().length > 0);
              if (items.length > 1) {
                items.forEach(item => {
                  dietContent += `   • ${item.trim()}\n`;
                });
              } else {
                dietContent += `   • ${value}\n`;
              }
            } else {
              dietContent += `   • ${value}\n`;
            }
            dietContent += "\n";
          });
        } else if (data.diet_chart) {
          dietContent = "DIET RECOMMENDATIONS\n\n" + data.diet_chart;
        }
        
        // Apply directly to form
        setFormData((prev) => ({
          ...prev,
          dietaryRecommendations: dietContent,
        }));
        
        toast.success("AI diet recommendations applied successfully!");
      } else {
        toast.error(data.error_message || "No diet recommendation received from AI");
      }
    } catch (error) {
      console.error("Error getting AI diet recommendation:", error);
      toast.error("Failed to get AI diet recommendation: " + error.message);
    } finally {
      setIsDietLoading(false);
    }
  };

  // Handle AI Lifestyle Recommendation (using medication API)
  const handleAILifestyleRecommendation = async () => {
    try {
      setIsLifestyleLoading(true);

      // Convert symptoms to array if it's a string
      let symptomsArray;
      if (formData.chiefComplaint) {
        symptomsArray = formData.chiefComplaint.includes(',') 
          ? formData.chiefComplaint.split(',').map(s => s.trim())
          : [formData.chiefComplaint];
      } else {
        symptomsArray = ["general wellness"];
      }

      const requestData = {
        name: formData.patientName || "Patient",
        gender: (formData.gender || "male").toLowerCase(),
        constitution_dosha: (formData.constitution || "vata").toLowerCase(),
        age: parseInt(formData.age) || 30,
        symptoms: symptomsArray,
        doctor_diagnosis: formData.diagnosis || "General consultation for wellness",
        chief_complaint: formData.chiefComplaint || "general wellness",
        weight: parseFloat(formData.weight) || 70,
        height_feet: parseInt(formData.height?.feet) || 5,
        height_inches: parseInt(formData.height?.inches) || 6,
        bowel_movements: formData.bowel_movements || "normal",
      };

      // Call the medication endpoint directly
      const response = await fetch(
        "https://ayurgenixai-dr4y.onrender.com/generate-medication",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const medData = await response.json();

      if (medData.success && (medData.lifestyle_recommendations || medData.ayurvedic_medicines)) {
        let lifestyleContent = "";
        let medicationsToAdd = [];
        
        // Extract lifestyle recommendations with clean formatting
        if (medData.lifestyle_recommendations && Array.isArray(medData.lifestyle_recommendations)) {
          lifestyleContent += "Lifestyle Recommendations:\n";
          medData.lifestyle_recommendations.forEach((item, index) => {
            lifestyleContent += `   ${index + 1}. ${item}\n`;
          });
          lifestyleContent += "\n";
        }
        
        // Add additional wellness tips
        lifestyleContent += "Additional Wellness Tips:\n";
        lifestyleContent += "   • Follow consistent daily routines (Dinacharya)\n";
        lifestyleContent += "   • Practice mindful eating and proper food combining\n";
        lifestyleContent += "   • Maintain regular sleep schedule\n";
        lifestyleContent += "   • Include gentle exercise and pranayama\n";
        
        // Extract ayurvedic medicines and create medication forms
        if (medData.ayurvedic_medicines && Array.isArray(medData.ayurvedic_medicines) && medData.ayurvedic_medicines.length > 0) {
          const medicationForms = medData.ayurvedic_medicines.map((medicineText, index) => {
            // Parse medicine text: "Ashwagandha: 1 tsp with warm milk at bedtime."
            const match = medicineText.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              const name = match[1].trim();
              const instruction = match[2].trim();
              
              // Extract dosage, frequency, timing from instruction
              const dosageMatch = instruction.match(/(\d+\/?\d*\s*(?:tsp|tbsp|gm|mg|drops?|capsules?))/i);
              const timingMatch = instruction.match(/(?:at\s+)?(bedtime|morning|evening|after meals|before meals|twice daily|daily)/i);
              
              return {
                id: `ai-med-${index}`,
                name: name,
                dosage: dosageMatch ? dosageMatch[1] : '1 tsp',
                frequency: timingMatch && timingMatch[0].includes('twice') ? 'Twice daily' : 'Once daily',
                timing: timingMatch ? timingMatch[1] : 'After food',
                duration: '1 month',
                instructions: instruction
              };
            }
            return null;
          }).filter(Boolean);
          
          // Set AI medication forms to be displayed
          setAiMedicationForms(medicationForms);
          setShowAiMedicationForms(true);
        }
        
        // Apply lifestyle content to form
        setFormData((prev) => ({
          ...prev,
          lifestyleAdvice: lifestyleContent
        }));
        
        toast.success("AI lifestyle recommendations and medications generated successfully!");
      } else {
        toast.error(medData.error_message || "No lifestyle recommendation received from AI");
      }
    } catch (error) {
      console.error("Error getting AI lifestyle recommendation:", error);
      toast.error(
        "Failed to get AI lifestyle recommendation: " + error.message
      );
    } finally {
      setIsLifestyleLoading(false);
    }
  };

  // AI Comprehensive Prescription Generation
  const handleAIPrescriptionGeneration = async () => {
    try {
      setIsAIPrescriptionLoading(true);

      // Check if chief complaint is provided
      if (!formData.chiefComplaint || formData.chiefComplaint.trim() === '') {
        toast.error("Please enter chief complaint first to generate AI prescription");
        return;
      }

      // Convert symptoms to array if it's a string
      let symptomsArray;
      if (formData.chiefComplaint) {
        symptomsArray = formData.chiefComplaint.includes(',') 
          ? formData.chiefComplaint.split(',').map(s => s.trim())
          : [formData.chiefComplaint];
      } else {
        symptomsArray = ["general wellness"];
      }

      const requestData = {
        name: formData.patientName || "Patient",
        gender: (formData.gender || "male").toLowerCase(),
        constitution_dosha: (formData.constitution || "vata").toLowerCase(),
        age: parseInt(formData.age) || 30,
        symptoms: symptomsArray,
        doctor_diagnosis: formData.diagnosis || "General consultation for wellness",
        chief_complaint: formData.chiefComplaint || "general wellness",
        weight: parseFloat(formData.weight) || 70,
        height_feet: parseInt(formData.height?.feet) || 5,
        height_inches: parseInt(formData.height?.inches) || 6,
        bowel_movements: formData.bowel_movements || "normal",
      };

      console.log("Sending AI Prescription Request:", requestData);

      const response = await fetch(
        'https://ayurgenixai-dr4y.onrender.com/generate-medication',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      console.log("AI Prescription Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }

      const medData = await response.json();
      console.log("AI Prescription Response Data:", medData);

      if (medData.success) {
        // Extract and set diagnosis
        let diagnosisText = "";
        if (medData.diagnosis) {
          diagnosisText = medData.diagnosis;
        } else if (medData.condition) {
          diagnosisText = medData.condition;
        } else {
          // Generate a basic diagnosis based on chief complaint and constitution
          const constitution = formData.constitution || "vata";
          const symptoms = formData.chiefComplaint;
          diagnosisText = `${constitution.charAt(0).toUpperCase() + constitution.slice(1)} imbalance presenting with ${symptoms}. Requires constitutional treatment and lifestyle modifications.`;
        }

        // Extract dietary recommendations
        let dietContent = "";
        if (medData.diet_recommendations && Array.isArray(medData.diet_recommendations)) {
          dietContent += "Dietary Recommendations:\n";
          medData.diet_recommendations.forEach((item, index) => {
            dietContent += `   ${index + 1}. ${item}\n`;
          });
          dietContent += "\n";
        }
        
        // Also check for dietary_recommendations (alternative field name)
        if (medData.dietary_recommendations && Array.isArray(medData.dietary_recommendations)) {
          if (!dietContent) dietContent += "Dietary Recommendations:\n";
          medData.dietary_recommendations.forEach((item, index) => {
            dietContent += `   ${index + 1}. ${item}\n`;
          });
          dietContent += "\n";
        }

        // Add general dietary guidelines if no specific recommendations
        if (!dietContent) {
          dietContent += "General Dietary Guidelines:\n";
          dietContent += "   • Follow constitution-based diet principles\n";
          dietContent += "   • Eat fresh, seasonal, and locally sourced foods\n";
          dietContent += "   • Maintain regular meal timings\n";
          dietContent += "   • Practice mindful eating\n\n";
        }

        // Extract lifestyle recommendations
        let lifestyleContent = "";
        if (medData.lifestyle_recommendations && Array.isArray(medData.lifestyle_recommendations)) {
          lifestyleContent += "Lifestyle Recommendations:\n";
          medData.lifestyle_recommendations.forEach((item, index) => {
            lifestyleContent += `   ${index + 1}. ${item}\n`;
          });
          lifestyleContent += "\n";
        }
        
        // Also check for lifestyle_advice (alternative field name)
        if (medData.lifestyle_advice && Array.isArray(medData.lifestyle_advice)) {
          if (!lifestyleContent) lifestyleContent += "Lifestyle Recommendations:\n";
          medData.lifestyle_advice.forEach((item, index) => {
            lifestyleContent += `   ${index + 1}. ${item}\n`;
          });
          lifestyleContent += "\n";
        }
        
        // Add additional wellness tips
        lifestyleContent += "Additional Wellness Tips:\n";
        lifestyleContent += "   • Follow consistent daily routines (Dinacharya)\n";
        lifestyleContent += "   • Practice mindful eating and proper food combining\n";
        lifestyleContent += "   • Maintain regular sleep schedule\n";
        lifestyleContent += "   • Include gentle exercise and pranayama\n";
        lifestyleContent += "   • Practice stress management techniques\n";
        lifestyleContent += "   • Maintain work-life balance\n";

        // Extract ayurvedic medicines and create medication forms
        let medicationsToAdd = [];
        
        // Check for ayurvedic_medicines using the proven working approach
        if (medData.ayurvedic_medicines && Array.isArray(medData.ayurvedic_medicines) && medData.ayurvedic_medicines.length > 0) {
          const medicationForms = medData.ayurvedic_medicines.map((medicineText, index) => {
            // Parse medicine text: "Ashwagandha: 1 tsp with warm milk at bedtime."
            const match = medicineText.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              const name = match[1].trim();
              const instruction = match[2].trim();
              
              // Extract dosage, frequency, timing from instruction
              const dosageMatch = instruction.match(/(\d+\/?\d*\s*(?:tsp|tbsp|gm|mg|drops?|capsules?))/i);
              const timingMatch = instruction.match(/(?:at\s+)?(bedtime|morning|evening|after meals|before meals|twice daily|daily)/i);
              
              return {
                id: `ai-med-${Date.now()}-${index}`,
                name: name,
                dosage: dosageMatch ? dosageMatch[1] : '1 tsp',
                frequency: timingMatch && timingMatch[0].includes('twice') ? 'Twice daily' : 'Once daily',
                timing: timingMatch ? timingMatch[1] : 'After food',
                duration: '1 month',
                instructions: instruction
              };
            }
            return null;
          }).filter(Boolean);
          
          medicationsToAdd = medicationForms;
          
          // Set AI medication forms to be displayed in the separate box
          setAiMedicationForms(medicationForms);
          setShowAiMedicationForms(true);
        }

        console.log("Extracted medications:", medicationsToAdd);

        // Apply all data to form (except medications - they go to the separate AI box)
        setFormData((prev) => ({
          ...prev,
          diagnosis: diagnosisText,
          dietaryRecommendations: dietContent,
          lifestyleAdvice: lifestyleContent,
        }));
        
        // Create detailed success message
        let successParts = [];
        if (diagnosisText) successParts.push("diagnosis");
        if (medicationsToAdd.length > 0) successParts.push(`${medicationsToAdd.length} AI medications (check below)`);
        if (dietContent) successParts.push("dietary recommendations");
        if (lifestyleContent) successParts.push("lifestyle advice");
        
        const successMessage = successParts.length > 0 
          ? `AI prescription generated successfully! Added: ${successParts.join(", ")}.`
          : "AI prescription generated successfully!";
          
        toast.success(successMessage);
        
        // Also generate AI diet chart
        if (formData.patientName && formData.age) {
          try {
            await handleAIDietChart();
          } catch (error) {
            console.error("Error generating AI diet chart:", error);
            toast.warning("Prescription generated successfully, but diet chart generation failed: " + error.message);
          }
        }
      } else {
        toast.error(medData.error_message || "No prescription data received from AI");
      }
    } catch (error) {
      console.error("Error generating AI prescription:", error);
      toast.error(
        "Failed to generate AI prescription: " + error.message
      );
    } finally {
      setIsAIPrescriptionLoading(false);
    }
  };

  // AI Diet Chart Generation
  const handleAIDietChart = async () => {
    try {
      setIsDietChartLoading(true);

      // Check if patient data is available
      if (!formData.patientName || !formData.age) {
        toast.error("Please fill patient name and age first to generate AI diet chart");
        return;
      }

      console.log("Current formData:", formData);

      // Prepare patient details for diet chart generation
      const patientDetails = {
        patientName: formData.patientName,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        height: formData.height,
        weight: parseFloat(formData.weight) || 0,
        bowel_movements: formData.bowel_movements,
        constitution: formData.constitution,
        primaryHealthCondition: formData.diagnosis,
        currentSymptoms: formData.chiefComplaint,
        foodAllergies: formData.foodAllergies || "",
        healthGoals: Array.isArray(formData.healthGoals) ? formData.healthGoals : ["Improve overall health and constitution balance"]
      };

      console.log("Generating AI Diet Chart with data:", patientDetails);

      // Call diet chart AI generation endpoint using axios like DietChartGenerator
      const response = await axios.post(
        `${backendUrl}/api/doctor/diet-chart/generate-ai`,
        {
          patientDetails,
          customNutritionGoals: null // Let AI calculate goals
        },
        { headers: { dToken } }
      );

      console.log("AI Diet Chart Response:", response.data);
      
      if (response.data.success) {
        console.log("Weekly Meal Plan Structure:", response.data.weeklyMealPlan);
        console.log("Nutrition Goals:", response.data.customNutritionGoals);
        // Format the data for saving as a diet chart
        const dietChartData = {
          patientId: formData.patientId,
          patientDetails: {
            patientName: patientDetails.patientName,
            age: patientDetails.age,
            gender: patientDetails.gender,
            height: patientDetails.height,
            weight: patientDetails.weight,
            bowel_movements: patientDetails.bowel_movements,
            constitution: patientDetails.constitution,
            primaryHealthCondition: patientDetails.primaryHealthCondition,
            currentSymptoms: patientDetails.currentSymptoms,
            foodAllergies: patientDetails.foodAllergies,
            healthGoals: patientDetails.healthGoals
          },
          customNutritionGoals: response.data.customNutritionGoals,
          weeklyMealPlan: response.data.weeklyMealPlan,
          specialInstructions: response.data.explanation,
          dietaryRestrictions: patientDetails.foodAllergies || []
        };

        // Save the generated diet chart to get the chart ID
        const saveResponse = await axios.post(
          `${backendUrl}/api/doctor/diet-chart/create`,
          dietChartData,
          { headers: { dToken } }
        );
        
        if (saveResponse.data.success) {
          // Store the complete diet chart data for preview
          const completeChartData = {
            _id: saveResponse.data.dietChartId,
            patient_details: {
              patientName: patientDetails.patientName,
              age: patientDetails.age,
              gender: patientDetails.gender,
              height: patientDetails.height,
              weight: patientDetails.weight,
              constitution: patientDetails.constitution,
              primaryHealthCondition: patientDetails.primaryHealthCondition,
              currentSymptoms: patientDetails.currentSymptoms,
              foodAllergies: patientDetails.foodAllergies,
              healthGoals: patientDetails.healthGoals
            },
            custom_nutrition_goals: response.data.customNutritionGoals,
            weekly_meal_plan: response.data.weeklyMealPlan,
            special_instructions: response.data.explanation,
            dietary_restrictions: patientDetails.foodAllergies || [],
            status: 'active',
            created_at: new Date().toISOString()
          };

          // Store for immediate preview access
          setDietChartData(completeChartData);
          
          console.log("Stored diet chart data for preview:", completeChartData);

          // Set the linked diet chart with the saved chart data
          setLinkedDietChart({
            chartId: saveResponse.data.dietChartId,
            created: new Date().toISOString().split('T')[0],
            dailyCalories: response.data.customNutritionGoals?.calories || 2000,
            description: `AI-generated diet chart for ${formData.constitution || 'constitutional'} constitution with ${formData.chiefComplaint || 'general wellness concerns'}.`,
            status: 'active'
          });

          // Update dietary recommendations field with reference to diet chart
          const dietContent = `Personalized diet chart created for ${formData.constitution || 'constitutional'} constitution. Total daily calories: ${response.data.customNutritionGoals?.calories || 2000}. See linked diet chart for detailed meal planning.`;
          
          setFormData((prev) => ({
            ...prev,
            dietaryRecommendations: dietContent
          }));

          toast.success("AI diet chart generated and saved successfully!");
        } else {
          throw new Error(saveResponse.data.message || "Failed to save diet chart");
        }
      } else {
        toast.error(response.data.message || "No diet chart data received from AI");
      }
    } catch (error) {
      console.error("Error generating AI diet chart:", error);
      toast.error("Failed to generate AI diet chart: " + error.message);
    } finally {
      setIsDietChartLoading(false);
    }
  };

  // Add AI medication to form
  const addAiMedication = (medication) => {
    if (medication.name && medication.dosage) {
      setFormData((prev) => ({
        ...prev,
        medications: [...(prev.medications || []), { ...medication, id: Date.now() }],
      }));
      
      // Remove from AI forms
      setAiMedicationForms(prev => prev.filter(med => med.id !== medication.id));
      
      toast.success(`${medication.name} added to prescription!`);
    }
  };

  // Add all AI medications
  const addAllAiMedications = () => {
    const newMedications = aiMedicationForms.map(med => ({ ...med, id: Date.now() + Math.random() }));
    setFormData((prev) => ({
      ...prev,
      medications: [...(prev.medications || []), ...newMedications],
    }));
    
    setAiMedicationForms([]);
    setShowAiMedicationForms(false);
    
    toast.success(`${newMedications.length} medications added to prescription!`);
  };

  // Update AI medication form
  const updateAiMedication = (id, field, value) => {
    setAiMedicationForms(prev => 
      prev.map(med => 
        med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  // Remove AI medication form
  const removeAiMedication = (id) => {
    setAiMedicationForms(prev => prev.filter(med => med.id !== id));
    if (aiMedicationForms.length === 1) {
      setShowAiMedicationForms(false);
    }
  };

  // Toggle edit mode for AI medication
  const toggleEditAiMedication = (id) => {
    setEditingAiMedicationId(prev => prev === id ? null : id);
  };

  // Apply medication recommendation to form
  const applyMedicationRecommendation = () => {
    setFormData((prev) => ({
      ...prev,
      lifestyleAdvice: medicationRecommendation,
    }));
    setShowMedicationModal(false);
    toast.success("AI Medication recommendation applied successfully!");
  };

  // Handle PDF download
  const handleDownloadPDF = async (prescription) => {
    try {
      toast.info("Generating PDF...");

      // Create a hidden div to render prescription content
      const printDiv = document.createElement("div");
      printDiv.style.position = "absolute";
      printDiv.style.left = "-9999px";
      printDiv.style.width = "210mm";
      printDiv.style.padding = "40px";
      printDiv.style.backgroundColor = "white";
      printDiv.style.fontFamily = "Arial, sans-serif";

      // Build HTML content
      printDiv.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">AYURVEDIC PRESCRIPTION</h1>
            <p style="font-size: 16px; color: #4b5563; margin: 5px 0;">Dr. ${
              prescription.doctorInfo?.name || "N/A"
            }</p>
            <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Registration No: ${
              prescription.doctorInfo?.registrationNumber || "N/A"
            }</p>
            <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Date: ${new Date(
              prescription.date
            ).toLocaleDateString()}</p>
            <div style="display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; margin-top: 10px;">
              <span style="font-size: 13px; font-weight: 600; color: #374151;">Prescription ID: ${
                prescription.prescriptionId || prescription.id
              }</span>
            </div>
          </div>

          <!-- Patient Info and Clinical Assessment Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <!-- Patient Information -->
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #f9fafb;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">Patient Information</h3>
              <div style="line-height: 1.8;">
                <p style="margin: 8px 0;"><span style="color: #6b7280;">Name:</span> <strong>${
                  prescription.patientInfo?.name || prescription.patientName
                }</strong></p>
                <p style="margin: 8px 0;"><span style="color: #6b7280;">Age:</span> <strong>${
                  prescription.patientInfo?.age || "N/A"
                } years</strong></p>
                <p style="margin: 8px 0;"><span style="color: #6b7280;">Gender:</span> <strong>${
                  prescription.patientInfo?.gender || "N/A"
                }</strong></p>
                <p style="margin: 8px 0;"><span style="color: #6b7280;">Contact:</span> <strong>${
                  prescription.patientInfo?.contactNumber || "N/A"
                }</strong></p>
                <p style="margin: 8px 0;"><span style="color: #6b7280;">Constitution:</span> <strong>${
                  prescription.patientInfo?.constitution || "N/A"
                }</strong></p>
              </div>
            </div>

            <!-- Clinical Assessment -->
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #f9fafb;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">Clinical Assessment</h3>
              <div style="margin-bottom: 15px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Chief Complaint:</h4>
                <p style="background: #e5e7eb; padding: 10px; border-radius: 8px; font-size: 13px; color: #1f2937;">${
                  prescription.chiefComplaint || "N/A"
                }</p>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Diagnosis:</h4>
                <p style="background: #e5e7eb; padding: 10px; border-radius: 8px; font-size: 13px; color: #1f2937;">${
                  prescription.diagnosis || "N/A"
                }</p>
              </div>
            </div>
          </div>

          <!-- Medications -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">Prescribed Medications (${
              prescription.medications?.length || 0
            })</h3>
            ${
              prescription.medications
                ?.map(
                  (med, index) => `
              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                  <div style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0;">${
                    index + 1
                  }</div>
                  <div style="flex: 1;">
                    <h4 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">${
                      med.name
                    }</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 13px; margin-bottom: 10px;">
                      <div><span style="color: #6b7280; display: block; margin-bottom: 4px;">Dosage:</span><strong>${
                        med.dosage
                      }</strong></div>
                      <div><span style="color: #6b7280; display: block; margin-bottom: 4px;">Frequency:</span><strong>${
                        med.frequency
                      }</strong></div>
                      <div><span style="color: #6b7280; display: block; margin-bottom: 4px;">Duration:</span><strong>${
                        med.duration
                      }</strong></div>
                      <div><span style="color: #6b7280; display: block; margin-bottom: 4px;">Timing:</span><strong>${
                        med.timing || "Before meals"
                      }</strong></div>
                    </div>
                    ${
                      med.instructions
                        ? `<div style="margin-top: 10px;"><span style="color: #6b7280; font-size: 12px;">Instructions:</span> <span style="font-weight: 500; font-size: 13px;">${med.instructions}</span></div>`
                        : ""
                    }
                  </div>
                </div>
              </div>
            `
                )
                .join("") ||
              '<p style="color: #6b7280;">No medications prescribed</p>'
            }
          </div>

          <!-- Recommendations Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <!-- Dietary Recommendations -->
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #f9fafb;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">Dietary Recommendations</h3>
              <p style="background: #e5e7eb; padding: 12px; border-radius: 8px; font-size: 13px; color: #1f2937;">${
                prescription.dietaryRecommendations ||
                "Follow standard Ayurvedic dietary guidelines"
              }</p>
            </div>

            <!-- Lifestyle Advice -->
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #f9fafb;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">Lifestyle Advice</h3>
              <p style="background: #e5e7eb; padding: 12px; border-radius: 8px; font-size: 13px; color: #1f2937;">${
                prescription.lifestyleAdvice || "Maintain regular daily routine"
              }</p>
            </div>
          </div>

          <!-- Follow-up -->
          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px; background: #f9fafb;">
            <p style="font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 5px;">Next Follow-up Appointment</p>
            <p style="font-size: 16px; font-weight: bold; color: #1f2937;">${
              prescription.followUpDate
                ? new Date(prescription.followUpDate).toLocaleDateString()
                : "Not scheduled"
            }</p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      `;

      document.body.appendChild(printDiv);

      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate canvas
      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove the div
      document.body.removeChild(printDiv);

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");

      // Handle multi-page if content is too long
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Save
      const fileName = `Prescription_${
        prescription.prescriptionId || prescription.id
      }_${prescription.patientName?.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Create form content (will be rendered conditionally below)
  const renderCreateForm = () => (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with Title and Buttons */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create New Prescription
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Fill out the form to create a comprehensive Ayurvedic prescription
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab("saved");
              setEditingPrescription(null);
              setSelectedPatient(null);
              setPatientSearchTerm("");
              setShowPatientDropdown(false);
              // Reset form data
              setFormData({
                patientId: "",
                patientName: "",
                age: "",
                gender: "",
                contactNumber: "",
                constitution: "",
                height: { feet: 0, inches: 0 },
                weight: 0,
                bowel_movements: "",
                chiefComplaint: "",
                diagnosis: "",
                medications: [],
                dietaryRecommendations: "",
                lifestyleAdvice: "",
                followUpDate: "",
              });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePrescription}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <FileText className="w-4 h-4" />
            {editingPrescription ? "Update Prescription" : "Save Prescription"}
          </button>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Patient Information
          </h2>
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
                        <div className="font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.phone} • {patient.gender}, {patient.age}{" "}
                          years
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No patients found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <input
              type="text"
              value={formData.gender}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
              placeholder="Auto-filled from patient data"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
            </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Constitution (Prakriti)
          </label>
          <select
            value={formData.constitution}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, constitution: e.target.value }))
            }
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

        {/* Health Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.height.feet}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.height.inches}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
                  />
                  <span className="text-xs text-gray-500">in</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={formData.weight}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
              placeholder="Auto-filled"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bowel Movements
            </label>
            <input
              type="text"
              value={formData.bowel_movements}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none text-sm"
              placeholder="Auto-filled"
            />
          </div>
        </div>
      </div>

      {/* Clinical Assessment Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Clinical Assessment
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chief Complaint <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.chiefComplaint}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                chiefComplaint: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
            placeholder="Describe the patient's main symptoms and concerns"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24"
            placeholder="Enter Ayurvedic diagnosis including dosha imbalance"
          />
        </div>

        {/* AI Generate Prescription Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAIPrescriptionGeneration}
            disabled={isAIPrescriptionLoading || isDietChartLoading || !formData.chiefComplaint?.trim()}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            {(isAIPrescriptionLoading || isDietChartLoading) ? 'Generating Prescription & Diet Chart...' : 'Generate with AI'}
          </button>
        </div>
      </div>

      {/* Medications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Medications & Formulations
          </h2>
        </div>

        {/* Current Medications List */}
        {formData.medications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">
              Added Medications
            </h3>
            <div className="space-y-2">
              {formData.medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {med.name}
                    </span>
                    <span className="text-gray-600 ml-2">- {med.dosage}</span>
                    {med.frequency && (
                      <span className="text-gray-600 ml-2">
                        ({med.frequency})
                      </span>
                    )}
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
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Add New Medication
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentMedication.name}
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    dosage: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="e.g., 3g, 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={currentMedication.frequency}
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    frequency: e.target.value,
                  }))
                }
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={currentMedication.duration}
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="e.g., 2 weeks, 1 month"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timing
              </label>
              <select
                value={currentMedication.timing}
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    timing: e.target.value,
                  }))
                }
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <input
                type="text"
                value={currentMedication.instructions}
                onChange={(e) =>
                  setCurrentMedication((prev) => ({
                    ...prev,
                    instructions: e.target.value,
                  }))
                }
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

        {/* AI Generated Medication Forms */}
        {showAiMedicationForms && aiMedicationForms.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Generated Medications
              </h3>
              <button
                onClick={addAllAiMedications}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add All
              </button>
            </div>
            
            {/* Simple medication display like "Added Medications" */}
            <div className="space-y-2 mb-6">
              {aiMedicationForms.map((medication, index) => (
                <div
                  key={medication.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {medication.name}
                    </span>
                    <span className="text-gray-600 ml-2">- {medication.dosage}</span>
                    {medication.frequency && (
                      <span className="text-gray-600 ml-2">
                        ({medication.frequency})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addAiMedication(medication)}
                      className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => toggleEditAiMedication(medication.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      {editingAiMedicationId === medication.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      onClick={() => removeAiMedication(medication.id)}
                      className="text-red-600 hover:text-red-800 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Forms - Only show when edit button is clicked */}
            {editingAiMedicationId && (
              <div className="mt-6">
                {aiMedicationForms
                  .filter(medication => medication.id === editingAiMedicationId)
                  .map((medication, index) => (
                  <div key={`edit-${medication.id}`} className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Edit Medication: {medication.name}
                    </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(e) => updateAiMedication(medication.id, 'name', e.target.value)}
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
                        value={medication.dosage}
                        onChange={(e) => updateAiMedication(medication.id, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="e.g., 3g, 500mg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={medication.frequency}
                        onChange={(e) => updateAiMedication(medication.id, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="">Select frequency</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateAiMedication(medication.id, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="e.g., 2 weeks, 1 month"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timing
                      </label>
                      <select
                        value={medication.timing}
                        onChange={(e) => updateAiMedication(medication.id, 'timing', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="">Select timing</option>
                        <option value="Before food">Before food</option>
                        <option value="After food">After food</option>
                        <option value="With food">With food</option>
                        <option value="Empty stomach">Empty stomach</option>
                        <option value="Bedtime">Bedtime</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={medication.instructions}
                        onChange={(e) => updateAiMedication(medication.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="e.g., Mix with warm water"
                      />
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Recommendations
        </h2>

        {/* Diet Chart Section */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Diet Chart
            </label>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50">
            {linkedDietChart ? (
              // Show linked diet chart details
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                      Linked Diet Chart
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {linkedDietChart.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewDietChart(linkedDietChart.chartId)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => setLinkedDietChart(null)}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div><strong>Chart ID:</strong> {linkedDietChart.chartId}</div>
                  <div><strong>Created:</strong> {linkedDietChart.created}</div>
                  <div><strong>Daily Calories:</strong> {linkedDietChart.dailyCalories} kcal</div>
                  <div className="text-gray-600 mt-2">{linkedDietChart.description}</div>
                </div>
              </div>
            ) : (
              // Show placeholder when no diet chart is linked
              <div className="text-center py-8">
                <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No diet chart linked. Click "AI Diet Chart" to generate a personalized diet plan.</p>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>✓ AI-powered meal planning</div>
                  <div>✓ Constitutional diet recommendations</div>
                  <div>✓ Calorie and nutrient tracking</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-800">
              Lifestyle & Wellness Advice
            </label>
          </div>
          
          {/* Display area for lifestyle recommendations */}
          <div className="border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 min-h-[200px]">
            <textarea
              value={formData.lifestyleAdvice}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lifestyleAdvice: e.target.value,
                }))
              }
              className="w-full h-48 px-4 py-4 bg-transparent border-0 focus:ring-0 outline-none text-sm leading-relaxed resize-none"
              placeholder="Enter lifestyle recommendations...

• Personalized daily routines
• Exercise & yoga recommendations
• Sleep & stress management
• Ayurvedic lifestyle practices
• Seasonal lifestyle adjustments"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Date
          </label>
          <input
            type="date"
            value={formData.followUpDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white min-h-screen w-full p-6">
        <div className="w-full">
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
      <div className="bg-white min-h-screen w-full px-6 pt-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Prescription Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Create, manage, and download Ayurvedic prescriptions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[280px] pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Dispensed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tab Interface */}
          <div className="bg-gray-100 rounded-full p-1 mb-6 flex w-full">
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center justify-center gap-2 flex-1 px-6 py-2.5 cursor-pointer transition-all duration-200 text-sm font-medium rounded-full ${
                activeTab === "saved"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All Prescriptions ({filteredPrescriptions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center justify-center gap-2 flex-1 px-6 py-2.5 cursor-pointer transition-all duration-200 text-sm font-medium rounded-full ${
                activeTab === "create"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>

          {/* Content Area - switches based on active tab */}
          {activeTab === "create" ? (
            renderCreateForm()
          ) : (
            <>
              {/* Prescription Cards */}
              <div className="space-y-3">
                {filteredPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Side - Avatar and Basic Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4 border-r border-gray-200">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-base font-semibold text-green-700">
                            {prescription.patientName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2) || "RX"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Name and Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {prescription.patientName}
                            </h3>
                            <div className="relative status-dropdown-container">
                              <button
                                onClick={() =>
                                  setOpenStatusDropdownId(
                                    openStatusDropdownId === prescription.id
                                      ? null
                                      : prescription.id
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  prescription.status
                                )} hover:opacity-80 transition-opacity`}
                              >
                                {prescription.status}
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {/* Status Dropdown */}
                              {openStatusDropdownId === prescription.id && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                  {["Draft", "Active", "Dispensed"].map(
                                    (status) => (
                                      <button
                                        key={status}
                                        onClick={() =>
                                          handleStatusChange(
                                            prescription.id,
                                            status
                                          )
                                        }
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                          prescription.status === status
                                            ? "bg-gray-50 font-medium"
                                            : ""
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Badge Pills Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                              {prescription.prescriptionId ||
                                `#${prescription.id?.slice(-4) || "N/A"}`}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-gray-600 rounded-md text-xs">
                              <User className="w-3 h-3" />
                              {prescription.patientInfo?.age || "N/A"}y,{" "}
                              {prescription.patientInfo?.gender || "N/A"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-gray-600 rounded-md text-xs">
                              <Phone className="w-3 h-3" />
                              {prescription.patientInfo?.contactNumber || "N/A"}
                            </span>
                          </div>
                          {/* Constitution and Medications Row */}
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="text-gray-500">Constitution:</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-full text-xs font-medium">
                              {prescription.patientInfo?.constitution || "N/A"}
                            </span>
                            <span className="text-gray-500">Medications:</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-full text-xs font-medium">
                              {Array.isArray(prescription.medications)
                                ? `${prescription.medications.length} item${
                                    prescription.medications.length !== 1
                                      ? "s"
                                      : ""
                                  }`
                                : `${prescription.medications || 0} item${
                                    prescription.medications !== 1 ? "s" : ""
                                  }`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle - Clinical Info */}
                      <div className="flex-1 min-w-0 pl-4 pr-4 border-r border-gray-200">
                        <div className="mb-2">
                          <h4 className="text-xs font-medium text-gray-500 mb-0.5">
                            Chief Complaint
                          </h4>
                          <p className="text-sm text-gray-900 line-clamp-1">
                            {prescription.chiefComplaint || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-0.5">
                            Diagnosis
                          </h4>
                          <p className="text-sm text-gray-900 line-clamp-1">
                            {prescription.diagnosis || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 gap-3 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created:{" "}
                            {prescription.date
                              ? new Date(prescription.date).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Follow-up:{" "}
                            {prescription.followUpDate
                              ? new Date(
                                  prescription.followUpDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                          {prescription.emailedAt && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Mail className="w-3 h-3" />
                              Emailed:{" "}
                              {new Date(
                                prescription.emailedAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0 pl-4 min-w-[180px]">
                        <button
                          onClick={() =>
                            handlePreviewPrescription(prescription)
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleEmailPrescription(prescription)}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          title="Email Patient"
                        >
                          <Mail className="w-4 h-4" />
                          Email Patient
                        </button>
                        <button
                          onClick={() => handleDeletePrescription(prescription)}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPrescriptions.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm
                        ? "No prescriptions found matching your search."
                        : "No prescriptions created yet."}
                    </p>
                    {!searchTerm && (
                      <p className="text-gray-400 text-sm mt-2">
                        Create your first prescription to get started.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prescription Preview Modal */}
      <PrescriptionPreview
        prescription={selectedPrescription}
        isOpen={showPreview}
        onClose={handleClosePreview}
      />

      {/* Diet Chart Preview Modal */}
      {showDietChartPreview && dietChartData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Diet Chart Preview</h2>
              <button
                onClick={handleCloseDietChartPreview}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Patient Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><strong>Name:</strong> {dietChartData.patient_details?.patientName || 'N/A'}</div>
                  <div><strong>Age:</strong> {dietChartData.patient_details?.age || 'N/A'}</div>
                  <div><strong>Gender:</strong> {dietChartData.patient_details?.gender || 'N/A'}</div>
                  <div><strong>Constitution:</strong> {dietChartData.patient_details?.constitution || 'N/A'}</div>
                </div>
                {dietChartData.patient_details?.height && (
                  <div className="mt-2 text-sm">
                    <strong>Height:</strong> {
                      typeof dietChartData.patient_details.height === 'object' 
                        ? `${dietChartData.patient_details.height.feet}'${dietChartData.patient_details.height.inches}"` 
                        : dietChartData.patient_details.height
                    }
                    {dietChartData.patient_details?.weight && (
                      <span className="ml-4"><strong>Weight:</strong> {dietChartData.patient_details.weight} kg</span>
                    )}
                  </div>
                )}
                {dietChartData.patient_details?.primaryHealthCondition && (
                  <div className="mt-2 text-sm">
                    <strong>Primary Health Condition:</strong> {dietChartData.patient_details.primaryHealthCondition}
                  </div>
                )}
              </div>

              {/* Nutrition Goals */}
              {dietChartData.custom_nutrition_goals && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Nutrition Goals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong>Calories:</strong> {dietChartData.custom_nutrition_goals.macronutrients?.calories || dietChartData.custom_nutrition_goals.calories || 'N/A'}</div>
                    <div><strong>Protein:</strong> {dietChartData.custom_nutrition_goals.macronutrients?.protein || dietChartData.custom_nutrition_goals.protein || 'N/A'}g</div>
                    <div><strong>Carbs:</strong> {dietChartData.custom_nutrition_goals.macronutrients?.carbs || dietChartData.custom_nutrition_goals.carbohydrates || 'N/A'}g</div>
                    <div><strong>Fat:</strong> {dietChartData.custom_nutrition_goals.macronutrients?.fat || dietChartData.custom_nutrition_goals.fat || 'N/A'}g</div>
                  </div>
                </div>
              )}

              {/* Weekly Meal Plan */}
              {dietChartData.weekly_meal_plan && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Weekly Meal Plan</h3>
                  <div className="space-y-4">
                    {Object.entries(dietChartData.weekly_meal_plan).map(([day, meals]) => (
                      <div key={day} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-3 capitalize">{day}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((mealType) => (
                            <div key={mealType} className="bg-gray-50 p-3 rounded">
                              <h5 className="font-medium text-gray-700 mb-2">{mealType}</h5>
                              <div className="space-y-1 text-sm">
                                {meals[mealType] && meals[mealType].length > 0 ? (
                                  meals[mealType].map((food, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span className="text-gray-800">{food.name || food.food_name}</span>
                                      <span className="text-gray-600">
                                        {food.amount || food.quantity || ''}
                                        {food.serving_unit || food.unit || 'g'}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-gray-500">No items specified</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {dietChartData.special_instructions && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-yellow-800">{dietChartData.special_instructions}</p>
                </div>
              )}

              {/* Dietary Restrictions */}
              {dietChartData.dietary_restrictions && dietChartData.dietary_restrictions.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Dietary Restrictions</h3>
                  <div className="flex flex-wrap gap-2">
                    {dietChartData.dietary_restrictions.map((restriction, index) => (
                      <span key={index} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded">
                        {restriction}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Prescription
                </h3>
                <p className="text-gray-600 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the prescription for{" "}
              <span className="font-medium">
                {prescriptionToDelete?.patientName}
              </span>
              ?
              <br />
              <span className="text-sm text-gray-500">
                Created on{" "}
                {prescriptionToDelete &&
                  new Date(prescriptionToDelete.date).toLocaleDateString()}
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
                {loading ? "Deleting..." : "Delete Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prescription Generation Loading Modal */}
      {isAIPrescriptionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-purple-300 border-t-transparent animate-spin"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generating AI Prescription
              </h3>
              
              <p className="text-gray-600 mb-6">
                Our AI is analyzing the patient data and creating comprehensive treatment recommendations...
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analyzing symptoms</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Generating diagnosis</span>
                  <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Creating medicine recommendations</span>
                  <span className="text-gray-400">⏳</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Preparing lifestyle advice</span>
                  <span className="text-gray-400">⏳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Prescriptions;
