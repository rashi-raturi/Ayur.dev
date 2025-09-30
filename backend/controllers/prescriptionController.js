import fs from 'fs';
// import the core parser directly to skip pdf-parse index debug code
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mongoose from 'mongoose';

import { Groq } from 'groq-sdk';
import Prescription from '../models/prescriptionModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// POST /api/user/prescription
export const uploadPrescription = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
	
		const fileBuffer = fs.readFileSync(req.file.path);
		const data = await pdfParse(fileBuffer);
		const text = data.text;

		const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
		
		let parsed = {};
		try {
			const chatCompletion = await groq.chat.completions.create({
				messages: [
					{
						role: "user",
						content: `Extract fields date, patient name, doctor name, symptoms, medicine, recommendations, notes from this prescription in json format. Like { "patient name" : ...} Return only the JSON object.\n\n${text}`
					}
				],
				model: "deepseek-r1-distill-llama-70b",
				temperature: 0.6,
				max_completion_tokens: 4096,
				top_p: 0.95,
				stream: false,
				response_format: {
					type: "json_object"
				}
			});
			
			const content = chatCompletion.choices[0].message.content;
			parsed = JSON.parse(content);

			// Ensure arrays are properly formatted
			const ensureArray = (value) => {
				if (Array.isArray(value)) return value;
				if (typeof value === 'string') {
					try {
						const parsedArray = JSON.parse(value);
						return Array.isArray(parsedArray) ? parsedArray : [value];
					} catch {
						return [value];
					}
				}
				return value ? [value] : [];
			};

			// Convert medicine objects to strings for schema compatibility
			const convertMedicineToStrings = (medicines) => {
				if (!medicines) return [];
				const medicineArray = ensureArray(medicines);
				return medicineArray.map(med => {
					if (typeof med === 'object' && med !== null) {
						// Convert object to readable string format
						const parts = [];
						if (med.name) parts.push(med.name);
						if (med.dosage) parts.push(`${med.dosage}`);
						if (med.frequency) parts.push(`${med.frequency}`);
						if (med.duration) parts.push(`for ${med.duration}`);
						if (med.instructions) parts.push(med.instructions);
						return parts.join(' - ');
					}
					return String(med);
				});
			};

			// Process the parsed data to ensure proper array formatting
			parsed.symptoms = ensureArray(parsed.symptoms);
			parsed.medicine = convertMedicineToStrings(parsed.medicine);
			parsed.recommendations = ensureArray(parsed.recommendations);
		} catch (aiError) {
			console.error('AI parsing error, proceeding with empty parsed data:', aiError);
		}

		// Save under new schema fields
		const prescription = new Prescription({
			patientId: req.user._id,
			doctorId: req.body.doctorId,
			date: parsed.date ? new Date(parsed.date) : Date.now(),
			symptoms: parsed.symptoms || [],
			medicines: parsed.medicine || [],
			recommendations: parsed.recommendations || [],
			notes: parsed.notes || '',
			filePath: `/uploads/prescriptions/${req.file.filename}`
		});
		await prescription.save();
		res.status(201).json({ success: true, prescription });
	} catch (error) {
		console.error('Prescription upload error:', error);
		res.status(500).json({ success: false, message: 'Server error processing prescription' });
	}
};

export const listPrescriptions = async (req, res) => {
	try {
		const prescriptions = await Prescription.find({ patientId: req.user._id })
			.sort({ createdAt: -1 })
			.populate('doctorId', 'name speciality');
		res.json({ success: true, prescriptions });
	} catch (error) {
		console.error('List prescriptions error:', error);
		res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
	}
};


