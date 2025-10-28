
import { Request, Response } from 'express';
import Resource from '../models/Resource';
import logger from '../utils/logger';

export const getResources = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const resources = await Resource.find({ userId });
        res.status(200).json(resources);
    } catch (error) {
        logger.error('Error fetching resources:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createResource = async (req: Request, res: Response) => {
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
    } catch (error) {
        logger.error('Error creating resource:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteResource = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { id } = req.params;

        const result = await Resource.deleteOne({ _id: id, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Resource not found or not authorized' });
        }

        res.status(200).json({ message: `Resource ${id} deleted successfully` });
    } catch (error) {
        logger.error('Error deleting resource:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
