
import { Request, Response } from 'express';
import Setting from '../models/Setting';
import logger from '../utils/logger';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        let settings = await Setting.findOne({ userId });

        if (!settings) {
            // Create default settings if none exist
            settings = await Setting.create({ userId });
        }

        res.status(200).json(settings);
    } catch (error) {
        logger.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const updatedSettings = req.body;

        const settings = await Setting.findOneAndUpdate(
            { userId },
            { $set: updatedSettings },
            { new: true, upsert: true } // Create if not exists, return new document
        );

        res.status(200).json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        logger.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
