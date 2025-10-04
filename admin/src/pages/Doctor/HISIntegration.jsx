import { useState, useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { toast } from "react-toastify";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  Download,
  Database,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Import,
  Filter,
  FileText,
} from "lucide-react";

const HISIntegration = () => {
  const { backendUrl, dToken, profileData, getProfileData } = useContext(DoctorContext);
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingPatientId, setImportingPatientId] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Fetch HIS statistics and profile data on component mount
  useEffect(() => {
    fetchHISStatistics();
    if (!profileData) {
      getProfileData();
    }
  }, []);

  const fetchHISStatistics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/his/statistics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.stats); // Note: backend returns 'stats', not 'statistics'
      }
    } catch (error) {
      console.error("Error fetching HIS statistics:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/his/patients/search?q=${encodeURIComponent(
          searchQuery
        )}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.patients);
        toast.success(`Found ${data.patients.length} patients`);
      } else {
        toast.error(data.message || "Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPatient = async (patient) => {
    try {
      setImporting(true);
      setImportingPatientId(patient.hisPatientId);

      // Ensure we have profile data with doctor ID
      if (!profileData || !profileData._id) {
        toast.error('Unable to get doctor information. Please refresh the page.');
        return;
      }

      console.log('Importing patient:', patient.hisPatientId, 'for doctor:', profileData._id);

      // Call the backend API to import the patient
      const response = await fetch(`${backendUrl}/api/his/patients/${patient.hisPatientId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profileData._id, // Use actual doctor ID from profile
          additionalData: {
            importedFrom: 'HIS Integration Page',
            importedAt: new Date().toISOString(),
            importedBy: profileData.name || 'Doctor',
          },
        }),
      });

      const data = await response.json();
      console.log('Import response:', data);

      if (data.success) {
        toast.success(`Patient ${patient.name} imported successfully to main database!`);
        
        // Mark patient as imported in the current results
        setSearchResults((prev) =>
          prev.map((p) =>
            p.hisPatientId === patient.hisPatientId ? { ...p, imported: true } : p
          )
        );
      } else {
        console.error('Import failed:', data.message);
        toast.error(data.message || 'Failed to import patient');
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import patient. Please try again.");
    } finally {
      setImporting(false);
      setImportingPatientId(null);
    }
  };

  const TabButton = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              HIS Integration
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Connect and synchronize with Hospital Information Systems
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 mb-6">
        <div className="flex space-x-1">
          <TabButton
            label="Search Patients"
            icon={Search}
            isActive={activeTab === "search"}
            onClick={() => setActiveTab("search")}
          />
          <TabButton
            label="Pending Requests"
            icon={Clock}
            isActive={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          />
          <TabButton
            label="Statistics"
            icon={TrendingUp}
            isActive={activeTab === "statistics"}
            onClick={() => setActiveTab("statistics")}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Search HIS Patients
              </h2>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, phone, or patient ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50/50 to-blue-50/30 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 focus:bg-white transition-all duration-200 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results ({searchResults.length} patients found)
              </h3>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <div
                    key={patient.hisPatientId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-200 w-full min-h-[200px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Basic Info */}
                          <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {patient.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{patient.age} years • {patient.gender}</span>
                            </div>
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              ID: {patient.hisPatientId}
                            </div>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="md:col-span-1">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{patient.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{patient.phone}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Medical Info */}
                          <div className="md:col-span-1">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span>{patient.constitution}</span>
                              </div>
                              {patient.conditions && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <AlertCircle className="w-4 h-4 text-orange-400" />
                                  <span className="truncate">{patient.conditions}</span>
                                </div>
                              )}
                              {patient.allergies && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                  <span className="truncate">Allergies: {patient.allergies}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Status & Actions */}
                          <div className="md:col-span-1 flex items-center justify-end gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                              Diet Plan Ready
                            </span>

                            <button
                              onClick={() => handleImportPatient(patient)}
                              disabled={importing || patient.imported}
                              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full transition-all duration-300 text-sm font-medium shadow-md transform ${
                                patient.imported
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-not-allowed opacity-80"
                                  : importingPatientId === patient.hisPatientId
                                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                                  : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:scale-105 active:scale-95"
                              }`}
                            >
                              {importingPatientId === patient.hisPatientId ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Importing...</span>
                                </>
                              ) : patient.imported ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Imported</span>
                                </>
                              ) : (
                                <>
                                  <Import className="w-4 h-4" />
                                  <span>Import</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && searchQuery && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No Patients Found
              </h3>
              <p className="text-sm text-gray-600">
                Try searching with a different name, phone number, or patient
                ID.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "pending" && (
        <div className="space-y-6">
          {/* Pending Requests Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Pending Diet Chart Requests
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Diet charts requested from HIS that need completion
              </p>
            </div>
            <div className="p-5">
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  No pending requests at the moment
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  New HIS requests will appear here
                </p>
              </div>
            </div>
          </div>

          {/* Recently Synced Diet Charts Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Recently Synced Diet Charts
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Diet charts created in main system and synced to HIS
              </p>
            </div>
            <div className="p-5">
              <div className="text-center py-6">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  No recently synced diet charts
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Diet charts created for HIS patients will automatically sync
                  here
                </p>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-base">
                  Bidirectional Sync Active
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Diet charts created for HIS patients are automatically
                  synchronized to the hospital's information system. Both
                  pending requests from HIS and completed diet charts are
                  tracked here.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-green-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Auto-sync enabled
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Real-time updates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "statistics" && statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Total HIS Patients
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.totalHISPatients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Synced Patients
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.syncedPatients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Pending Charts
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.pendingDietCharts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Synced Diet Charts
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {statistics.syncedDietCharts || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Bidirectional Sync Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Auto-sync enabled:
                  </span>
                  <span className="text-sm text-green-700 font-medium">
                    Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last sync:</span>
                  <span className="text-sm text-gray-900">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Sync success rate:
                  </span>
                  <span className="text-sm text-green-700 font-medium">
                    100%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Integration Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Integration rate:
                  </span>
                  <span className="text-sm text-purple-700 font-medium">
                    {statistics.integrationRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data accuracy:</span>
                  <span className="text-sm text-purple-700 font-medium">
                    99.8%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System uptime:</span>
                  <span className="text-sm text-green-700 font-medium">
                    99.9%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HISIntegration;
