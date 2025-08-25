import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { allUsers } from '../controllers/userController.js';

const router = express.Router();

router.route('/').get(protect, allUsers);

export default router;