import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePrescriptionPDF = async (prescriptionData, doctorData) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('Starting PDF generation for prescription:', prescriptionData.prescriptionId);
            
            const { patientInfo, prescriptionId, medications, diagnosis, chiefComplaint, 
                    date, followUpDate, dietaryRecommendations, lifestyleAdvice } = prescriptionData;
            
            // Validate required data
            if (!prescriptionId) {
                throw new Error('Prescription ID is required');
            }

            // Create a document
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(process.cwd(), 'uploads', 'prescriptions');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate filename
            const filename = `prescription_${prescriptionId}_${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            // Pipe the PDF to a file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Helper function to draw a line
            const drawLine = (y) => {
                doc.moveTo(50, y).lineTo(545, y).stroke();
            };

            // Header with green background
            doc.rect(0, 0, 612, 100).fill('#10b981');
            
            // Title
            doc.fontSize(26).font('Helvetica-Bold').fillColor('#ffffff')
               .text('AYURVEDIC PRESCRIPTION', 50, 35, { align: 'center', width: 512 });
            
            doc.fontSize(11).font('Helvetica').fillColor('#d1fae5')
               .text('Traditional Healing, Modern Care', 50, 70, { align: 'center', width: 512 });

            // Reset fill color
            doc.fillColor('#000000');
            let yPosition = 130;

            // Prescription ID Badge
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669')
               .text(`Prescription ID: ${prescriptionId}`, 50, yPosition);
            yPosition += 25;

            // Date
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
               .text(`Date Issued: ${new Date(date).toLocaleDateString('en-US', { 
                   year: 'numeric', month: 'long', day: 'numeric' 
               })}`, 50, yPosition);
            yPosition += 30;

            // Patient Information Section
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Patient Information', 50, yPosition);
            yPosition += 20;

            doc.fontSize(10).font('Helvetica').fillColor('#374151');
            doc.text(`Name: ${patientInfo?.name || 'N/A'}`, 50, yPosition);
            doc.text(`Age: ${patientInfo?.age || 'N/A'} years`, 300, yPosition);
            yPosition += 15;

            doc.text(`Gender: ${patientInfo?.gender || 'N/A'}`, 50, yPosition);
            doc.text(`Contact: ${patientInfo?.contactNumber || 'N/A'}`, 300, yPosition);
            yPosition += 15;

            if (patientInfo?.constitution) {
                doc.text(`Constitution (Prakriti): ${patientInfo.constitution}`, 50, yPosition);
                yPosition += 15;
            }

            yPosition += 10;
            drawLine(yPosition);
            yPosition += 20;

            // Clinical Information (same page as patient info)
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Clinical Information', 50, yPosition);
            yPosition += 20;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
               .text('Chief Complaint:', 50, yPosition);
            doc.font('Helvetica').fillColor('#374151')
               .text(chiefComplaint || 'N/A', 150, yPosition, { width: 395 });
            yPosition += doc.heightOfString(chiefComplaint || 'N/A', { width: 395 }) + 10;

            doc.font('Helvetica-Bold').fillColor('#6b7280')
               .text('Diagnosis:', 50, yPosition);
            doc.font('Helvetica').fillColor('#374151')
               .text(diagnosis || 'N/A', 150, yPosition, { width: 395 });
            yPosition += doc.heightOfString(diagnosis || 'N/A', { width: 395 }) + 15;

            // New page for Medications
            doc.addPage();
            yPosition = 50;

            // Medications Section
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Prescribed Medications', 50, yPosition);
            yPosition += 20;

            // Table header with background
            doc.rect(50, yPosition, 495, 25).fillAndStroke('#f9fafb', '#e5e7eb');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
               .text('Medicine Name', 60, yPosition + 8)
               .text('Dosage', 220, yPosition + 8)
               .text('Frequency', 330, yPosition + 8)
               .text('Duration', 440, yPosition + 8);
            yPosition += 25;

            // Medications list
            if (medications && Array.isArray(medications) && medications.length > 0) {
                doc.fontSize(9).font('Helvetica');
                medications.forEach((med, index) => {
                    // Check if we need a new page
                    if (yPosition > 720) {
                        doc.addPage();
                        yPosition = 50;
                        
                        // Redraw table header on new page
                        doc.rect(50, yPosition, 495, 25).fillAndStroke('#f9fafb', '#e5e7eb');
                        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
                           .text('Medicine Name', 60, yPosition + 8)
                           .text('Dosage', 220, yPosition + 8)
                           .text('Frequency', 330, yPosition + 8)
                           .text('Duration', 440, yPosition + 8);
                        yPosition += 25;
                    }
                    
                    // Alternate row background
                    if (index % 2 === 0) {
                        doc.rect(50, yPosition, 495, 20).fillAndStroke('#ffffff', '#e5e7eb');
                    } else {
                        doc.rect(50, yPosition, 495, 20).fillAndStroke('#f9fafb', '#e5e7eb');
                    }
                    
                    doc.fillColor('#1f2937').font('Helvetica')
                       .text(med.name || 'N/A', 60, yPosition + 5, { width: 150, ellipsis: true })
                       .text(med.dosage || 'N/A', 220, yPosition + 5, { width: 100, ellipsis: true })
                       .text(med.frequency || 'N/A', 330, yPosition + 5, { width: 100, ellipsis: true })
                       .text(med.duration || 'N/A', 440, yPosition + 5, { width: 95, ellipsis: true });
                    
                    yPosition += 20;
                });
            } else {
                doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
                   .text('No medications prescribed', 60, yPosition + 10);
                yPosition += 30;
            }

            // Page 3: Medications and Dietary Recommendations (same page)
            doc.addPage();
            yPosition = 50;
            
            // Dietary Recommendations with bullet points (split by period)
            if (dietaryRecommendations) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
                   .text('Dietary Recommendations', 50, yPosition);
                yPosition += 20;
                
                // Split by period and newline, filter empty lines
                const dietaryLines = dietaryRecommendations
                    .split(/[.\n]/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                doc.fontSize(10).font('Helvetica').fillColor('#374151');
                
                dietaryLines.forEach(line => {
                    if (line) {
                        // Check if need new page
                        if (yPosition > 720) {
                            doc.addPage();
                            yPosition = 50;
                        }
                        
                        // Add bullet point
                        doc.circle(60, yPosition + 5, 2).fill('#10b981');
                        doc.fillColor('#374151').text(line, 75, yPosition, { width: 470, align: 'left' });
                        yPosition += doc.heightOfString(line, { width: 470 }) + 8;
                    }
                });
                
                yPosition += 15;
            }

            // Page 4: Lifestyle Advice and Rest (new page)
            if (lifestyleAdvice) {
                doc.addPage();
                yPosition = 50;
                
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
                   .text('Lifestyle Advice', 50, yPosition);
                yPosition += 20;
                
                // Split by period and newline, filter empty lines
                const lifestyleLines = lifestyleAdvice
                    .split(/[.\n]/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                doc.fontSize(10).font('Helvetica').fillColor('#374151');
                
                lifestyleLines.forEach(line => {
                    if (line) {
                        // Check if need new page
                        if (yPosition > 720) {
                            doc.addPage();
                            yPosition = 50;
                        }
                        
                        // Add bullet point
                        doc.circle(60, yPosition + 5, 2).fill('#10b981');
                        doc.fillColor('#374151').text(line, 75, yPosition, { width: 470, align: 'left' });
                        yPosition += doc.heightOfString(line, { width: 470 }) + 8;
                    }
                });
                
                yPosition += 15;
            }
            
            // Move to bottom of page for doctor info and follow-up
            // Calculate space needed for footer
            const footerHeight = 120;
            if (yPosition < 750 - footerHeight) {
                yPosition = 750 - footerHeight;
            } else {
                // Need new page if content is too long
                doc.addPage();
                yPosition = 750 - footerHeight;
            }
            
            drawLine(yPosition);
            yPosition += 15;

            // Doctor's Information
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Prescribed by:', 50, yPosition);
            yPosition += 15;

            doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669')
               .text(doctorData?.name || 'Dr. Unknown', 50, yPosition);
            yPosition += 15;

            if (doctorData?.speciality) {
                doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
                   .text(doctorData.speciality, 50, yPosition);
                yPosition += 12;
            }

            if (doctorData?.email) {
                doc.fontSize(9).fillColor('#6b7280')
                   .text(`Email: ${doctorData.email}`, 50, yPosition);
                yPosition += 15;
            }
            
            // Follow-up date at bottom
            if (followUpDate) {
                yPosition += 5;
                doc.rect(50, yPosition, 495, 30).fillAndStroke('#fef3c7', '#f59e0b');
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#92400e')
                   .text(`Follow-up Date: ${new Date(followUpDate).toLocaleDateString('en-US', { 
                       year: 'numeric', month: 'long', day: 'numeric' 
                   })}`, 60, yPosition + 9);
                yPosition += 35;
            }

            // Disclaimer at the very bottom
            yPosition += 5;
            doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
               .text('This prescription is valid only when accompanied by the doctor\'s signature and stamp.', 
                     50, yPosition, { width: 495, align: 'center' });

            // Finalize the PDF
            doc.end();

            // Wait for the stream to finish
            stream.on('finish', () => {
                console.log('PDF generated successfully:', filename);
                resolve({ filepath, filename });
            });

            stream.on('error', (error) => {
                console.error('PDF stream error:', error);
                reject(error);
            });

        } catch (error) {
            console.error('PDF generation error:', error);
            reject(error);
        }
    });
};
