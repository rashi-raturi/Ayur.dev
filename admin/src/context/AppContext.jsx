import { createContext } from "react";


export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Function to format the date eg. ( 20_01_2000 => Jan 20, 2000 ) or ( 2025-10-03 => Oct 3, 2025 )
    const slotDateFormat = (slotDate) => {
        if (!slotDate) return 'undefined'
        
        // Handle YYYY-MM-DD format
        if (slotDate.includes('-')) {
            const dateArray = slotDate.split('-')
            const year = dateArray[0]
            const month = Number(dateArray[1]) - 1 // Month index (0-11)
            const day = Number(dateArray[2])
            return months[month] + " " + day + ", " + year
        }
        
        // Handle DD_MM_YYYY format
        const dateArray = slotDate.split('_')
        return months[Number(dateArray[1])] + " " + dateArray[0] + ", " + dateArray[2]
    }

    // Function to calculate the age eg. ( 20_01_2000 => 24 )
    const calculateAge = (dob) => {
        try {
            if (!dob || dob === 'Not Selected' || dob === '' || dob === null || dob === undefined) {
                return NaN;
            }
            
            const today = new Date();
            let birthDate;
            
            // Handle different date formats
            if (typeof dob === 'string') {
                // Try different date formats
                if (dob.includes('_')) {
                    // Format: DD_MM_YYYY
                    const parts = dob.split('_');
                    if (parts.length === 3) {
                        birthDate = new Date(parts[2], parts[1] - 1, parts[0]); // Year, Month (0-indexed), Day
                    } else {
                        birthDate = new Date(dob);
                    }
                } else if (dob.includes('-')) {
                    // Format: YYYY-MM-DD or DD-MM-YYYY
                    birthDate = new Date(dob);
                } else {
                    birthDate = new Date(dob);
                }
            } else {
                birthDate = new Date(dob);
            }
            
            // Check if the date is valid
            if (isNaN(birthDate.getTime())) {
                return NaN;
            }
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            // If birthday hasn't occurred this year yet, subtract 1
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age >= 0 ? age : NaN;
        } catch (error) {
            return NaN;
        }
    }

    const value = {
        backendUrl,
        currency,
        slotDateFormat,
        calculateAge,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider