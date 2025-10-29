
import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import Setting from '../models/Setting';
import User from '../models/User';
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

// 2FA: generate setup secret (otpauth URL)
export const generate2FASetup = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({
            name: `CortexDesk (${user.email})`,
            length: 20
        });

        // Temporarily store secret until verified
        (user as any).twoFactorSecret = secret.base32;
        await user.save();

        res.status(200).json({ otpauthUrl: secret.otpauth_url, base32: secret.base32 });
    } catch (error) {
        logger.error('Error generating 2FA setup:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2FA: enable after verifying token
export const enable2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { token } = req.body as { token: string };
        const user = await User.findById(userId);
        if (!user || !(user as any).twoFactorSecret) return res.status(400).json({ message: '2FA not initialized' });

        const verified = speakeasy.totp.verify({
            secret: (user as any).twoFactorSecret,
            encoding: 'base32',
            token,
            window: 1
        });
        if (!verified) return res.status(400).json({ message: 'Invalid verification code' });

        (user as any).twoFactorEnabled = true;
        await user.save();
        res.status(200).json({ message: '2FA enabled' });
    } catch (error) {
        logger.error('Error enabling 2FA:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2FA: disable
export const disable2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        (user as any).twoFactorEnabled = false;
        (user as any).twoFactorSecret = undefined;
        await user.save();
        res.status(200).json({ message: '2FA disabled' });
    } catch (error) {
        logger.error('Error disabling 2FA:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
