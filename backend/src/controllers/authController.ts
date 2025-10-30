import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { clearAuthCookies, setAuthCookies } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { AppError, ChangePasswordRequest, LoginRequest, RegisterRequest } from '../types';
import { sendMail } from '../utils/brevo';
import logger from '../utils/logger';

export class AuthController {
    /**
     * Register a new user
     */
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data: RegisterRequest = req.body;
            
            const result = await AuthService.register(data);
            
            // Generate refresh token
            const refreshToken = AuthService.generateRefreshToken(result.user._id);
            
            // Set httpOnly cookies
            setAuthCookies(res, result.token, refreshToken);
            // Non-HTTPOnly indicator for Next middleware routing
            res.cookie('emailVerified', result.user.isEmailVerified ? '1' : '0', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            
            // Auto-send verification email if mail configured
            try {
                const crypto = await import('crypto');
                const token = crypto.randomBytes(32).toString('hex');
                const User = (await import('../models/User')).default as any;
                const u = await User.findById((result.user as any)._id);
                if (u) {
                    u.emailVerificationToken = token;
                    await u.save();
                    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
                    await sendMail(
                        result.user.email,
                        'Verify your email - CortexDesk',
                        `<p>Welcome to CortexDesk!</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
                    );
                }
            } catch (e) {
                logger.warn('Email verification not sent (mailer not configured)');
            }

            res.status(201).json({
                success: true,
                data: { user: result.user },
                message: 'User registered successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data: LoginRequest = req.body;
            
            const result = await AuthService.login(data);
            
            // Generate refresh token
            const refreshToken = AuthService.generateRefreshToken(result.user._id);
            
            // Set httpOnly cookies
            setAuthCookies(res, result.token, refreshToken);
            res.cookie('emailVerified', result.user.isEmailVerified ? '1' : '0', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            
            res.json({
                success: true,
                data: { user: result.user },
                message: 'Login successful'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     */
    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // Clear httpOnly cookies
            clearAuthCookies(res);
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            res.json({
                success: true,
                data: req.user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            const updatedUser = await AuthService.updateProfile((req.user as any)._id, req.body);
            
            res.json({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     */
    static async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            const data: ChangePasswordRequest = req.body;
            
            await AuthService.changePassword(
                (req.user as any)._id,
                data.currentPassword,
                data.newPassword
            );
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user account
     */
    static async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            await AuthService.deleteAccount((req.user as any)._id);
            
            // Clear cookies
            clearAuthCookies(res);
            
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Google OAuth login
     */
    static async googleAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies?.accessToken;
            if (token) {
                try {
                    const decoded = AuthService.verifyAccessToken(token);
                    if (decoded?.id) {
                        return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
                    }
                } catch {}
            }
            passport.authenticate('google', {
                scope: ['profile', 'email']
            })(req, res, next);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Google OAuth callback
     */
    static async googleCallback(req: Request, res: Response, next: NextFunction) {
        passport.authenticate('google', async (err: any, user: any) => {
            try {
                if (err) {
                    logger.error('Google OAuth error:', err);
                    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
                }

                if (!user) {
                    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
                }

                // Generate tokens
                const accessToken = AuthService.generateAccessToken(user._id);
                const refreshToken = AuthService.generateRefreshToken(user._id);

                // Set httpOnly cookies
                setAuthCookies(res, accessToken, refreshToken);

                // If email not verified, generate verification token, send email via Brevo, and redirect to verify page
                try {
                    if (!user.isEmailVerified) {
                        const crypto = await import('crypto');
                        const token = crypto.randomBytes(32).toString('hex');
                        const u = await (await import('../models/User')).default.findById(user._id);
                        if (u) {
                            (u as any).emailVerificationToken = token;
                            await u.save();
                            const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
                            const sendMail = (await import('../utils/brevo')).sendMail as any;
                            await sendMail(user.email, 'Verify your email - CortexDesk', `<p>Verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`);
                            // Set helper cookie for frontend middleware
                            res.cookie('emailVerified', '0', {
                                httpOnly: false,
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                                maxAge: 30 * 24 * 60 * 60 * 1000
                            });
                            return res.redirect(verifyUrl);
                        }
                    }
                } catch (e) {
                    logger.warn('Google callback verification email step failed or skipped');
                }

                // Otherwise redirect to dashboard
                res.cookie('emailVerified', user.isEmailVerified ? '1' : '0', {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });
                res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=success`);
            } catch (error) {
                logger.error('Google callback error:', error);
                res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }
        })(req, res, next);
    }

    /**
     * Refresh access token
     */
    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            
            if (!refreshToken) {
                throw new AppError('Refresh token not provided', 401);
            }

            const { accessToken } = await AuthService.refreshToken(refreshToken);
            
            // Set new access token in httpOnly cookie
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.json({
                success: true,
                data: { accessToken }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify email (placeholder for future implementation)
     */
    static async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const token = (req.body?.token || req.query?.token) as string;
            if (!token) {
                throw new AppError('Verification token is required', 400);
            }
            const user = await (await import('../models/User')).default.findOne({ emailVerificationToken: token });
            if (!user) {
                throw new AppError('Invalid or expired token', 400);
            }
            (user as any).isEmailVerified = true;
            (user as any).emailVerificationToken = undefined;
            await (user as any).save();
            res.cookie('emailVerified', '1', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            res.json({ success: true, message: 'Email verified successfully' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resend verification email to the authenticated user
     */
    static async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req.user as any)?.id;
            if (!userId) throw new AppError('Unauthorized', 401);
            const User = (await import('../models/User')).default as any;
            const user = await User.findById(userId);
            if (!user) throw new AppError('User not found', 404);
            if (user.isEmailVerified) {
                res.json({ success: true, message: 'Email already verified' });
                return;
            }
            const crypto = await import('crypto');
            const token = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = token;
            await user.save();
            const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
            const { sendMail } = await import('../utils/brevo');
            await sendMail(user.email, 'Verify your email - CortexDesk', `<p>Verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`);
            res.json({ success: true, message: 'Verification email sent' });
            return;
        } catch (error) {
            next(error);
            return;
        }
    }

    static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body as { email: string };
            if (!email) throw new AppError('Email is required', 400);
    
            const User = (await import('../models/User')).default as any;
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) throw new AppError('User not found', 404);
    
            const crypto = await import('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = resetToken;
            user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
            await user.save();
    
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
            try {
                await sendMail(
                    email,
                    'Reset your password - CortexDesk',
                    `<p>Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
                );
                
                res.json({ success: true, message: 'Password reset email sent' });
                return;
            } catch (e) {
                logger.warn('Email transport not configured; returning link in response for dev');
                res.json({ success: true, message: 'Password reset link (dev)', data: { resetUrl } });
                return;
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password (placeholder for future implementation)
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body as { token: string; password: string };
            if (!token || !password) throw new AppError('Token and password are required', 400);
            const User = (await import('../models/User')).default as any;
            const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
            if (!user) throw new AppError('Invalid or expired token', 400);
            user.password = password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            res.json({ success: true, message: 'Password reset successful' });
        } catch (error) {
            next(error);
        }
    }
}