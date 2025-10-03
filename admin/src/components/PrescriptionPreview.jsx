import { X, Download, Calendar, User, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PrescriptionPreview = ({ prescription, isOpen, onClose }) => {
  if (!isOpen || !prescription) return null;

  const handleDownloadPDF = async () => {
    try {
      // Get the prescription content element
      const element = document.getElementById('prescription-content');
      if (!element) {
        console.error('Prescription content element not found');
        return;
      }

      // Clone the element to modify it without affecting the UI
      const clone = element.cloneNode(true);
      clone.style.padding = '40px';
      clone.style.backgroundColor = 'white';
      
      // Temporarily append to body for rendering
      document.body.appendChild(clone);

      // Generate canvas from HTML
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Remove the clone
      document.body.removeChild(clone);

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename
      const fileName = `Prescription_${prescription.prescriptionId || prescription.id}_${prescription.patientName?.replace(/\s+/g, '_')}.pdf`;
      
      // Save PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                </svg>
              </div>
              Prescription Details - {prescription.prescriptionId || `#${prescription.id?.slice(-4)}`}
            </h2>
            <p className="text-gray-600 mt-1">Complete prescription for {prescription.patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Prescription Content */}
        <div id="prescription-content" className="p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">AYURVEDIC PRESCRIPTION</h1>
            <div className="space-y-1 text-gray-600">
              <p className="text-lg font-medium">
                Dr. {prescription.doctorInfo?.name || 'Ayurvedic Sharma'}
              </p>
              <p>
                Registration No: {prescription.doctorInfo?.registrationNumber || 'AYU12345'}
              </p>
              <p>Date: {new Date(prescription.date).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 inline-block bg-white border border-gray-200 px-2 py-1 rounded-lg">
              <span className="text-xs font-normal text-gray-900">Prescription ID: {prescription.prescriptionId || `#${prescription.id?.slice(-4)}`}</span>
            </div>
            <hr className="mt-6 border-gray-200" />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Patient Information */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                Patient Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-800">{prescription.patientInfo?.name || prescription.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium text-gray-800">{prescription.patientInfo?.age || '45'} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium text-gray-800">{prescription.patientInfo?.gender || 'Male'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium text-gray-800">{prescription.patientInfo?.contactNumber || '+91 9876543210'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Constitution:</span>
                  <span className="font-medium text-gray-800">{prescription.patientInfo?.constitution || 'Pitta-Vata'}</span>
                </div>
              </div>
            </div>

            {/* Clinical Assessment */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Clinical Assessment</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Chief Complaint:</h4>
                  <p className="text-gray-800 bg-gray-100 border border-gray-200 p-3 rounded-xl">
                    {prescription.chiefComplaint || 'Chronic digestive issues, acid reflux, and mild anxiety'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Diagnosis:</h4>
                  <p className="text-gray-800 bg-gray-100 border border-gray-200 p-3 rounded-xl">
                    {prescription.diagnosis || 'Pitta-Vata imbalance with Mandagni (weak digestive fire)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescribed Medications */}
          <div className="mb-8 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Medications & Formulations ({prescription.medications?.length || 2})
            </h3>
            <div className="space-y-4">
              {prescription.medications?.length > 0 ? prescription.medications.map((med, index) => (
                <div key={index} className="bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 border border-gray-200 p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white font-bold w-8 h-8 rounded-xl flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">{med.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 block">Dosage:</span>
                          <span className="font-medium text-gray-800">{med.dosage}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Frequency:</span>
                          <span className="font-medium text-gray-800">{med.frequency}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Duration:</span>
                          <span className="font-medium text-gray-800">{med.duration}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Timing:</span>
                          <span className="font-medium text-gray-800">{med.timing || 'Before meals'}</span>
                        </div>
                      </div>
                      {med.instructions && (
                        <div className="mt-3">
                          <span className="text-gray-600 block text-sm">Instructions:</span>
                          <span className="font-medium text-gray-800">{med.instructions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                // Default medications if none provided
                <>
                  <div className="bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 border border-gray-200 p-6 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-600 text-white font-bold w-8 h-8 rounded-xl flex items-center justify-center text-sm">1</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Triphala Churna</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 block">Dosage:</span>
                            <span className="font-medium text-gray-800">3g</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Frequency:</span>
                            <span className="font-medium text-gray-800">Twice daily</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Duration:</span>
                            <span className="font-medium text-gray-800">2 months</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Timing:</span>
                            <span className="font-medium text-gray-800">Before meals</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-600 block text-sm">Instructions:</span>
                          <span className="font-medium text-gray-800">Mix with warm water</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 border border-gray-200 p-6 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-600 text-white font-bold w-8 h-8 rounded-xl flex items-center justify-center text-sm">2</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Ashwagandha Capsules</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 block">Dosage:</span>
                            <span className="font-medium text-gray-800">500mg</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Frequency:</span>
                            <span className="font-medium text-gray-800">Once daily</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Duration:</span>
                            <span className="font-medium text-gray-800">1 month</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Timing:</span>
                            <span className="font-medium text-gray-800">Evening</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-600 block text-sm">Instructions:</span>
                          <span className="font-medium text-gray-800">Take with milk</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Dietary Recommendations */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dietary Recommendations</h3>
              <div className="bg-gray-100 border border-gray-200 p-4 rounded-xl text-gray-800">
                {prescription.dietaryRecommendations || 
                  'Avoid spicy and acidic foods. Include cooling foods like cucumber, coconut water. Regular meal timings essential.'}
              </div>
            </div>

            {/* Lifestyle Advice */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lifestyle Recommendations</h3>
              <div className="bg-gray-100 border border-gray-200 p-4 rounded-xl text-gray-800">
                {prescription.lifestyleAdvice || 
                  'Practice pranayama daily for 15 minutes. Oil massage (abhyanga) twice weekly. Maintain regular sleep schedule.'}
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-gray-700">Next Follow-up Appointment</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-gray-800">
              {prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : '2/15/2024'}
            </p>
          </div>

        </div>

        {/* Fixed Bottom Actions Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PrescriptionPreview.propTypes = {
  prescription: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default PrescriptionPreview;