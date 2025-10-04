import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    const { dtoken, dToken } = req.headers
    const token = dtoken || dToken
    
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        
        // Validate that the ID is a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(token_decode.id)) {
            return res.json({ success: false, message: 'Invalid token format' })
        }
        
        // attach doctor info for downstream handlers
        req.user = { _id: token_decode.id };
        req.doctorId = token_decode.id; // Store in req object instead of req.body
        req.body.docId = token_decode.id;
        
        next()
    } catch (error) {
        console.log('JWT verification error:', error)
        res.json({ success: false, message: 'Invalid token' })
    }
}

export default authDoctor;