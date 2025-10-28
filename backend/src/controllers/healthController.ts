
import { Request, Response } from 'express';

export const getHealth = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
