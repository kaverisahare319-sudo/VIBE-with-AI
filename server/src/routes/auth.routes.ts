import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/send-verification', authController.sendVerification.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.get('/verification-status', authController.verificationStatus.bind(authController));

// OTP Routes
router.post('/verify-otp', authController.verifyOtp.bind(authController));
router.post('/resend-otp', authController.resendOtp.bind(authController));

export default router;
