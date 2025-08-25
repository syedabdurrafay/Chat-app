import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  allMessages, 
  sendMessage, 
  uploadMessageFile, 
  deleteFile,
  reactToMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);
router.route('/upload').post(protect, uploadMessageFile);
router.route('/file/:filename').delete(protect, deleteFile);
// New routes
router.route('/react/:messageId').put(protect, reactToMessage);
router.route('/:messageId').put(protect, editMessage);
router.route('/:messageId').delete(protect, deleteMessage);

export default router;