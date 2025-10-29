import { Request, Response } from 'express';
import Agent from '../models/Agent';
import User from '../models/User';
import { uploadToCloudinary } from '../utils/cloudinary';
import logger from '../utils/logger';

export const uploadProfileAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }
        const result = await uploadToCloudinary(req.file, 'cortexdesk/profiles', { quality: 'auto', crop: 'limit', format: 'jpg' });
        const user = await User.findByIdAndUpdate((req.user as any).id, { avatar: result.secure_url }, { new: true });
        res.status(200).json({ success: true, url: result.secure_url, user });
        return;
    } catch (error) {
        logger.error('Error uploading profile avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
        return;
    }
};

export const uploadAgentAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { agentId } = req.params as { agentId: string };
        if (!req.file) {
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }
        // Verify agent belongs to user
        const agent = await Agent.findOne({ _id: agentId, userId: (req.user as any).id });
        if (!agent) {
            res.status(404).json({ error: 'Agent not found' });
            return;
        }
        const result = await uploadToCloudinary(req.file, 'cortexdesk/agents', { quality: 'auto', crop: 'limit', format: 'jpg' });
        agent.avatar = result.secure_url;
        await agent.save();
        res.status(200).json({ success: true, url: result.secure_url, agent });
        return;
    } catch (error) {
        logger.error('Error uploading agent avatar:', error);
        res.status(500).json({ error: 'Failed to upload agent avatar' });
        return;
    }
};


