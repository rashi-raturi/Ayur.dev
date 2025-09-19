import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const DoctorProfileAdmin = () => {
  const { doctorDetails, getDoctorDetails, updateDoctorDetails } = useContext(AdminContext)
  const [isEdit, setIsEdit] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  // load doctor info
  useEffect(() => {
    if (id) getDoctorDetails(id)
  }, [id])

  // sync local form data when fetched
  const [formData, setFormData] = useState(null)
  useEffect(() => {
    if (doctorDetails) {
      setFormData({ ...doctorDetails })
    }
  }, [doctorDetails])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [key]: value }
      }))
    } else if (name === 'available') {
      setFormData(prev => ({ ...prev, available: e.target.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFile = (e) => {
    if (e.target.files[0]) setImageFile(e.target.files[0])
  }

  const saveUpdates = async () => {
    if (!formData) return
    await updateDoctorDetails(id, formData, imageFile)
    setIsEdit(false)
  }

  if (!formData) return <p className="p-5">Loading...</p>

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-lg mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">← Back</button>
        
      </div>
      {/* Profile Header */}
      <div className="grid sm:grid-cols-3 gap-6 bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="sm:col-span-1 flex flex-col items-center">
          <img src={formData.image} alt="doctor" className="w-32 h-32 object-cover rounded-full mb-4 border" />
          {isEdit && <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />}
        </div>
        <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {['name','degree','speciality','experience'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              {isEdit
                ? <input
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded p-2 focus:ring-primary focus:border-primary"
                  />
                : <p className="text-gray-800">{formData[field]}</p>
              }
            </div>
          ))}
        </div>
      </div>
      {/* Details Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">About</label>
          {isEdit
            ? <textarea
                name="about"
                rows={4}
                className="w-full border-gray-300 rounded p-2 focus:ring-primary focus:border-primary"
                value={formData.about}
                onChange={handleChange}
              />
            : <p className="text-gray-700">{formData.about}</p>
          }
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Fees</label>
            {isEdit
              ? <input
                  name="fees"
                  type="number"
                  className="w-full border-gray-300 rounded p-2 focus:ring-primary focus:border-primary"
                  value={formData.fees}
                  onChange={handleChange}
                />
              : <p className="text-gray-800">{formData.fees}</p>
            }
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Availability</label>
            <div className="flex items-center">
              <input
                name="available"
                type="checkbox"
                checked={formData.available}
                disabled={!isEdit}
                onChange={handleChange}
                className="h-4 w-4 text-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-800">{formData.available ? 'Available' : 'Not Available'}</span>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {isEdit
                ? <input
                    name="address.line1"
                    className="w-full border-gray-300 rounded p-2 focus:ring-primary focus:border-primary"
                    value={formData.address.line1}
                    onChange={handleChange}
                  />
                : <p className="text-gray-800">{formData.address.line1}</p>
              }
            </div>
            <div>
              {isEdit
                ? <input
                    name="address.line2"
                    className="w-full border-gray-300 rounded p-2 focus:ring-primary focus:border-primary"
                    value={formData.address.line2}
                    onChange={handleChange}
                  />
                : <p className="text-gray-800">{formData.address.line2}</p>
              }
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          {isEdit
            ? (
              <>
                <button onClick={saveUpdates} className="px-4 py-2 bg-primary text-white rounded-lg mr-2 hover:bg-primary-dark">Save</button>
                <button onClick={() => { setIsEdit(false); setFormData({ ...doctorDetails }) }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
              </>
            )
            : <button onClick={() => setIsEdit(true)} className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white">Edit Profile</button>
          }
        </div>
      </div>
    </div>
  )
}

export default DoctorProfileAdmin
