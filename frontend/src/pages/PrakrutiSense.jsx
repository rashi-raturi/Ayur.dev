/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useContext } from 'react';
import PrakrutiAnalysisForm from '../components/PrakrutiAnalysisForm';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const PrakrutiSense = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [assessments, setAssessments] = useState([]);
  // for custom delete confirmation dialog
  const [deleteId, setDeleteId] = useState(null);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/prakruti-history`,
        {},
        { headers: { token } }
      );
      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const handleComplete = () => {
    fetchHistory();
  };

  return (
    <div className="prakruti-sense-page">
      <PrakrutiAnalysisForm onComplete={handleComplete} />
      <div className="assessment-history mt-8">
        <h2 className="text-xl font-semibold mb-2">Previous Assessments</h2>
        {assessments.length === 0 ? (
           <p className="text-center text-gray-500">No assessments yet.</p>
         ) : (
          <ul className="space-y-4">
            {assessments.map((a) => {
              const dateStr = new Date(a.date).toLocaleString();
              const resultData = a.resultData;
              const dominant = Object.entries(resultData).reduce(
                (prev, curr) => (curr[1] > prev[1] ? curr : prev)
              )[0];
              const recs = a.recommendations?.[dominant] || [];
              return (
                <li
                  key={a._id}
                  className="relative border border-[#C9D8FF] rounded-xl p-6 bg-white group hover:shadow-lg transition-shadow"
                >
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">{dateStr}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-700">
                    {Object.entries(resultData).map(([dosha, pct]) => (
                      <div key={dosha} className="flex flex-col items-center">
                        <p className="font-semibold text-gray-800">{dosha}</p>
                        <p>{pct}%</p>
                      </div>
                    ))}
                  </div>
                  {recs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-1">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {recs.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    onClick={() => setDeleteId(a._id)}
                    title="Delete Assessment"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7L5 7M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M10 11v6M14 11v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-700 mb-6">Are you sure you want to delete this assessment?</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={async () => {
                  try {
                    await axios.delete(
                      `${backendUrl}/api/user/prakruti/${deleteId}`,
                      { headers: { token } }
                    );
                    fetchHistory();
                  } catch (err) {
                    console.error('Delete failed:', err);
                  } finally {
                    setDeleteId(null);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrakrutiSense;
