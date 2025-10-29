
import { Router } from 'express';
import multer from 'multer';
import { disable2FA, enable2FA, generate2FASetup, get2FAQr, getSettings, updateSettings } from '../controllers/settingsController';
import { uploadProfileAvatar } from '../controllers/uploadsController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
// Profile image upload
const upload = multer({ storage: multer.memoryStorage() });
router.post('/profile/avatar', protect, upload.single('image'), uploadProfileAvatar);
router.post('/2fa/setup', protect, generate2FASetup);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/qr', protect, get2FAQr);

export default router;
