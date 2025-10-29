
import { Router } from 'express';
import { disable2FA, enable2FA, generate2FASetup, getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.post('/2fa/setup', protect, generate2FASetup);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);

export default router;
