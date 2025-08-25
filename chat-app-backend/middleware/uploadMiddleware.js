import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = file.originalname.replace(ext, '') + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp3|wav|ogg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (JPEG, JPG, PNG, GIF, WEBP), videos (MP4, MOV, AVI, WEBM), audio (MP3, WAV, OGG), and documents (PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: fileFilter
});

export const uploadFile = upload.single('file');

export const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpeg', '.jpg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return 'document';
  return 'unknown';
};