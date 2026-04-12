const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
   
    const userId = req.user ? req.user._id : 'anon';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${userId}-${timestamp}${ext}`);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;

  const mimeOk = allowedMimeTypes.includes(file.mimetype);
  const extOk = allowedExtensions.test(path.extname(file.originalname));

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};


const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,   
    files: 1,                     
  },
});

module.exports = upload;