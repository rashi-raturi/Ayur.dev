import fs from 'fs';
// import the core parser directly to skip pdf-parse index debug code
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

import { Groq } from 'groq-sdk';
import Prescription from '../models/prescriptionModel.js';
import appointmentModel from '../models/appointmentModel.js';

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

		const prescription = new Prescription({
			user: req.user._id,
			date: parsed.date ? new Date(parsed.date) : undefined,
			patientName: parsed['patient name'] || parsed.patientName,
			doctorName: parsed['doctor name'] || parsed.doctorName,
			symptoms: parsed.symptoms || [],
			medicine: parsed.medicine || [],
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
		const prescriptions = await Prescription.find({ user: req.user._id }).sort({ createdAt: -1 });
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
	
		const hasAppointment = await appointmentModel.exists({ docId, userId: patientId });
		if (!hasAppointment) {
			return res.status(403).json({ success: false, message: 'Unauthorized access' });
		}
	
		const prescriptions = await Prescription.find({ user: patientId }).sort({ createdAt: -1 });
	
		const payload = prescriptions.map(p => ({
			date: p.date,
			patientName: p.patientName,
			doctorName: p.doctorName,
			symptoms: p.symptoms,
			medicine: p.medicine,
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
	
		const hasAppointment = await appointmentModel.exists({ docId, userId: patientId });
		if (!hasAppointment) {
			return res.status(403).json({ success: false, message: 'Unauthorized to upload prescription for this patient' });
		}

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
			user: patientId,
			date: parsed.date ? new Date(parsed.date) : undefined,
			patientName: parsed['patient name'] || parsed.patientName,
			doctorName: parsed['doctor name'] || parsed.doctorName,
			symptoms: parsed.symptoms || [],
			medicine: parsed.medicine || [],
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
		const docId = req.body.docId;
		const { patientId } = req.params;

		const hasAppointment = await appointmentModel.exists({ docId, userId: patientId });
		if (!hasAppointment) {
			return res.status(403).json({ success: false, message: 'Unauthorized access to patient prescriptions' });
		}

		const prescriptions = await Prescription.find({ user: patientId }).sort({ createdAt: -1 });
		res.json({ success: true, prescriptions });
	} catch (error) {
		console.error('List doctor prescriptions error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
};
