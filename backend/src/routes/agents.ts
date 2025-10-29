
import express from 'express';
import multer from 'multer';
import {
  clearAgentMemory,
  createAgent,
  deleteAgent,
  getAgent,
  getAgents,
  getAgentTrainingStatus,
  updateAgent
} from '../controllers/agentsController';
import { uploadAgentAvatar } from '../controllers/uploadsController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(protect, getAgents)
    .post(protect, createAgent);

router.route('/:id')
    .get(protect, getAgent)
    .put(protect, updateAgent)
    .delete(protect, deleteAgent);

// Training-related endpoints
router.route('/:id/training')
    .get(protect, getAgentTrainingStatus);

router.route('/:id/memory')
    .delete(protect, clearAgentMemory);

// Agent avatar upload (Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });
router.post('/:agentId/avatar', protect, upload.single('image'), uploadAgentAvatar);

export default router;
