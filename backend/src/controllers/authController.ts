import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { clearAuthCookies, setAuthCookies } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { AppError, ChangePasswordRequest, LoginRequest, RegisterRequest } from '../types';
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

                // Redirect to frontend with success
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
            // TODO: Implement email verification
            res.json({
                success: true,
                message: 'Email verification not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Forgot password (placeholder for future implementation)
     */
    static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Implement forgot password
            res.json({
                success: true,
                message: 'Password reset not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password (placeholder for future implementation)
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Implement password reset
            res.json({
                success: true,
                message: 'Password reset not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }
}