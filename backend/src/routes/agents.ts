
import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { 
    createAgent, 
    getAgents, 
    getAgent, 
    updateAgent, 
    deleteAgent,
    getAgentTrainingStatus,
    clearAgentMemory
} from '../controllers/agentsController';

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

export default router;
