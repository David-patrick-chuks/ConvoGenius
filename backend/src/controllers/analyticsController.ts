
import { Request, Response } from 'express';
import Analytics from '../models/Analytics';
import logger from '../utils/logger';

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        // Fetch the latest analytics data for the user
        const analyticsData = await Analytics.findOne({ userId }).sort({ date: -1 });

        if (!analyticsData) {
            // If no analytics data exists, return a default empty set
            return res.status(200).json({
                totalAgents: 0,
                activeDeployments: 0,
                messagesProcessed: 0,
                platformUsage: {},
            });
        }

        res.status(200).json(analyticsData);
    } catch (error) {
        logger.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
