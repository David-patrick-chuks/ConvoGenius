
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../types';

/**
 * Middleware to protect routes with JWT authentication
 * Supports both httpOnly cookies and Authorization header
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        // Try to get token from httpOnly cookie first
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new AppError('Access denied. No token provided.', 401);
        }

        // Verify token
        try {
            const decoded = AuthService.verifyAccessToken(token);
            const user = await AuthService.getUserById(decoded.id);
            if (!user) {
                throw new AppError('User not found.', 401);
            }
            req.user = user;
            return next();
        } catch (verifyErr) {
            // Attempt silent refresh using refreshToken cookie
            const rt = req.cookies?.refreshToken;
            if (!rt) {
                throw verifyErr;
            }
            try {
                const { accessToken } = await AuthService.refreshToken(rt);
                // set new access cookie
                res.cookie('accessToken', accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 15 * 60 * 1000
                });
                const decoded = AuthService.verifyAccessToken(accessToken);
                const user = await AuthService.getUserById(decoded.id);
                if (!user) {
                    throw new AppError('User not found.', 401);
                }
                req.user = user;
                return next();
            } catch (refreshErr) {
                throw new AppError('Access denied. Please login again.', 401);
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to handle token refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            throw new AppError('Refresh token not provided.', 401);
        }

        const { accessToken } = await AuthService.refreshToken(refreshToken);
        
        // Set new access token in httpOnly cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ success: true, accessToken });
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to set httpOnly cookies for authentication
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    // Set access token cookie (short-lived)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set refresh token cookie (long-lived)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * Middleware to clear authentication cookies
 */
export const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = AuthService.verifyAccessToken(token);
            const user = await AuthService.getUserById(decoded.id);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Middleware to check if user has specific role/permission
 */
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }

        // TODO: Implement permission checking logic
        // For now, all authenticated users have all permissions
        next();
    };
};
