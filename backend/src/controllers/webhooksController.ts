
import { Request, Response } from 'express';
import deploymentService from '../services/deploymentService';

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const { platform, deploymentId } = req.params;
    const payload = req.body;

    try {
        // Pass headers and raw body for signature verification when needed (e.g., Slack, Twitter)
        const result = await deploymentService.handleWebhook(platform, deploymentId, payload, req.headers as any, (req as any).rawBody);
        // Discord interactions expect an immediate JSON payload response
        if (platform === 'discord' && result) {
            res.status(200).json(result);
            return;
        }
        res.status(200).send('OK');
        return;
    } catch (error) {
        console.error(`Error handling webhook for ${platform}:`, error);
        res.status(500).send('Error');
        return;
    }
};