// POST /api/doctor/generate-patient-summary/:patientId
export const generatePatientSummary = async (req, res) => {
	try {
		const docId = req.body.docId;
		const { patientId } = req.params;
	
		// Check if the patient belongs to this doctor
		const patient = await userModel.findOne({ _id: patientId, doctor: docId });
		if (!patient) {
			return res.status(403).json({ success: false, message: 'Unauthorized access. Patient not under your care.' });
		}
	
		const prescriptions = await Prescription.find({ patientId })
			.sort({ createdAt: -1 })
			.populate('doctorId', 'name speciality');
		const payload = prescriptions.map(p => ({
			date: p.date,
			patientName: p.patientId.name,
			doctorName: p.doctorId.name,
			symptoms: p.symptoms,
			medicines: p.medicines,
			recommendations: p.recommendations,
			notes: p.notes
		}));
		const contentString = JSON.stringify({ prescriptions: payload }, null, 2);

		const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
		
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "user",
					content: `Analyze the following patient prescriptions JSON and provide a comprehensive medical summary. Return a JSON with keys: summary, medications, insights, recommendations. The medications section should list all current/recent medications with dosages and purposes.\n\n${contentString}`
				}
			],
			model: "deepseek-r1-distill-llama-70b",
			temperature: 0.6,
			max_completion_tokens: 4096,
			top_p: 0.95,
			stream: false,
			response_format: {
				type: "json_object"
			}
		});
		
		const summaryContent = chatCompletion.choices[0].message.content;
		let summary;
		try { summary = JSON.parse(summaryContent); } catch { summary = summaryContent; }
		res.json({ success: true, summary });
	} catch (error) {
		console.error('Generate patient summary error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
};


// POST /api/doctor/prescription/:patientId
export const uploadDoctorPrescription = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
		const { patientId } = req.params;
		const docId = req.user._id;
		
		console.log('Upload prescription - patientId:', patientId, 'docId:', docId);
		
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(patientId)) {
			return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
		}
	
		// Check if the patient belongs to this doctor
		const patient = await userModel.findOne({ _id: patientId, doctor: docId });
		if (!patient) {
			return res.status(403).json({ success: false, message: 'Unauthorized to upload prescription for this patient. Patient not under your care.' });
		}

		console.log('Patient found, proceeding with prescription upload');

		const fileBuffer = fs.readFileSync(req.file.path);
		const data = await pdfParse(fileBuffer);
		const fileContent = data.text;

		const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
		
		let parsed = {};
		try {
			const chatCompletion = await groq.chat.completions.create({
				messages: [
					{
						role: "user",
						content: `Extract fields date, patient name, doctor name, symptoms, medicine, recommendations, notes from this prescription in json format. Like { "patient name" : ...} Return only the JSON object wrapped in a json code block without any extra text.\n\n${fileContent}`
					}
				],
				model: "deepseek-r1-distill-llama-70b",
				temperature: 0.6,
				max_completion_tokens: 4096,
				top_p: 0.95,
				stream: false,
				response_format: {
					type: "json_object"
				}
			});
			
			const cont = chatCompletion.choices[0].message.content;
			parsed = JSON.parse(cont);

			// Ensure arrays are properly formatted
			const ensureArray = (value) => {
				if (Array.isArray(value)) return value;
				if (typeof value === 'string') {
					try {
						const parsedArray = JSON.parse(value);
						return Array.isArray(parsedArray) ? parsedArray : [value];
					} catch {
						return [value];
					}
				}
				return value ? [value] : [];
			};

			// Convert medicine objects to strings for schema compatibility
			const convertMedicineToStrings = (medicines) => {
				if (!medicines) return [];
				const medicineArray = ensureArray(medicines);
				return medicineArray.map(med => {
					if (typeof med === 'object' && med !== null) {
						// Convert object to readable string format
						const parts = [];
						if (med.name) parts.push(med.name);
						if (med.dosage) parts.push(`${med.dosage}`);
						if (med.frequency) parts.push(`${med.frequency}`);
						if (med.duration) parts.push(`for ${med.duration}`);
						if (med.instructions) parts.push(med.instructions);
						return parts.join(' - ');
					}
					return String(med);
				});
			};

			// Process the parsed data to ensure proper array formatting
			parsed.symptoms = ensureArray(parsed.symptoms);
			parsed.medicine = convertMedicineToStrings(parsed.medicine);
			parsed.recommendations = ensureArray(parsed.recommendations);

		} catch (aiError) {
			console.error('AI parsing error, proceeding with empty parsed data:', aiError);
			// continue with empty parsed data
		}

		const prescription = new Prescription({
			patientId,
			doctorId: req.user._id,
			date: parsed.date ? new Date(parsed.date) : Date.now(),
			symptoms: parsed.symptoms || [],
			medicines: parsed.medicine || [],
			recommendations: parsed.recommendations || [],
			notes: parsed.notes || '',
			filePath: `/uploads/prescriptions/${req.file.filename}`
		});
		await prescription.save();
		res.status(201).json({ success: true, prescription });
	} catch (error) {
		console.error('Doctor prescription upload error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
};


// GET /api/doctor/prescriptions/:patientId
export const listDoctorPrescriptions = async (req, res) => {
	try {
		const { patientId } = req.params;
		const docId = req.user._id;
		
		console.log('Fetching prescriptions for patientId:', patientId);
		
		if (!patientId) {
			return res.status(400).json({ success: false, message: 'Patient ID is required' });
		}
		
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(patientId)) {
			return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
		}
		
		// Check if the patient belongs to this doctor
		const patient = await userModel.findOne({ _id: patientId, doctor: docId });
		if (!patient) {
			return res.status(403).json({ success: false, message: 'Unauthorized access. Patient not under your care.' });
		}
		
		const prescriptions = await Prescription.find({ patientId })
			.sort({ createdAt: -1 })
			.populate('doctorId', 'name speciality');
			
		console.log('Found prescriptions:', prescriptions.length);
		
		res.json({ success: true, prescriptions });
	} catch (error) {
		console.error('List doctor prescriptions error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
};


// POST /api/doctor/create-prescription
export const createPrescription = async (req, res) => {
	try {
		const doctorId = req.user._id;
		const {
			patientId,
			patientInfo,
			chiefComplaint,
			diagnosis,
			medications,
			dietaryRecommendations,
			lifestyleAdvice,
			followUpDate
		} = req.body;

		// Validate required fields
		if (!patientId || !patientInfo?.name || !chiefComplaint) {
			return res.status(400).json({ 
				success: false, 
				message: 'Patient ID, patient name, and chief complaint are required' 
			});
		}

		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(patientId)) {
			return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
		}

		// Check if the patient belongs to this doctor
		const patient = await userModel.findOne({ _id: patientId, doctor: doctorId });
		if (!patient) {
			return res.status(403).json({ 
				success: false, 
				message: 'Unauthorized. Patient not under your care.' 
			});
		}

		// Fetch doctor information
		const doctor = await doctorModel.findById(doctorId).select('name registrationNumber speciality');
		if (!doctor) {
			return res.status(404).json({ 
				success: false, 
				message: 'Doctor not found' 
			});
		}

		// Generate fallback registration number if missing
		const registrationNumber = doctor.registrationNumber || 
			`${(doctor.speciality || 'AYU').toUpperCase().substring(0, 3)}${Date.now().toString().slice(-5)}`;

		// Create new prescription
		const prescription = new Prescription({
			patientId,
			doctorId,
			doctorInfo: {
				name: doctor.name,
				registrationNumber: registrationNumber,
				speciality: doctor.speciality
			},
			patientInfo: {
				name: patientInfo.name,
				age: parseInt(patientInfo.age) || 0,
				gender: patientInfo.gender || '',
				contactNumber: patientInfo.contactNumber || '',
				constitution: patientInfo.constitution || ''
			},
			chiefComplaint,
			diagnosis: diagnosis || '',
			medications: medications || [],
			dietaryRecommendations: dietaryRecommendations || '',
			lifestyleAdvice: lifestyleAdvice || '',
			followUpDate: followUpDate ? new Date(followUpDate) : null,
			status: 'Active'
		});

		await prescription.save();

		res.status(201).json({ 
			success: true, 
			message: 'Prescription created successfully',
			prescription: {
				id: prescription._id,
				patientName: prescription.patientInfo.name,
				date: prescription.date,
				status: prescription.status,
				medications: prescription.medications,
				chiefComplaint: prescription.chiefComplaint,
				diagnosis: prescription.diagnosis,
				doctorInfo: prescription.doctorInfo,
				patientInfo: prescription.patientInfo,
				dietaryRecommendations: prescription.dietaryRecommendations,
				lifestyleAdvice: prescription.lifestyleAdvice,
				followUpDate: prescription.followUpDate
			}
		});

	} catch (error) {
		console.error('Create prescription error:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Error creating prescription: ' + error.message 
		});
	}
};


