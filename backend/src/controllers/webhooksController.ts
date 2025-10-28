
import { Request, Response } from 'express';
import deploymentService from '../services/deploymentService';

export const handleWebhook = async (req: Request, res: Response) => {
    const { platform, deploymentId } = req.params;
    const payload = req.body;

    try {
        // Pass headers and raw body for signature verification when needed (e.g., Slack, Twitter)
        await deploymentService.handleWebhook(platform, deploymentId, payload, req.headers as any, (req as any).rawBody);
        res.status(200).send('OK');
    } catch (error) {
        console.error(`Error handling webhook for ${platform}:`, error);
        res.status(500).send('Error');
    }
};
