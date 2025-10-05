import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Filter, MapPin, Calendar, Award, ChevronRight, Users, Stethoscope, Heart, Leaf, Pill } from 'lucide-react'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext)

  useEffect(() => {
    let filtered = doctors

    // Filter by speciality
    if (speciality) {
      const key = speciality.toLowerCase().trim()
      filtered = filtered.filter(
        (doc) => doc.speciality && doc.speciality.toLowerCase().trim() === key
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) => 
          doc.name?.toLowerCase().includes(query) ||
          doc.speciality?.toLowerCase().includes(query)
      )
    }

    setFilterDoc(filtered)
  }, [doctors, speciality, searchQuery])

  const specialties = [
    { id: 'Ayurvedic doctor', label: 'Ayurvedic Doctor', icon: Stethoscope },
    { id: 'Ayurvedic therapist', label: 'Ayurvedic Therapist', icon: Leaf },
    { id: 'Ayurvedic health counsellor', label: 'Health Counsellor', icon: Heart },
    { id: 'Rasashastra expert', label: 'Rasashastra Expert', icon: Pill }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Find Your Ayurvedic Expert
          </h1>
          <p className="text-lg text-gray-600">
            Connect with certified Ayurvedic practitioners for holistic wellness
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or speciality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-gray-900 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Filter Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setShowFilter(!showFilter)} 
              className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-colors text-gray-700 font-medium"
            >
              <Filter className="w-5 h-5" />
              {showFilter ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filter Panel */}
            <div className={`${showFilter ? 'block' : 'hidden'} lg:block bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden`}>
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Specialties</h3>
                <p className="text-sm text-gray-500 mt-1">Filter by expertise</p>
              </div>
              
              <div className="p-3">
                {/* All Doctors Option */}
                <button
                  onClick={() => navigate('/doctors')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 group ${
                    !speciality
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">All Doctors</span>
                    </div>
                    {!speciality && <ChevronRight className="w-5 h-5" />}
                  </div>
                </button>

                {/* Specialty Options */}
                {specialties.map((spec) => {
                  const IconComponent = spec.icon
                  return (
                    <button
                      key={spec.id}
                      onClick={() => 
                        speciality === spec.id 
                          ? navigate('/doctors') 
                          : navigate(`/doctors/${spec.id}`)
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 group ${
                        speciality === spec.id
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5" />
                          <span className="font-medium text-sm">{spec.label}</span>
                        </div>
                        {speciality === spec.id && <ChevronRight className="w-5 h-5" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="flex-1">
            {filterDoc.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Try a different search.`
                    : `No doctors available for "${speciality || 'this category'}".`
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filterDoc.length}</span> {filterDoc.length === 1 ? 'doctor' : 'doctors'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filterDoc.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => { navigate(`/appointment/${item._id}`); window.scrollTo(0, 0) }}
                      className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer hover:border-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Doctor Image */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 h-56">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          src={item.image} 
                          alt={item.name}
                        />
                        
                        {/* Availability Badge */}
                        <div className="absolute top-4 right-4">
                          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                            item.available 
                              ? 'bg-green-600/90 text-white' 
                              : 'bg-gray-500/90 text-white'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                item.available ? 'bg-white animate-pulse' : 'bg-white/60'
                              }`}></span>
                              {item.available ? 'Available' : 'Busy'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">
                          {item.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Award className="w-4 h-4 text-gray-900" />
                          <span>{item.speciality}</span>
                        </div>

                        {item.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Calendar className="w-4 h-4 text-gray-900" />
                            <span>{item.experience} years experience</span>
                          </div>
                        )}

                        {item.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{item.address.line1}</span>
                          </div>
                        )}

                        {/* Book Button */}
                        <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all group-hover:shadow-md flex items-center justify-center gap-2">
                          Book Appointment
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Doctors
