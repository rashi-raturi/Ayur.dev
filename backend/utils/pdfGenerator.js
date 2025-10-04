import PDFDocument from 'pdfkit';

export const generateDietChartPDF = async (dietChartData, patientData, doctorData) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('Starting PDF generation for diet chart');
            
            const { weeklyMealPlan, nutritionGoals } = dietChartData;
            
            console.log('Weekly meal plan received:', !!weeklyMealPlan);
            console.log('Weekly meal plan keys:', weeklyMealPlan ? Object.keys(weeklyMealPlan) : 'None');
            console.log('Patient data:', patientData?.name);
            console.log('Doctor data:', doctorData?.name);
            
            // Validate that we have some meal plan data
            if (!weeklyMealPlan || Object.keys(weeklyMealPlan).length === 0) {
                console.error('No meal plan data available for PDF generation');
                console.log('Creating a default meal plan structure...');
                
                // Create a default empty meal plan structure
                const defaultMealPlan = {};
                const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                dayKeys.forEach(day => {
                    defaultMealPlan[day] = {
                        Breakfast: [{
                            name: 'Sample Breakfast Item',
                            amount: 100,
                            serving_unit: 'g',
                            calculated_nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 3 }
                        }],
                        Lunch: [{
                            name: 'Sample Lunch Item',
                            amount: 150,
                            serving_unit: 'g',
                            calculated_nutrition: { calories: 350, protein: 20, carbs: 45, fat: 8, fiber: 5 }
                        }],
                        Snacks: [{
                            name: 'Sample Snack',
                            amount: 50,
                            serving_unit: 'g',
                            calculated_nutrition: { calories: 150, protein: 5, carbs: 20, fat: 6, fiber: 2 }
                        }],
                        Dinner: [{
                            name: 'Sample Dinner Item',
                            amount: 200,
                            serving_unit: 'g',
                            calculated_nutrition: { calories: 400, protein: 25, carbs: 40, fat: 12, fiber: 6 }
                        }]
                    };
                });
                
                // Use the default structure but continue with PDF generation
                dietChartData.weeklyMealPlan = defaultMealPlan;
                console.log('Using sample meal plan structure for PDF demonstration');
            }
            
            console.log('Meal plan validation passed. Days available:', Object.keys(weeklyMealPlan));
            
            // Create a document
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 20, bottom: 20, left: 20, right: 20 }
            });

            // VERCEL FIX: Use memory buffer instead of file system
            // Collect PDF data in memory chunks
            const chunks = [];
            
            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const filename = `diet_chart_${patientData.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
                console.log('Diet chart PDF generated successfully in memory:', filename);
                resolve({ buffer: pdfBuffer, filename });
            });

            doc.on('error', (error) => {
                console.error('PDF generation error:', error);
                reject(error);
            });

            // Helper function to draw a line
            const drawLine = (y, color = '#e5e7eb') => {
                doc.strokeColor(color).lineWidth(0.5).moveTo(20, y).lineTo(575, y).stroke();
            };

            // Header with green background
            doc.rect(0, 0, 595, 60).fill('#10b981');
            
            // Title
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
               .text('AYURVEDIC DIET CHART', 20, 20, { align: 'center', width: 555 });
            
            doc.fontSize(8).font('Helvetica').fillColor('#d1fae5')
               .text('7-Day Personalized Meal Plan', 20, 45, { align: 'center', width: 555 });

            // Reset fill color
            doc.fillColor('#000000');
            let yPosition = 75;

            // Patient Information Card
            doc.roundedRect(20, yPosition, 555, 55, 3).fillAndStroke('#f9fafb', '#e5e7eb');
            yPosition += 8;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Patient Information', 30, yPosition);
            yPosition += 12;

            doc.fontSize(8).font('Helvetica').fillColor('#374151');
            // Row 1
            doc.text(`Name: ${patientData.name}`, 30, yPosition);
            doc.text(`Age: ${patientData.age} years`, 200, yPosition);
            doc.text(`Gender: ${patientData.gender}`, 350, yPosition);
            yPosition += 10;
            
            // Row 2
            doc.text(`Constitution: ${patientData.constitution || 'N/A'}`, 30, yPosition);
            if (patientData.bmi) {
                doc.text(`BMI: ${patientData.bmi}`, 200, yPosition);
            }
            doc.text(`Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 350, yPosition);
            yPosition += 10;
            
            // Row 3 - Health info if available
            if (patientData.primaryHealthCondition) {
                doc.fontSize(7).fillColor('#6b7280')
                   .text(`Condition: ${patientData.primaryHealthCondition}`, 30, yPosition, { width: 545 });
                yPosition += 8;
            }
            
            yPosition += 15;

            // Daily Nutritional Goals
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Daily Nutritional Goals', 20, yPosition);
            yPosition += 12;

            const goals = nutritionGoals?.macronutrients || {};
            const macros = [
                { label: 'Calories', value: `${goals.calories || 2000}`, unit: 'kcal', color: '#ef4444' },
                { label: 'Protein', value: `${goals.protein || 50}`, unit: 'g', color: '#f59e0b' },
                { label: 'Carbs', value: `${goals.carbs || 250}`, unit: 'g', color: '#10b981' },
                { label: 'Fat', value: `${goals.fat || 65}`, unit: 'g', color: '#3b82f6' },
                { label: 'Fiber', value: `${goals.fiber || 25}`, unit: 'g', color: '#8b5cf6' }
            ];

            let xPos = 20;
            macros.forEach((macro) => {
                doc.fontSize(7).font('Helvetica-Bold').fillColor(macro.color)
                   .text(macro.label, xPos, yPosition);
                doc.fontSize(8).font('Helvetica').fillColor('#374151')
                   .text(`${macro.value} ${macro.unit}`, xPos, yPosition + 8);
                xPos += 110;
            });
            yPosition += 25;

            // Weekly Meal Plan - Loop through each day
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayColors = ['#fef3c7', '#dbeafe', '#fce7f3', '#e0e7ff', '#d1fae5', '#fed7aa', '#ede9fe'];
            
            // Check if we have any meal data at all
            let hasAnyMealData = false;
            dayKeys.forEach(dayKey => {
                const dayMeals = weeklyMealPlan[dayKey];
                if (dayMeals) {
                    ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].forEach(mealType => {
                        if (dayMeals[mealType] && dayMeals[mealType].length > 0) {
                            hasAnyMealData = true;
                        }
                    });
                }
            });
            
            if (!hasAnyMealData) {
                // Add a message about empty meal plan
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#ef4444')
                   .text('⚠️ Sample Diet Chart (No Meal Data Found)', 20, yPosition);
                yPosition += 15;
                
                doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
                   .text('This PDF shows sample data because no meal plan was found. Please create a complete meal plan and regenerate the PDF.', 
                         20, yPosition, { width: 555 });
                yPosition += 25;
                
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f2937')
                   .text('Sample Weekly Meal Plan:', 20, yPosition);
                yPosition += 15;
            }
            
            daysOfWeek.forEach((day, dayIndex) => {
                const dayKey = dayKeys[dayIndex];
                let dayMeals = weeklyMealPlan[dayKey];
                
                // Convert Mongoose document to plain object if necessary
                if (dayMeals && dayMeals.toObject) {
                    dayMeals = dayMeals.toObject();
                }
                
                console.log(`Processing day: ${day} (${dayKey})`);
                console.log(`Day meals exist:`, !!dayMeals);
                if (dayMeals) {
                    const mealKeys = Object.keys(dayMeals).filter(key => !key.startsWith('$') && !key.startsWith('_'));
                    console.log(`  Meal types available:`, mealKeys);
                    mealKeys.forEach(mealType => {
                        const foods = dayMeals[mealType] || [];
                        console.log(`    ${mealType}: ${Array.isArray(foods) ? foods.length : 'invalid'} foods`);
                    });
                }
                
                // Check if we need a new page
                if (yPosition > 730) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Day header with colored background
                doc.roundedRect(20, yPosition, 555, 18, 3).fillAndStroke(dayColors[dayIndex], '#d1d5db');
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f2937')
                   .text(day.toUpperCase(), 25, yPosition + 5);
                yPosition += 22;

                if (!dayMeals) {
                    console.log(`  No meals found for ${day}`);
                    yPosition += 5;
                    return;
                }

                // Create 4-column layout for meals
                const mealTypes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
                const colWidth = 135;
                const startX = 20;

                // Calculate the maximum height needed for this day
                let maxMealHeight = 0;
                mealTypes.forEach((mealType, mealIndex) => {
                    const foods = dayMeals && dayMeals[mealType] ? dayMeals[mealType] : [];
                    let mealHeight = 10; // Base height for meal header
                    
                    if (Array.isArray(foods) && foods.length > 0) {
                        foods.forEach((food) => {
                            if (food && food.name) {
                                mealHeight += 6; // Food name
                                mealHeight += 6; // Amount and calories
                                if (food.ayurvedicProperties && 
                                    (food.ayurvedicProperties.rasa || food.ayurvedicProperties.virya || 
                                     (food.ayurvedicProperties.doshaEffects && food.ayurvedicProperties.doshaEffects.length > 0))) {
                                    mealHeight += 5; // Ayurvedic properties
                                }
                                mealHeight += 2; // Spacing
                            }
                        });
                    } else {
                        mealHeight += 8; // "No items" text
                    }
                    mealHeight += 8; // Total calories
                    maxMealHeight = Math.max(maxMealHeight, mealHeight);
                });

                mealTypes.forEach((mealType, mealIndex) => {
                    const foods = dayMeals && dayMeals[mealType] ? dayMeals[mealType] : [];
                    const xStart = startX + (mealIndex * colWidth);
                    let mealY = yPosition;

                    // Meal header
                    doc.fontSize(7).font('Helvetica-Bold').fillColor('#374151')
                       .text(mealType, xStart, mealY);
                    mealY += 10;

                    // Calculate meal calories
                    let mealCalories = 0;
                    if (Array.isArray(foods)) {
                        foods.forEach(food => {
                            if (food && food.calculated_nutrition) {
                                mealCalories += food.calculated_nutrition.calories || 0;
                            }
                        });
                    }

                    // Food items
                    if (Array.isArray(foods) && foods.length > 0) {
                        foods.forEach((food, idx) => {
                            if (!food || !food.name) return;

                            const nutrition = food.calculated_nutrition || {};
                            const calories = Math.round(nutrition.calories || 0);
                            const servingUnit = food.serving_unit || 'g';
                            const amount = food.amount || 100;

                            // Food name (truncate if too long)
                            const foodName = food.name.length > 20 ? food.name.substring(0, 17) + '...' : food.name;
                            doc.fontSize(6).font('Helvetica').fillColor('#1f2937')
                               .text(foodName, xStart, mealY, { width: colWidth - 5 });
                            mealY += 6;

                            // Amount and calories
                            doc.fontSize(5).fillColor('#6b7280')
                               .text(`${amount}${servingUnit} • ${calories} cal`, xStart, mealY);
                            mealY += 6;

                            // Ayurvedic badges (simplified for PDF)
                            if (food.ayurvedicProperties) {
                                const props = food.ayurvedicProperties;
                                let badges = [];
                                
                                if (props.rasa) badges.push(`R:${props.rasa.substring(0, 4)}`);
                                if (props.virya) badges.push(`V:${props.virya.substring(0, 4)}`);
                                if (props.doshaEffects && props.doshaEffects.length > 0) {
                                    const effect = props.doshaEffects[0].replace('balances ', '').replace('increases ', '+');
                                    badges.push(`D:${effect.substring(0, 4)}`);
                                }

                                if (badges.length > 0) {
                                    doc.fontSize(4).fillColor('#9ca3af')
                                       .text(badges.join(' '), xStart, mealY, { width: colWidth - 5 });
                                    mealY += 5;
                                }
                            }

                            if (idx < foods.length - 1) mealY += 2;
                        });
                    } else {
                        doc.fontSize(5).fillColor('#9ca3af').text('Click "Add Food" to add items', xStart, mealY);
                        mealY += 8;
                    }

                    // Meal total at bottom of column
                    doc.fontSize(6).font('Helvetica-Bold').fillColor('#1f2937')
                       .text(`Total: ${Math.round(mealCalories)} cal`, xStart, yPosition + maxMealHeight - 8);
                });

                yPosition += maxMealHeight + 5;
                drawLine(yPosition, '#d1d5db');
                yPosition += 5;
            });

            // Footer with doctor info
            if (yPosition > 750) {
                doc.addPage();
                yPosition = 20;
            }

            yPosition += 8;
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#1f2937')
               .text('Prescribed by:', 20, yPosition);
            yPosition += 10;

            doc.fontSize(8).font('Helvetica-Bold').fillColor('#059669')
               .text(doctorData?.name || 'Dr. Unknown', 20, yPosition);
            yPosition += 10;

            if (doctorData?.speciality) {
                doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
                   .text(doctorData.speciality, 20, yPosition);
                yPosition += 8;
            }

            if (doctorData?.email) {
                doc.fontSize(6).fillColor('#6b7280')
                   .text(`Email: ${doctorData.email}`, 20, yPosition);
            }

            yPosition += 12;
            doc.fontSize(5).font('Helvetica').fillColor('#9ca3af')
               .text('This diet chart is personalized based on Ayurvedic principles. Consult your doctor before making dietary changes.', 
                     20, yPosition, { width: 555, align: 'center' });

            // Finalize the PDF
            doc.end();

        } catch (error) {
            console.error('Diet chart PDF generation error:', error);
            reject(error);
        }
    });
};

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

            // VERCEL FIX: Use memory buffer instead of file system
            // Collect PDF data in memory chunks
            const chunks = [];
            
            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const filename = `prescription_${prescriptionId}_${Date.now()}.pdf`;
                console.log('Prescription PDF generated successfully in memory:', filename);
                resolve({ buffer: pdfBuffer, filename });
            });

            doc.on('error', (error) => {
                console.error('Prescription PDF generation error:', error);
                reject(error);
            });

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

        } catch (error) {
            console.error('PDF generation error:', error);
            reject(error);
        }
    });
};
