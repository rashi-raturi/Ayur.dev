import { useState, useContext, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  ChefHat,
  Download,
  User,
  Utensils,
  Heart,
  Target,
  RefreshCw,
  FileText,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import { DoctorContext } from "../context/DoctorContext";
import { toast } from "react-toastify";

export default function DietChartGenerator() {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [patients, setPatients] = useState([]);
  const [hisPatients, setHisPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [searchSource, setSearchSource] = useState("internal"); // 'internal' or 'his'
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "",

    primaryConstitution: "",
    lifestyle: "",

    primaryCondition: "",
    currentSymptoms: "",
    foodAllergies: "",

    healthGoals: [],
  });

  const [generatedDietChart, setGeneratedDietChart] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/doctor/patients`, {
        headers: {
          Authorization: `Bearer ${dToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchHISPatients = async (query = "") => {
    if (!query || query.length < 2) {
      setHisPatients([]);
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/his/patients/search?q=${encodeURIComponent(
          query
        )}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setHisPatients(data.patients || []);
      } else {
        console.error("HIS search failed:", data.message);
        setHisPatients([]);
        toast.error(data.message || "Failed to search HIS patients");
      }
    } catch (error) {
      console.error("Error fetching HIS patients:", error);
      setHisPatients([]);
      toast.error("Error searching HIS patients");
    }
  };

  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    if (searchSource === "his") {
      fetchHISPatients(query);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      patientName: patient.name,
      age: patient.age || "",
      gender: patient.gender || "",
      primaryConstitution: patient.constitution || "",
      lifestyle: "",
      primaryCondition: patient.conditions || patient.condition || "",
      currentSymptoms: "",
      foodAllergies: patient.allergies || patient.foodAllergies || "",
      healthGoals: [],
    });
    setShowPatientSelector(false);
    const patientSource = patient.hisPatientId ? "HIS" : "Internal";
    toast.success(
      `Patient ${patient.name} data loaded successfully from ${patientSource}!`
    );
  };

  // Save generated charts to localStorage
  const saveChartToHistory = (chartData) => {
    const existingCharts = JSON.parse(
      localStorage.getItem("dietCharts") || "[]"
    );
    const newChart = {
      id: Date.now(),
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      constitution: formData.primaryConstitution,
      generatedDate: new Date().toISOString(),
      chartContent: chartData,
      formData: { ...formData },
    };

    existingCharts.unshift(newChart); // Add to beginning
    localStorage.setItem("dietCharts", JSON.stringify(existingCharts));
  };

  // Constitution options
  const constitutions = [
    { value: "vata", label: "Vata (Air & Space)" },
    { value: "pitta", label: "Pitta (Fire & Water)" },
    { value: "kapha", label: "Kapha (Earth & Water)" },
    { value: "vata-pitta", label: "Vata-Pitta" },
    { value: "pitta-kapha", label: "Pitta-Kapha" },
    { value: "vata-kapha", label: "Vata-Kapha" },
    { value: "tridoshic", label: "Tridoshic (Balanced)" },
  ];

  // Lifestyle options
  const lifestyles = [
    { value: "sedentary", label: "Sedentary (Office work, minimal exercise)" },
    {
      value: "lightly-active",
      label: "Lightly Active (Light exercise 1-3 days/week)",
    },
    {
      value: "moderately-active",
      label: "Moderately Active (Moderate exercise 3-5 days/week)",
    },
    {
      value: "very-active",
      label: "Very Active (Heavy exercise 6-7 days/week)",
    },
    {
      value: "extremely-active",
      label: "Extremely Active (Physical job + exercise)",
    },
  ];

  // Health goals options
  const healthGoalOptions = [
    { id: "weight-management", label: "Weight Management" },
    { id: "improve-digestion", label: "Improve Digestion" },
    { id: "reduce-inflammation", label: "Reduce Inflammation" },
    { id: "boost-energy", label: "Boost Energy" },
    { id: "better-sleep", label: "Better Sleep" },
    { id: "stress-reduction", label: "Stress Reduction" },
    { id: "detoxification", label: "Detoxification" },
    { id: "immune-support", label: "Immune Support" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHealthGoalChange = (goalId) => {
    setFormData((prev) => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goalId)
        ? prev.healthGoals.filter((id) => id !== goalId)
        : [...prev.healthGoals, goalId],
    }));
  };

  const generateDietChart = async () => {
    // Validate required fields
    if (
      !formData.patientName ||
      !formData.age ||
      !formData.gender ||
      !formData.primaryConstitution
    ) {
      alert("Please fill in all required patient information fields.");
      return;
    }

    setLoading(true);

    try {
      // Prepare patient details for AI API
      const patientDetails = {
        name: formData.patientName,
        age: parseInt(formData.age),
        gender: formData.gender,
        constitution: formData.primaryConstitution,
        lifestyle: formData.lifestyle,
        primaryHealthCondition: formData.primaryCondition,
        currentSymptoms: formData.currentSymptoms,
        foodAllergies: formData.foodAllergies,
        healthGoals: formData.healthGoals,
      };

      // Call the AI diet chart generation API
      const response = await fetch(`${backendUrl}/api/doctor/diet-chart/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dToken}`,
        },
        body: JSON.stringify({
          patientDetails,
          customNutritionGoals: null, // Let AI calculate goals
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedDietChart(data.dietChart);
        saveChartToHistory(data.dietChart);
        setShowForm(false); // Hide form after generating chart
        toast.success('AI Diet Chart generated successfully!');
      } else {
        console.error('AI Generation failed:', data.message);
        // Fallback to sample data if AI fails
        const sampleDietChart = generateSampleDietChart(formData);
        setGeneratedDietChart(sampleDietChart);
        saveChartToHistory(sampleDietChart);
        setShowForm(false);
        toast.warning('Using sample data - AI service unavailable');
      }
    } catch (error) {
      console.error("Error generating diet chart:", error);
      // Fallback to sample data if API call fails
      const sampleDietChart = generateSampleDietChart(formData);
      setGeneratedDietChart(sampleDietChart);
      saveChartToHistory(sampleDietChart);
      setShowForm(false);
      toast.error('AI service unavailable, using sample data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedDietChart) return;

    setDownloadingPdf(true);
    try {
      // Create PDF instance
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (
        text,
        x,
        y,
        maxWidth,
        fontSize = 10,
        fontStyle = "normal"
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", fontStyle);
        const lines = pdf.splitTextToSize(text, maxWidth);

        for (let i = 0; i < lines.length; i++) {
          if (y + i * lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(lines[i], x, y + i * lineHeight);
        }
        return y + lines.length * lineHeight;
      };

      // Add header with styling
      pdf.setFillColor(52, 152, 219); // Blue background
      pdf.rect(0, 0, pageWidth, 40, "F");

      pdf.setTextColor(255, 255, 255); // White text
      yPosition = addText(
        "🌿 AYURVEDIC DIET CHART",
        margin,
        15,
        pageWidth - 2 * margin,
        18,
        "bold"
      );
      yPosition = addText(
        "Personalized Nutritional Guidance",
        margin,
        25,
        pageWidth - 2 * margin,
        12
      );

      pdf.setTextColor(0, 0, 0); // Reset to black
      yPosition = 50;

      // Patient Information Header
      yPosition = addText(
        `Patient: ${formData.patientName} | Age: ${formData.age} | Gender: ${formData.gender}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
        12,
        "bold"
      );
      yPosition = addText(
        `Generated on: ${new Date().toLocaleDateString()}`,
        margin,
        yPosition + 5,
        pageWidth - 2 * margin,
        10,
        "italic"
      );
      yPosition += 15;

      // Process diet plan content
      const processPdfContent = (content, title) => {
        // Add section title
        yPosition += 5;
        yPosition = addText(
          title,
          margin,
          yPosition,
          pageWidth - 2 * margin,
          16,
          "bold"
        );
        yPosition += 5;

        const lines = content.split("\n");

        for (let line of lines) {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }

          line = line.trim();
          if (!line) {
            yPosition += 3;
            continue;
          }

          // Handle different markdown elements
          if (line.startsWith("# ")) {
            yPosition += 5;
            yPosition = addText(
              line.replace("# ", ""),
              margin,
              yPosition,
              pageWidth - 2 * margin,
              16,
              "bold"
            );
            yPosition += 5;
          } else if (line.startsWith("## ")) {
            yPosition += 3;
            yPosition = addText(
              line.replace("## ", ""),
              margin,
              yPosition,
              pageWidth - 2 * margin,
              14,
              "bold"
            );
            yPosition += 3;
          } else if (line.startsWith("### ")) {
            yPosition += 2;
            yPosition = addText(
              line.replace("### ", ""),
              margin,
              yPosition,
              pageWidth - 2 * margin,
              12,
              "bold"
            );
            yPosition += 2;
          } else if (line.startsWith("**") && line.endsWith("**")) {
            yPosition = addText(
              line.replace(/\*\*/g, ""),
              margin,
              yPosition,
              pageWidth - 2 * margin,
              11,
              "bold"
            );
          } else if (line.startsWith("- ") || line.startsWith("• ")) {
            yPosition = addText(
              line,
              margin + 5,
              yPosition,
              pageWidth - 2 * margin - 5,
              10
            );
          } else if (line.startsWith("|") && !line.includes("---")) {
            // Handle table rows - simplified for PDF
            const cells = line.split("|").filter((cell) => cell.trim());
            if (cells.length > 0) {
              yPosition = addText(
                cells.join(" | "),
                margin + 5,
                yPosition,
                pageWidth - 2 * margin - 5,
                9
              );
            }
          } else if (line.startsWith("---")) {
            yPosition += 3;
          } else {
            yPosition = addText(
              line.replace(/\*\*/g, "").replace(/\*/g, ""),
              margin,
              yPosition,
              pageWidth - 2 * margin,
              10
            );
          }
          yPosition += 2;
        }
      };

      // Add diet plan section
      processPdfContent(generatedDietChart.dietPlan, "DAILY DIET PLAN");

      // Add new page for guidelines
      pdf.addPage();
      yPosition = margin;

      // Add guidelines section
      processPdfContent(
        generatedDietChart.guidelines,
        "GUIDELINES & RECOMMENDATIONS"
      );

      // Add footer to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(
          `Generated by Ayurveda Healthcare System - Page ${i} of ${totalPages} - For educational purposes only. Consult healthcare professionals for medical advice.`,
          margin,
          footerY,
          { maxWidth: pageWidth - 2 * margin }
        );
      }

      // Save the PDF
      const fileName = `ayurvedic-diet-chart-${formData.patientName.replace(
        /\s+/g,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedDietChart("");
    setShowForm(true);
  };

  return (
    <div className="bg-yellow-100 w-full min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">
              Diet Chart Generator
            </h1>
          </div>
          <p className="text-gray-600">
            Create personalized Ayurvedic meal plans
          </p>

          {/* Patient Auto-fill Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowPatientSelector(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Users className="w-4 h-4" />
              Auto-fill from Patient
            </button>
            {selectedPatient && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Loaded data for {selectedPatient.name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div
            className={`bg-white rounded-lg shadow-lg p-6 ${
              generatedDietChart
                ? "lg:col-span-1"
                : "lg:col-span-2 max-w-4xl mx-auto"
            }`}
          >
            {/* Patient Information */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Patient Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter patient name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.patientName}
                    onChange={(e) =>
                      handleInputChange("patientName", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    placeholder="Age"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ayurvedic Assessment */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Utensils className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Ayurvedic Assessment
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Constitution *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.primaryConstitution}
                    onChange={(e) =>
                      handleInputChange("primaryConstitution", e.target.value)
                    }
                  >
                    <option value="">Select constitution</option>
                    {constitutions.map((constitution) => (
                      <option
                        key={constitution.value}
                        value={constitution.value}
                      >
                        {constitution.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lifestyle
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.lifestyle}
                    onChange={(e) =>
                      handleInputChange("lifestyle", e.target.value)
                    }
                  >
                    <option value="">Select lifestyle</option>
                    {lifestyles.map((lifestyle) => (
                      <option key={lifestyle.value} value={lifestyle.value}>
                        {lifestyle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Health Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Condition/Concern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Digestive issues, Weight management, Stress"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.primaryCondition}
                    onChange={(e) =>
                      handleInputChange("primaryCondition", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Symptoms
                  </label>
                  <textarea
                    placeholder="Describe current symptoms or imbalances"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows="3"
                    value={formData.currentSymptoms}
                    onChange={(e) =>
                      handleInputChange("currentSymptoms", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Food Allergies/Restrictions
                  </label>
                  <input
                    type="text"
                    placeholder="Any foods to avoid"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.foodAllergies}
                    onChange={(e) =>
                      handleInputChange("foodAllergies", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Health Goals */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Health Goals
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {healthGoalOptions.map((goal) => (
                  <label
                    key={goal.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      checked={formData.healthGoals.includes(goal.id)}
                      onChange={() => handleHealthGoalChange(goal.id)}
                    />
                    <span className="text-sm text-gray-700">{goal.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateDietChart}
              disabled={
                loading ||
                !formData.patientName ||
                !formData.age ||
                !formData.gender ||
                !formData.primaryConstitution
              }
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                loading ||
                !formData.patientName ||
                !formData.age ||
                !formData.gender ||
                !formData.primaryConstitution
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Diet Chart...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Utensils className="w-5 h-5" />
                  <span>Generate Diet Chart</span>
                </div>
              )}
            </button>
          </div>

          {/* Generated Diet Chart Section - Enhanced UI */}
          {generatedDietChart && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Chart Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Ayurvedic Diet Chart
                      </h2>
                      <p className="text-green-100 text-sm">
                        For {formData.patientName}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingPdf ? "Generating PDF..." : "Download PDF"}
                      </span>
                    </button>

                    <button
                      onClick={handleGenerateAgain}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate Again</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {/* Patient Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Patient Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Name:</span>
                      <p className="text-blue-800">{formData.patientName}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Age:</span>
                      <p className="text-blue-800">{formData.age} years</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Gender:</span>
                      <p className="text-blue-800 capitalize">
                        {formData.gender}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        Constitution:
                      </span>
                      <p className="text-blue-800">
                        {
                          constitutions.find(
                            (c) => c.value === formData.primaryConstitution
                          )?.label
                        }
                      </p>
                    </div>
                  </div>

                  {formData.healthGoals.length > 0 && (
                    <div className="mt-3">
                      <span className="text-blue-600 font-medium text-sm">
                        Health Goals:
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.healthGoals.map((goalId) => (
                          <span
                            key={goalId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {
                              healthGoalOptions.find((opt) => opt.id === goalId)
                                ?.label
                            }
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Chart Content */}
                <div className="space-y-6">
                  {/* Diet Plan Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🍽️</span>
                      </div>
                      <h3 className="text-xl font-bold text-green-800">
                        Daily Diet Plan
                      </h3>
                    </div>
                    <div className="prose prose-green max-w-none prose-headings:text-green-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-green-700 max-h-[400px] overflow-y-auto">
                      <ReactMarkdown>
                        {generatedDietChart.dietPlan}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Guidelines Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📋</span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-800">
                        Guidelines & Recommendations
                      </h3>
                    </div>
                    <div className="prose prose-blue max-w-none prose-headings:text-blue-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-blue-700 max-h-[400px] overflow-y-auto">
                      <ReactMarkdown>
                        {generatedDietChart.guidelines}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Action Buttons at Bottom */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Generated on {new Date().toLocaleDateString()} at{" "}
                    {new Date().toLocaleTimeString()}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingPdf ? "Generating..." : "Download PDF"}
                      </span>
                    </button>

                    <button
                      onClick={handleGenerateAgain}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate Again</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no chart is generated */}
          {!generatedDietChart && (
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-1">
              <div className="text-center py-12 text-gray-500">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No diet chart generated yet</p>
                <p className="text-sm">
                  Fill out the form and click &quot;Generate Diet Chart&quot; to
                  create a personalized Ayurvedic meal plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Selector Modal */}
      {showPatientSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Select Patient
              </h3>
              <button
                onClick={() => setShowPatientSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Patient Source Selection */}
            <div className="mb-4">
              <div className="flex space-x-4 mb-3">
                <button
                  onClick={() => {
                    setSearchSource("internal");
                    setSearchQuery("");
                    setHisPatients([]);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    searchSource === "internal"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Internal Patients ({patients.length})
                </button>
                <button
                  onClick={() => {
                    setSearchSource("his");
                    setSearchQuery("");
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    searchSource === "his"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  HIS Patients
                </button>
              </div>

              {/* Search input for HIS patients */}
              {searchSource === "his" && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search HIS patients (minimum 2 characters)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Search by name, phone, email, or patient ID
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {searchSource === "internal" &&
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {patient.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {patient.age} years • {patient.gender}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">
                          Internal Patient
                        </p>
                        {patient.constitution && (
                          <p className="text-sm text-blue-600">
                            Constitution: {patient.constitution}
                          </p>
                        )}
                        {patient.condition && (
                          <p className="text-sm text-orange-600">
                            Condition: {patient.condition}
                          </p>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Select
                      </button>
                    </div>
                  </div>
                ))}

              {searchSource === "his" &&
                hisPatients.map((patient) => (
                  <div
                    key={patient.hisPatientId}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {patient.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {patient.age} years • {patient.gender}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          HIS Patient • ID: {patient.hisPatientId}
                        </p>
                        {patient.constitution && (
                          <p className="text-sm text-green-600">
                            Constitution: {patient.constitution}
                          </p>
                        )}
                        {patient.conditions && (
                          <p className="text-sm text-orange-600">
                            Conditions: {patient.conditions}
                          </p>
                        )}
                        {patient.allergies && (
                          <p className="text-sm text-red-600">
                            Allergies: {patient.allergies}
                          </p>
                        )}
                      </div>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Select
                      </button>
                    </div>
                  </div>
                ))}

              {searchSource === "internal" && patients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No internal patients found</p>
                  <p className="text-sm">Add patients first to use auto-fill</p>
                </div>
              )}

              {searchSource === "his" && searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Enter at least 2 characters to search HIS patients</p>
                </div>
              )}

              {searchSource === "his" &&
                searchQuery.length >= 2 &&
                hisPatients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No HIS patients found for "{searchQuery}"</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
