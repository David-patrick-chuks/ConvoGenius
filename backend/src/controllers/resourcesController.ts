
import { Request, Response } from 'express';
import Resource from '../models/Resource';
import logger from '../utils/logger';

export const getResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const resources = await Resource.find({ userId });
        res.status(200).json(resources);
        return;
    } catch (error) {
        logger.error('Error fetching resources:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

export const createResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const { name, type, url } = req.body;

        const newResource = await Resource.create({
            userId,
            name,
            type,
            url,
        });

        res.status(201).json(newResource);
        return;
    } catch (error) {
        logger.error('Error creating resource:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const { id } = req.params;

        const result = await Resource.deleteOne({ _id: id, userId });

        if (result.deletedCount === 0) {
            res.status(404).json({ message: 'Resource not found or not authorized' });
            return;
        }

        res.status(200).json({ message: `Resource ${id} deleted successfully` });
        return;
    } catch (error) {
        logger.error('Error deleting resource:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};
