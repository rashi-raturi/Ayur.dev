/**
 * AI API Service for Ayurvedic Recommendations
 * Handles communication with the deployed RAG model endpoints
 */

const AI_ENDPOINTS = {
  diet: "https://ayurgenixai-dr4y.onrender.com/generate-diet",
  lifestyle: "https://ayurgenixai-dr4y.onrender.com/generate-medication",
};

/**
 * Prepares patient data for AI API requests
 * @param {Object} formData - The prescription form data
 * @returns {Object} Formatted data for AI API
 */
export const preparePatientDataForAI = (formData) => {
  // Convert symptoms to array if it's a string
  let symptomsArray;
  if (formData.chiefComplaint) {
    symptomsArray = formData.chiefComplaint.includes(',') 
      ? formData.chiefComplaint.split(',').map(s => s.trim())
      : [formData.chiefComplaint];
  } else {
    symptomsArray = ["general wellness"];
  }

  return {
    name: formData.patientName || "Patient",
    gender: (formData.gender || "male").toLowerCase(),
    constitution_dosha: (formData.constitution || "vata").toLowerCase(),
    age: parseInt(formData.age) || 30,
    symptoms: symptomsArray,
    doctor_diagnosis: formData.diagnosis || "General consultation for wellness",
    // Optional fields
    chief_complaint: formData.chiefComplaint || "general wellness",
    weight: parseFloat(formData.weight) || 70,
    height_feet: parseInt(formData.height?.feet) || 5,
    height_inches: parseInt(formData.height?.inches) || 6,
    bowel_movements: formData.bowel_movements || "normal",
  };
};

/**
 * Makes API call to get AI diet recommendations
 * @param {Object} patientData - Formatted patient data
 * @returns {Promise<Object>} AI response with diet recommendations
 */
export const getAIDietRecommendation = async (patientData) => {
  try {
    const response = await fetch(AI_ENDPOINTS.diet, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.diet_chart) {
      throw new Error("No diet recommendation received from AI");
    }

    return {
      success: true,
      content: data.diet_chart,
      type: "Diet",
    };
  } catch (error) {
    console.error("Error getting AI diet recommendation:", error);
    throw new Error(`Failed to get AI diet recommendation: ${error.message}`);
  }
};

/**
 * Makes API call to get AI lifestyle recommendations
 * @param {Object} patientData - Formatted patient data
 * @returns {Promise<Object>} AI response with lifestyle recommendations
 */
export const getAILifestyleRecommendation = async (patientData) => {
  try {
    const response = await fetch(AI_ENDPOINTS.lifestyle, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.lifestyle_advice) {
      throw new Error("No lifestyle recommendation received from AI");
    }

    return {
      success: true,
      content: data.lifestyle_advice,
      type: "Lifestyle",
    };
  } catch (error) {
    console.error("Error getting AI lifestyle recommendation:", error);
    throw new Error(
      `Failed to get AI lifestyle recommendation: ${error.message}`
    );
  }
};

/**
 * Validates if patient data is sufficient for AI recommendations
 * @param {Object} formData - The prescription form data
 * @returns {Object} Validation result
 */
export const validatePatientDataForAI = (formData) => {
  const errors = [];

  if (!formData.chiefComplaint?.trim()) {
    errors.push("Chief complaint is required for AI recommendations");
  }

  if (!formData.constitution?.trim()) {
    errors.push(
      "Constitution (Prakriti) is required for accurate AI recommendations"
    );
  }

  if (!formData.age || parseInt(formData.age) <= 0) {
    errors.push("Valid age is required for AI recommendations");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
