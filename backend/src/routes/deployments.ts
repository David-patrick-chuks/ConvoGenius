
import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createDeployment, getDeployments, oauth, oauthCallback } from '../controllers/deploymentsController';

const router = express.Router();

router.route('/').get(protect, getDeployments).post(protect, createDeployment);

router.get('/oauth/:platform', protect, oauth);
router.get('/oauth/:platform/callback', oauthCallback);

export default router;
