import multer from "multer";

import path from 'path';
const storage = multer.diskStorage({
    // store in backend/uploads/prescriptions
        destination: (req, file, cb) => {
            // store in backend/uploads/prescriptions (cwd is already backend)
            cb(null, path.join(process.cwd(), 'uploads/prescriptions'));
    },
    filename: (req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage })

export default upload