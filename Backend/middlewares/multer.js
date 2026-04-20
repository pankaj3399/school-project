import multer from "multer";

const ALLOWED_IMAGE_MIMETYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
]);

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fieldSize: 20 * 1024 * 1024,
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image uploads are allowed (PNG, JPEG, WEBP, GIF, SVG).'), false);
        }
    }
});

export default upload;
