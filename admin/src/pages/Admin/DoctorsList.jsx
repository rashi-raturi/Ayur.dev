import { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {

  const { doctors, changeAvailability, deleteDoctor, aToken, getAllDoctors } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
}, [aToken, getAllDoctors])

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.map((item, index) => (
          <div key={index} className='relative border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden group hover:shadow'>
            <Link to={`/doctor/${item._id}`} className='block'>
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
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors"></div>
                      <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-7"></div>
                   </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">{item.available ? 'Available' : 'Unavailable'}</span>
                 </label>
          </div>
         </div>
        </Link>
            {/* Delete button */}
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); deleteDoctor(item._id) }}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
              title="Delete doctor"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7L5 7M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M10 11v6M14 11v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
         ))}
       </div>
     </div>
   )
}

export default DoctorsList