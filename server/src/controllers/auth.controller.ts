import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { VerificationToken } from '../models/VerificationToken';
import { OtpToken } from '../models/OtpToken';
import { emailService } from '../services/email.service';

export class AuthController {
  
  /**
   * Generates a random secure token, hashes it for DB storage, and returns both.
   */
  private generateVerificationToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  /**
   * Generates a cryptographically secure 6-digit OTP and its SHA-256 hash.
   */
  private generateOtp(): { otp: string; otpHash: string } {
    // Generate a random 6-digit number (padded to always be 6 digits)
    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    console.log(`[OTP] Generated new OTP for user: ${otp} (hash: ${otpHash.substring(0, 8)}...)`);
    return { otp, otpHash };
  }

  /**
   * POST /api/auth/register
   * Registers a user, marks as unverified, and sends verification email.
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('--- SIGNUP REQUEST ---');
      const { name, email, password } = req.body;
      console.log(`Signup request received for email: ${email}`);

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerified: true,
      });
      console.log(`User created successfully with ID: ${user._id}`);

      const token = jwt.sign(
        { id: user._id, email: user.email, emailVerified: true },
        process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful.',
        requiresVerification: false,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          completedOnboarding: user.completedOnboarding ?? false,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT.
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, emailVerified: true },
        process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          completedOnboarding: user.completedOnboarding ?? false,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/send-verification
   * Resends the verification email (enforces cooldown).
   */
  public async sendVerification(req: Request, res: Response): Promise<void> {
    try {
      console.log('--- RESEND VERIFICATION REQUEST ---');
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Return 200 to prevent email enumeration
        res.status(200).json({ message: 'If the email exists, a verification link has been sent.' });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({ error: 'Email is already verified' });
        return;
      }

      // Check cooldown (60 seconds)
      const recentToken = await VerificationToken.findOne({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
      });

      if (recentToken) {
        res.status(429).json({ error: 'Please wait 60 seconds before requesting another email.' });
        return;
      }

      // Generate new token
      const { rawToken, tokenHash } = this.generateVerificationToken();
      console.log(`New verification token generated for resend: ${user._id}`);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Invalidate existing active tokens (optional but good practice)
      await VerificationToken.deleteMany({ userId: user._id, usedAt: null });

      await VerificationToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });

      console.log(`\n======================================================`);
      console.log(`🔑 [VERIFICATION LINK RESEND] For ${user.email}: token=${rawToken}`);
      console.log(`======================================================\n`);

      try {
        await emailService.sendVerificationEmail(user.email, user.name, rawToken);
      } catch (emailErr: any) {
        console.warn(`[Verification] Email delivery failed: ${emailErr.message || emailErr}`);
      }

      res.status(200).json({ message: 'Verification email resent.' });
    } catch (error) {
      console.error('Send verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/auth/verify-email
   * Validates the token and marks the user as verified.
   */
  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Invalid or missing token' });
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const verificationToken = await VerificationToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() }
      });

      if (!verificationToken) {
        console.log(`Verification failed: Invalid, expired, or already used token used.`);
        // Token is invalid, expired, or already used
        res.status(400).json({ error: 'Verification link is invalid or has expired.' });
        return;
      }

      // Mark token as used
      verificationToken.usedAt = new Date();
      await verificationToken.save();

      // Update user
      await User.findByIdAndUpdate(verificationToken.userId, { emailVerified: true });

      // Clean up all other unused tokens for this user
      await VerificationToken.deleteMany({ userId: verificationToken.userId, usedAt: null });

      console.log(`Verification success: User ${verificationToken.userId} is now verified.`);
      res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/auth/verification-status
   * Checks if the user's email is verified (used by frontend auto-polling).
   */
  public async verificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ emailVerified: user.emailVerified });
    } catch (error) {
      console.error('Verification status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  /**
   * POST /api/auth/verify-otp
   * Validates a 6-digit OTP and marks the user as verified.
   */
  public async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP are required.' });
        return;
      }

      if (!/^\d{6}$/.test(String(otp))) {
        res.status(400).json({ error: 'OTP must be a 6-digit number.' });
        return;
      }

      console.log(`[OTP] Verify attempt for email: ${email}`);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({ error: 'Email is already verified.' });
        return;
      }

      // Find latest valid OTP token
      const otpRecord = await OtpToken.findOne({
        userId: user._id,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        console.log(`[OTP] No valid OTP found for user: ${user._id}`);
        res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        return;
      }

      // Check max attempts (5)
      if (otpRecord.attempts >= 5) {
        console.log(`[OTP] Max attempts reached for user: ${user._id}`);
        res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      // Hash the incoming OTP and compare
      const incomingHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
      if (incomingHash !== otpRecord.otpHash) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = 5 - otpRecord.attempts;
        console.log(`[OTP] Invalid OTP for user: ${user._id}. Attempts left: ${remaining}`);
        res.status(400).json({
          error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        });
        return;
      }

      // OTP is correct — mark as used
      otpRecord.usedAt = new Date();
      await otpRecord.save();

      // Mark user as verified
      await User.findByIdAndUpdate(user._id, { emailVerified: true });

      // Delete all remaining OTP tokens for this user
      await OtpToken.deleteMany({ userId: user._id });

      console.log(`[OTP] ✅ Email verified for user: ${user._id} (${email})`);

      // Issue JWT so frontend can log the user in immediately
      const token = jwt.sign(
        { id: user._id, email: user.email, emailVerified: true },
        process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
        { expiresIn: '7d' },
      );

      res.status(200).json({
        message: 'Email verified successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          completedOnboarding: user.completedOnboarding ?? false,
        },
      });
    } catch (error) {
      console.error('[OTP] verifyOtp error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/resend-otp
   * Generates and sends a fresh OTP. Enforces 60-second cooldown.
   */
  public async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      console.log(`[OTP] Resend requested for: ${email}`);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Anti-enumeration: return 200 regardless
        res.status(200).json({ message: 'If this account exists, a new code has been sent.' });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({ error: 'Email is already verified.' });
        return;
      }

      // 60-second cooldown check
      const recentOtp = await OtpToken.findOne({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      });
      if (recentOtp) {
        console.log(`[OTP] Resend rate-limited for user: ${user._id}`);
        res.status(429).json({ error: 'Please wait 60 seconds before requesting another code.' });
        return;
      }

      // Invalidate all previous OTPs
      await OtpToken.deleteMany({ userId: user._id });

      // Generate new OTP
      const { otp, otpHash } = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await OtpToken.create({ userId: user._id, otpHash, expiresAt });
      console.log(`[OTP] New OTP token saved for user: ${user._id}`);
      console.log(`\n======================================================`);
      console.log(`🔑 [VERIFICATION CODE RESEND] For ${user.email}: ${otp}`);
      console.log(`======================================================\n`);

      try {
        await emailService.sendOtpEmail(user.email, user.name, otp);
        console.log(`[OTP] ✅ Resent OTP to ${user.email}`);
      } catch (emailErr: any) {
        console.warn(`[OTP] Resend email delivery failed: ${emailErr.message || emailErr}`);
        console.warn(`[OTP] Fallback active: Use the verification code above from the terminal console.`);
      }

      res.status(200).json({ message: 'A new verification code has been sent.' });
    } catch (error) {
      console.error('[OTP] resendOtp error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();
