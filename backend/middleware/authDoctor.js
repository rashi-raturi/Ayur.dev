import jwt from 'jsonwebtoken'

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    const { dtoken, dToken } = req.headers
    const token = dtoken || dToken
    
    console.log('Auth headers:', { dtoken, dToken, token });
    
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        console.log('Token decoded:', { id: token_decode.id });
        
        // attach doctor info for downstream handlers
        req.user = { _id: token_decode.id };
        req.doctorId = token_decode.id; // Store in req object instead of req.body
        req.body.docId = token_decode.id;
        
        console.log('docId set in req.body:', req.body.docId);
        console.log('doctorId set in req:', req.doctorId);
        next()
    } catch (error) {
        console.log('JWT verification error:', error)
        res.json({ success: false, message: error.message })
    }
}

export default authDoctor;