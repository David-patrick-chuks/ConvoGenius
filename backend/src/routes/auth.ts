
import express from 'express';
import { AuthController } from '../controllers/authController';
import { protect, refreshToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Authentication routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', refreshToken);

// Google OAuth routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Protected routes
router.get('/me', protect, AuthController.getProfile);
router.put('/profile', protect, AuthController.updateProfile);
router.put('/change-password', protect, AuthController.changePassword);
router.delete('/account', protect, AuthController.deleteAccount);

// Future implementations
router.post('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
