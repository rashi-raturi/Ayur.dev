// Professional email template for Ayurvedic prescription

export const getPrescriptionEmailTemplate = (prescriptionData, doctorData) => {
    const { patientInfo, prescriptionId, medications, diagnosis, chiefComplaint, date } = prescriptionData;
    
    // Format medications list
    const medicationsHTML = medications.map(med => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: 500; color: #1f2937;">${med.name}</td>
            <td style="padding: 12px 16px; color: #6b7280;">${med.dosage || 'N/A'}</td>
            <td style="padding: 12px 16px; color: #6b7280;">${med.frequency || 'N/A'}</td>
            <td style="padding: 12px 16px; color: #6b7280;">${med.duration || 'N/A'}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Ayurvedic Prescription</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <!-- Main Container -->
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        
                        <!-- Header with Gradient -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                    🌿 Ayurvedic Prescription
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">
                                    Traditional Healing, Modern Care
                                </p>
                            </td>
                        </tr>

                        <!-- Greeting Section -->
                        <tr>
                            <td style="padding: 40px 40px 20px 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                                    Dear ${patientInfo?.name || 'Patient'},
                                </h2>
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Your personalized Ayurvedic prescription has been prepared by <strong>${doctorData?.name || 'Dr. Unknown'}</strong>. 
                                    Please find the detailed prescription attached to this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Prescription Details Card -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f0fdf4, #dbeafe); border-radius: 8px; border: 1px solid #d1fae5;">
                                    <tr>
                                        <td style="padding: 24px;">
                                            <table width="100%" cellpadding="8" cellspacing="0">
                                                <tr>
                                                    <td style="color: #6b7280; font-size: 13px; width: 40%;">Prescription ID:</td>
                                                    <td style="color: #1f2937; font-weight: 600; font-size: 14px;">${prescriptionId}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #6b7280; font-size: 13px;">Date Issued:</td>
                                                    <td style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #6b7280; font-size: 13px;">Chief Complaint:</td>
                                                    <td style="color: #1f2937; font-weight: 500; font-size: 14px;">${chiefComplaint || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #6b7280; font-size: 13px;">Diagnosis:</td>
                                                    <td style="color: #1f2937; font-weight: 500; font-size: 14px;">${diagnosis || 'N/A'}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Medications Preview -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                    Prescribed Medications
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                    <thead>
                                        <tr style="background-color: #f9fafb;">
                                            <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Medicine</th>
                                            <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Dosage</th>
                                            <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Frequency</th>
                                            <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${medicationsHTML}
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- Important Notes -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
                                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                        <strong>⚠️ Important:</strong> Please follow the prescribed dosage and timing strictly. 
                                        If you experience any adverse effects, contact your doctor immediately.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Doctor's Contact Info -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                                    <tr>
                                        <td>
                                            <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                Your Ayurvedic Practitioner
                                            </h4>
                                            <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px; font-weight: 500;">
                                                ${doctorData?.name || 'Dr. Unknown'}
                                            </p>
                                            ${doctorData?.speciality ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">${doctorData.speciality}</p>` : ''}
                                            ${doctorData?.email ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">📧 ${doctorData.email}</p>` : ''}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Call to Action -->
                        <tr>
                            <td style="padding: 0 40px 40px 40px; text-align: center;">
                                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                    For any questions or concerns about your prescription, please don't hesitate to reach out to us.
                                </p>
                                <a href="mailto:${doctorData?.email || 'support@ayurveda.com'}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                    Contact Doctor
                                </a>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                                    This is an automated email. Please do not reply directly to this message.
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    © ${new Date().getFullYear()} Ayurvedic Health Center. All rights reserved.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};
