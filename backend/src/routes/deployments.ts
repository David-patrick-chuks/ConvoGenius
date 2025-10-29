
import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createDeployment, getDeployments, getDeploymentsSummary, oauth, oauthCallback } from '../controllers/deploymentsController';

const router = express.Router();

router.route('/').get(protect, getDeployments).post(protect, createDeployment);
router.get('/summary', protect, getDeploymentsSummary);

router.get('/oauth/:platform', protect, oauth);
router.get('/oauth/:platform/callback', oauthCallback);

export default router;
