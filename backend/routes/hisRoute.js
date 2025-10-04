import express from "express";
import HISIntegrationService from "../services/hisIntegrationService.js";

const hisRouter = express.Router();

// Search patients in HIS
hisRouter.get("/patients/search", async (req, res) => {
  try {
    const { q: query, type: searchType, limit } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchCriteria = {
      query,
      searchType: searchType || "general",
      limit: limit || 20,
    };

    const result = await HISIntegrationService.searchHISPatients(
      searchCriteria
    );
    res.json(result);
  } catch (error) {
    console.error("HIS Patient Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during patient search",
      error: error.message,
    });
  }
});

// Get detailed patient information
hisRouter.get("/patients/:hisPatientId", async (req, res) => {
  try {
    const { hisPatientId } = req.params;

    const result = await HISIntegrationService.getHISPatientDetails(
      hisPatientId
    );
    res.json(result);
  } catch (error) {
    console.error("HIS Patient Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching patient details",
      error: error.message,
    });
  }
});

// Import patient from HIS to internal system
hisRouter.post("/patients/:hisPatientId/import", async (req, res) => {
  try {
    const { hisPatientId } = req.params;
    const doctorId = req.body.userId || "default-doctor"; // Use default if not provided
    const additionalData = req.body.additionalData || {};

    const result = await HISIntegrationService.createInternalPatientFromHIS(
      hisPatientId,
      doctorId,
      additionalData
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("HIS Patient Import Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during patient import",
      error: error.message,
    });
  }
});

// Get pending diet chart requests
hisRouter.get("/diet-charts/pending", async (req, res) => {
  try {
    const doctorId = req.query.doctorId || "default-doctor"; // Use query param or default
    const { limit } = req.query;

    const result = await HISIntegrationService.getPendingDietChartRequests(
      doctorId,
      limit
    );
    res.json(result);
  } catch (error) {
    console.error("HIS Pending Diet Charts Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching pending diet chart requests",
      error: error.message,
    });
  }
});

// Push diet chart to HIS
hisRouter.post("/diet-charts/push", async (req, res) => {
  try {
    const doctorId = req.body.userId || "default-doctor"; // Use default if not provided
    const { dietChart, hisPatientId } = req.body;

    if (!dietChart || !hisPatientId) {
      return res.status(400).json({
        success: false,
        message: "Diet chart and HIS Patient ID are required",
      });
    }

    const result = await HISIntegrationService.pushDietChartToHIS(
      dietChart,
      doctorId,
      hisPatientId
    );

    res.json(result);
  } catch (error) {
    console.error("HIS Diet Chart Push Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error pushing diet chart to HIS",
      error: error.message,
    });
  }
});

// Get HIS integration statistics
hisRouter.get("/statistics", async (req, res) => {
  try {
    const doctorId = req.query.doctorId || null; // Make doctor ID optional for statistics

    const result = await HISIntegrationService.getHISStatistics(doctorId);
    res.json(result);
  } catch (error) {
    console.error("HIS Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching HIS statistics",
      error: error.message,
    });
  }
});

// Health check for HIS integration
hisRouter.get("/health", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "HIS Integration Service is running",
      timestamp: new Date().toISOString(),
      database: "hospital_his_system",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "HIS Integration Service health check failed",
      error: error.message,
    });
  }
});

export default hisRouter;
