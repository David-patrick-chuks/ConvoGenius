
import express from 'express';
import { handleWebhook } from '../controllers/webhooksController';

const router = express.Router();

// Capture raw body for signature verification (e.g., Slack)
router.use(express.json({
    verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

// Include deploymentId to route webhooks to specific deployments
router.post('/:platform/:deploymentId', handleWebhook);

export default router;
