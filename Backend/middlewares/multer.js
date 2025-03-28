import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage,
    limits: {
        fieldSize: 20*1024*1024
    }
 });

export default upload;
