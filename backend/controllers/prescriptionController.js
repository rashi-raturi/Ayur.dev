import fs from 'fs';
// import the core parser directly to skip pdf-parse index debug code
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

import { GoogleGenAI } from '@google/genai';
import Prescription from '../models/prescriptionModel.js';

// POST /api/user/prescription
export const uploadPrescription = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
	
		const fileBuffer = fs.readFileSync(req.file.path);
	
		const data = await pdfParse(fileBuffer);
		const text = data.text;


			const apiKey = process.env.GEMINI_API_KEY;
			if (!apiKey) {
				return res.status(500).json({ success: false, message: 'Gemini API key missing' });
			}
			const ai = new GoogleGenAI({ apiKey });
			const result = await ai.models.generateContent({
				model: 'gemini-2.5-flash-lite',
				config: { thinkingConfig: { thinkingBudget: 0 } },
				contents: [
					{ role: 'system', content: 'Extract the following fields from this medical prescription document: date, patient name, doctor name, symptoms, medicine, recommendations, notes. Return JSON only.' },
					{ role: 'user', content: text }
				]
			});
			const content = result.choices?.[0]?.message?.content;
		let parsed;
		try { parsed = JSON.parse(content); } catch { return res.status(500).json({ success: false, message: 'Invalid JSON from parser' }); }

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