// GET /api/doctor/prescriptions - Get all prescriptions created by this doctor
export const listAllDoctorPrescriptions = async (req, res) => {
	try {
		const doctorId = req.user._id;
		
		const prescriptions = await Prescription.find({ doctorId })
			.sort({ createdAt: -1 })
			.populate('patientId', 'name email phone')
			.populate('doctorId', 'name speciality');

		// Format prescriptions for frontend
		const formattedPrescriptions = prescriptions.map(prescription => ({
			id: prescription._id,
			patientName: prescription.patientInfo?.name || prescription.patientId?.name,
			date: prescription.date,
			status: prescription.status,
			medications: prescription.medications,
			chiefComplaint: prescription.chiefComplaint,
			diagnosis: prescription.diagnosis,
			doctorInfo: prescription.doctorInfo,
			patientInfo: prescription.patientInfo,
			dietaryRecommendations: prescription.dietaryRecommendations,
			lifestyleAdvice: prescription.lifestyleAdvice,
			followUpDate: prescription.followUpDate
		}));

		res.json({ 
			success: true, 
			prescriptions: formattedPrescriptions 
		});

	} catch (error) {
		console.error('List all doctor prescriptions error:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Error fetching prescriptions: ' + error.message 
		});
	}
};

// PUT /api/doctor/prescription/:id - Update a prescription
export const updatePrescription = async (req, res) => {
	try {
		const doctorId = req.user._id;
		const prescriptionId = req.params.id;
		const {
			patientId,
			patientInfo,
			chiefComplaint,
			diagnosis,
			medications,
			dietaryRecommendations,
			lifestyleAdvice,
			followUpDate
		} = req.body;

		// Validate required fields
		if (!patientInfo?.name || !chiefComplaint) {
			return res.status(400).json({ 
				success: false, 
				message: 'Patient name and chief complaint are required' 
			});
		}

		// Find the prescription and verify ownership
		const prescription = await Prescription.findOne({ 
			_id: prescriptionId, 
			doctorId: doctorId 
		});

		if (!prescription) {
			return res.status(404).json({ 
				success: false, 
				message: 'Prescription not found or unauthorized' 
			});
		}

		// Fetch doctor information to ensure it's up to date
		const doctor = await doctorModel.findById(doctorId).select('name registrationNumber speciality');
		if (!doctor) {
			return res.status(404).json({ 
				success: false, 
				message: 'Doctor not found' 
			});
		}

		// Generate fallback registration number if missing
		const registrationNumber = doctor.registrationNumber || 
			`${(doctor.speciality || 'AYU').toUpperCase().substring(0, 3)}${Date.now().toString().slice(-5)}`;

		// Update prescription with doctor info preserved/updated
		prescription.doctorInfo = {
			name: doctor.name,
			registrationNumber: registrationNumber,
			speciality: doctor.speciality
		};
		prescription.patientInfo = {
			name: patientInfo.name,
			age: parseInt(patientInfo.age) || prescription.patientInfo.age,
			gender: patientInfo.gender || prescription.patientInfo.gender,
			contactNumber: patientInfo.contactNumber || prescription.patientInfo.contactNumber,
			constitution: patientInfo.constitution || prescription.patientInfo.constitution
		};
		prescription.chiefComplaint = chiefComplaint;
		prescription.diagnosis = diagnosis || prescription.diagnosis;
		prescription.medications = medications || prescription.medications;
		prescription.dietaryRecommendations = dietaryRecommendations || prescription.dietaryRecommendations;
		prescription.lifestyleAdvice = lifestyleAdvice || prescription.lifestyleAdvice;
		prescription.followUpDate = followUpDate ? new Date(followUpDate) : prescription.followUpDate;

		await prescription.save();

		res.json({ 
			success: true, 
			message: 'Prescription updated successfully',
			prescription: {
				id: prescription._id,
				patientName: prescription.patientInfo.name,
				date: prescription.date,
				status: prescription.status,
				medications: prescription.medications,
				chiefComplaint: prescription.chiefComplaint,
				diagnosis: prescription.diagnosis,
				doctorInfo: prescription.doctorInfo,
				patientInfo: prescription.patientInfo,
				dietaryRecommendations: prescription.dietaryRecommendations,
				lifestyleAdvice: prescription.lifestyleAdvice,
				followUpDate: prescription.followUpDate
			}
		});

	} catch (error) {
		console.error('Update prescription error:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Error updating prescription: ' + error.message 
		});
	}
};

// DELETE /api/doctor/prescription/:id - Delete a prescription
export const deletePrescription = async (req, res) => {
	try {
		const doctorId = req.user._id;
		const prescriptionId = req.params.id;

		// Find and delete the prescription, but only if it belongs to this doctor
		const prescription = await Prescription.findOneAndDelete({ 
			_id: prescriptionId, 
			doctorId: doctorId 
		});

		if (!prescription) {
			return res.status(404).json({ 
				success: false, 
				message: 'Prescription not found or unauthorized' 
			});
		}

		res.json({ 
			success: true, 
			message: 'Prescription deleted successfully' 
		});

	} catch (error) {
		console.error('Delete prescription error:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Error deleting prescription: ' + error.message 
		});
	}
};
