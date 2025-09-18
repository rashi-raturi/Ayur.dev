import { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { Link } from 'react-router-dom'

const DoctorsList = () => {

  const { doctors, changeAvailability , aToken , getAllDoctors} = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
}, [aToken])

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.map((item, index) => (
          <Link to={`/doctor/${item._id}`} key={index} className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden group hover:shadow'>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2'>
                <label className="inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.available}
                      onChange={() => changeAvailability(item._id)}
                    />
                    <div className="w-14 h-8 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors"></div>
                    <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">{item.available ? 'Available' : 'Unavailable'}</span>
                </label>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DoctorsList