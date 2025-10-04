import HISPatientModel, {
  getHISPatientModel,
} from "../models/hisPatientModel.js";
import HISDietChartModel, {
  getHISDietChartModel,
} from "../models/hisDietChartModel.js";
import userModel from "../models/userModel.js";

// HIS Integration Service - Real Database Implementation
class HISIntegrationService {
  // Search patients in HIS by various criteria
  static async searchHISPatients(searchCriteria) {
    try {
      // Ensure we have the model
      const PatientModel = await getHISPatientModel();
      
      if (!PatientModel) {
        throw new Error("HIS Patient model not initialized");
      }

      const { query, searchType = "general", limit = 20 } = searchCriteria;

      if (!query || query.trim().length < 2) {
        return {
          success: false,
          message: "Search query must be at least 2 characters long",
        };
      }

      let searchQuery = {};
      const searchTerm = query.trim();

      switch (searchType) {
        case "id":
          searchQuery = { hisPatientId: { $regex: searchTerm, $options: "i" } };
          break;
        case "phone":
          searchQuery = {
            $or: [
              { primaryPhone: { $regex: searchTerm, $options: "i" } },
              { secondaryPhone: { $regex: searchTerm, $options: "i" } },
            ],
          };
          break;
        case "email":
          searchQuery = { email: { $regex: searchTerm, $options: "i" } };
          break;
        default:
          // General search - name, phone, email, or ID
          searchQuery = {
            $or: [
              { fullName: { $regex: searchTerm, $options: "i" } },
              { firstName: { $regex: searchTerm, $options: "i" } },
              { lastName: { $regex: searchTerm, $options: "i" } },
              { hisPatientId: { $regex: searchTerm, $options: "i" } },
              { primaryPhone: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
            ],
          };
      }

      // Only return active patients eligible for diet planning
      searchQuery.patientStatus = "Active";
      searchQuery.isEligibleForDietPlanning = true;

      const patients = await PatientModel.find(searchQuery)
        .limit(parseInt(limit))
        .sort({ lastVisitDate: -1, fullName: 1 })
        .lean();

      // Format patients for frontend
      // Map HIS patient data to internal format
      const mappedPatients = patients.map((patient) => ({
        hisPatientId: patient.hisPatientId,
        name: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.primaryPhone,
        gender: patient.gender,
        age: patient.age,
        address: patient.address
          ? `${patient.address.street}, ${patient.address.city}`
          : "",
        constitution: patient.constitution,
        conditions:
          patient.chronicConditions?.map((c) => c.condition).join(", ") || "",
        allergies: patient.allergies?.join(", ") || "",
        bmi: patient.bmi,
        weight: patient.weight,
        status: patient.status,
        lastVisit: patient.lastVisit,
        eligible: patient.eligibleForDietPlanning,
      }));

      return {
        success: true,
        patients: mappedPatients,
        total: mappedPatients.length,
        message: `Found ${mappedPatients.length} patients matching "${query}"`,
      };
    } catch (error) {
      console.error("HIS Search Error:", error);
      return {
        success: false,
        message: "Error searching HIS patients",
        error: error.message,
      };
    }
  }

  // Get detailed patient information from HIS
  static async getHISPatientDetails(hisPatientId) {
    try {
      // Ensure we have the model
      const PatientModel = await getHISPatientModel();
      
      if (!PatientModel) {
        throw new Error("HIS Patient model not initialized");
      }

      const patient = await PatientModel.findOne({ hisPatientId }).lean();

      if (!patient) {
        return {
          success: false,
          message: "Patient not found in HIS",
        };
      }

      // Transform for internal system format with proper field mapping
      const patientDetails = {
        hisPatientId: patient.hisPatientId,
        name: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.primaryPhone,
        dateOfBirth: patient.dateOfBirth,
        age: patient.age,
        gender: patient.gender,
        address: patient.address
          ? `${patient.address.street}, ${patient.address.city}, ${patient.address.state}`
          : "",
        weight: patient.weight,
        height: patient.height,
        bmi: patient.bmi,
        constitution: patient.constitution,
        conditions:
          patient.chronicConditions?.map((c) => c.condition).join(", ") || "",
        allergies: patient.allergies?.join(", ") || "",
        status: patient.status,
        lastVisit: patient.lastVisit,
        eligible: patient.eligibleForDietPlanning,
      };

      return {
        success: true,
        patient: patientDetails,
      };
    } catch (error) {
      console.error("HIS Patient Details Error:", error);
      return {
        success: false,
        message: "Error fetching patient details from HIS",
        error: error.message,
      };
    }
  }

  // Import patient from HIS to internal system
  static async createInternalPatientFromHIS(
    hisPatientId,
    doctorId,
    additionalData = {}
  ) {
    try {
      // Get HIS patient data
      const hisPatientResponse = await this.getHISPatientDetails(hisPatientId);
      if (!hisPatientResponse.success) {
        return hisPatientResponse;
      }

      const hisPatient = hisPatientResponse.patient;

      // Check if patient already exists in our system by phone or email
      const existingPatient = await userModel.findOne({
        $or: [{ email: hisPatient.email }, { phone: hisPatient.phone }],
      });

      if (existingPatient) {
        return {
          success: false,
          message: "Patient already exists in internal system",
          existingPatient: existingPatient,
        };
      }

      // Hash password
      const bcrypt = (await import("bcrypt")).default;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("patient123", salt); // Default password

      // Map HIS patient data to internal patient format
      const patientData = {
        name: hisPatient.name,
        email: hisPatient.email,
        password: hashedPassword,
        phone: hisPatient.phone,
        address: {
          line1: hisPatient.address || "",
          line2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        gender: hisPatient.gender,
        dob: hisPatient.dateOfBirth || new Date(),
        constitution: hisPatient.constitution || "",
        condition: hisPatient.conditions || "",
        foodAllergies: hisPatient.allergies || "",
        height: hisPatient.height || { feet: 0, inches: 0 },
        weight: hisPatient.weight || 0,
        bowel_movements: "Normal", // Default value
        doctor: doctorId,
        notes: `Imported from HMS (${hisPatientId}) on ${new Date().toDateString()}. BMI: ${
          hisPatient.bmi || "N/A"
        }`,
      };

      const newPatient = new userModel(patientData);
      const savedPatient = await newPatient.save();

      // Update HIS patient sync status
      const PatientModel = await getHISPatientModel();
      if (PatientModel) {
        await PatientModel.updateOne(
          { hisPatientId },
          {
            syncedWithAyurvedicSystem: true,
            lastSyncDate: new Date(),
          }
        );
      }

      return {
        success: true,
        message: "Patient successfully imported from HIS",
        patient: { ...savedPatient.toObject(), password: undefined },
        hisData: hisPatient,
      };
    } catch (error) {
      console.error("HIS Patient Import Error:", error);
      return {
        success: false,
        message: "Error importing patient from HIS",
        error: error.message,
      };
    }
  }

  // Get pending diet chart requests from HIS
  static async getPendingDietChartRequests(doctorId, limit = 10) {
    try {
      const DietChartModel = await getHISDietChartModel();
      
      if (!DietChartModel) {
        throw new Error("HIS Diet Chart model not initialized");
      }
      
      // Get both pending requests and recent completed ones (synced from main system)
      const [pendingRequests, recentCompleted] = await Promise.all([
        DietChartModel.find({
          status: "Pending",
        })
          .populate("hisPatientId", "fullName age constitution")
          .sort({ priority: 1, requestDate: 1 })
          .limit(parseInt(limit))
          .lean(),

        DietChartModel.find({
          status: "Completed",
          "hospitalMetadata.createdInMainSystem": true,
          completedDate: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          }, // Last 7 days
        })
          .populate("hisPatientId", "fullName age constitution")
          .sort({ completedDate: -1 })
          .limit(5)
          .lean(),
      ]);

      const formatRequest = (request) => ({
        hisDietChartId: request.hisDietChartId,
        hisPatientId: request.hisPatientId,
        patientName: request.hisPatientId?.fullName || "Unknown Patient",
        patientAge: request.hisPatientId?.age || "N/A",
        patientConstitution: request.hisPatientId?.constitution || "N/A",
        requestedBy: request.requestedBy.doctorName || request.requestedBy,
        requestDate: request.requestDate,
        completedDate: request.completedDate,
        priority: request.priority,
        requestType: request.requestType,
        status: request.status,
        specialRequirements: request.specialRequirements,
        patientCondition: request.patientCondition,
        syncedFromMainSystem:
          request.hospitalMetadata?.createdInMainSystem || false,
      });

      const formattedPending = pendingRequests.map(formatRequest);
      const formattedCompleted = recentCompleted.map(formatRequest);

      return {
        success: true,
        pendingRequests: formattedPending,
        recentlyCompleted: formattedCompleted,
        totalPending: formattedPending.length,
        totalCompleted: formattedCompleted.length,
      };
    } catch (error) {
      console.error("HIS Pending Requests Error:", error);
      return {
        success: false,
        message: "Error fetching pending diet chart requests",
        error: error.message,
      };
    }
  }

  // Push diet chart back to HIS database
  static async pushDietChartToHIS(dietChart, doctorId, hisPatientId) {
    try {
      const DietChartModel = await getHISDietChartModel();
      
      if (!DietChartModel) {
        throw new Error("HIS Diet Chart model not initialized");
      }
      
      // Create new diet chart record in HIS
      const hisDietChart = new DietChartModel({
        hisDietChartId: DietChartModel.generateDietChartId(),
        hisPatientId: hisPatientId,
        requestedBy: {
          doctorName: dietChart.doctorName || "Ayurveda Doctor",
          doctorId: doctorId,
          department: "Ayurveda",
        },
        requestType: dietChart.requestType || "General Wellness",
        patientCondition: dietChart.patientCondition || "General Health",
        constitution: dietChart.constitution || "Unknown",
        dietChart: dietChart.mealPlan || dietChart.dietChart,
        ayurvedicGuidelines: dietChart.ayurvedicGuidelines || {},
        status: "Generated",
        generatedBy: {
          systemId: "AYURVEDA_AI_SYSTEM",
          aiModel: "GPT-4-Ayurveda",
          generatedAt: new Date(),
          doctorApproved: false,
        },
        deliveredToHIS: true,
        deliveryDate: new Date(),
      });

      const savedDietChart = await hisDietChart.save();

      console.log(
        `✅ Diet chart ${savedDietChart.hisDietChartId} synced to HIS successfully`
      );

      return {
        success: true,
        message: "Diet chart successfully synced to HIS",
        synced: true,
        hisDietChartId: savedDietChart.hisDietChartId,
        dietChart: savedDietChart,
      };
    } catch (error) {
      console.error("Error syncing diet chart to HIS:", error);
      return {
        success: false,
        message: "Error syncing diet chart to HIS",
        error: error.message,
        synced: false,
      };
    }
  }

  // Get HIS statistics
  static async getHISStatistics(doctorId) {
    try {
      // Ensure we have the models
      const PatientModel = await getHISPatientModel();
      const DietChartModel = await getHISDietChartModel();
      
      if (!PatientModel) {
        throw new Error("HIS Patient model not initialized");
      }
      
      if (!DietChartModel) {
        throw new Error("HIS Diet Chart model not initialized");
      }

      const [totalPatients, pendingCharts, generatedCharts, syncedPatients] =
        await Promise.all([
          PatientModel.countDocuments({ patientStatus: "Active" }),
          DietChartModel.countDocuments({ status: "Pending" }),
          DietChartModel.countDocuments({ status: "Generated" }),
          PatientModel.countDocuments({ syncedWithAyurvedicSystem: true }),
        ]);

      return {
        success: true,
        stats: {
          totalHISPatients: totalPatients,
          pendingDietCharts: pendingCharts,
          generatedDietCharts: generatedCharts,
          syncedPatients: syncedPatients,
          integrationRate:
            totalPatients > 0
              ? ((syncedPatients / totalPatients) * 100).toFixed(1)
              : 0,
        },
      };
    } catch (error) {
      console.error("HIS Stats Error:", error);
      return {
        success: false,
        message: "Error fetching HIS statistics",
        error: error.message,
      };
    }
  }
}

export default HISIntegrationService;

// Named exports for specific functions
export const {
  searchHISPatients,
  getHISPatientDetails,
  createInternalPatientFromHIS,
  getPendingDietChartRequests,
  getHISStatistics,
  pushDietChartToHIS,
} = HISIntegrationService;
