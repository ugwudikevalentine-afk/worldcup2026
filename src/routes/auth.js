import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';
import { generateToken, protect } from '../middleware/auth.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
    body('name')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('whatsapp')
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Please provide a valid WhatsApp number'),
    body('country')
        .trim()
        .notEmpty()
        .withMessage('Please select your country'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, whatsapp, country, password, acceptedTerms } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create user
        const user = await User.create({
            name,
            email,
            whatsapp,
            country,
            password,
            emailVerificationCode: verificationCode,
            emailVerificationExpires: verificationExpires,
            isEmailVerified: false,
            acceptedTerms: acceptedTerms || false,
            acceptedTermsAt: acceptedTerms ? new Date() : null
        });

        // Send verification email
        try {
            await sendVerificationEmail(user, verificationCode);
            console.log('✅ Verification email sent to:', user.email);
        } catch (emailError) {
            console.error('❌ Verification email failed:', emailError.message);
            // Continue - registration still successful
        }

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for verification code.',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    whatsapp: user.whatsapp,
                    country: user.country,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid user data'
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email with 6-digit code
// @access  Private
router.post('/verify-email', protect, [
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('Verification code must be 6 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { code } = req.body;

        const user = await User.findById(req.user._id).select('+emailVerificationCode +emailVerificationExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Check if code expired
        if (user.emailVerificationExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        // Check if code matches
        if (user.emailVerificationCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Mark as verified
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Send welcome email after verification
        try {
            await sendWelcomeEmail(user);
            console.log('✅ Welcome email sent to:', user.email);
        } catch (emailError) {
            console.error('❌ Welcome email failed:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Email verified successfully!',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                country: user.country,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email',
            error: error.message
        });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification code
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        // Send new verification email
        try {
            await sendVerificationEmail(user, verificationCode);
            console.log('✅ New verification email sent to:', user.email);
        } catch (emailError) {
            console.error('❌ Verification email failed:', emailError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        res.json({
            success: true,
            message: 'Verification code resent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending verification code',
            error: error.message
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code to email
// @access  Public
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a reset code has been sent.'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'This account has been disabled. Please contact support.'
            });
        }

        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.passwordResetCode = resetCode;
        user.passwordResetExpires = resetExpires;
        await user.save();

        // Send reset email
        try {
            await sendPasswordResetEmail(user, resetCode);
            console.log('✅ Password reset email sent to:', user.email);
        } catch (emailError) {
            console.error('❌ Password reset email failed:', emailError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'If an account with that email exists, a reset code has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.',
            error: error.message
        });
    }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify password reset code
// @access  Public
router.post('/verify-reset-code', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('Reset code must be 6 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, code } = req.body;

        const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset code.'
            });
        }

        // Check if reset code exists
        if (!user.passwordResetCode || !user.passwordResetExpires) {
            return res.status(400).json({
                success: false,
                message: 'No reset code found. Please request a new one.'
            });
        }

        // Check if code expired
        if (user.passwordResetExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one.'
            });
        }

        // Check if code matches
        if (user.passwordResetCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code. Please try again.'
            });
        }

        // Code is valid - don't clear it yet, we need it for the reset step
        res.json({
            success: true,
            message: 'Reset code verified successfully.'
        });
    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.',
            error: error.message
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('Reset code must be 6 digits'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetExpires +password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request. Please try again.'
            });
        }

        // Check if reset code exists
        if (!user.passwordResetCode || !user.passwordResetExpires) {
            return res.status(400).json({
                success: false,
                message: 'No reset code found. Please request a new one.'
            });
        }

        // Check if code expired
        if (user.passwordResetExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one.'
            });
        }

        // Check if code matches
        if (user.passwordResetCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code.'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        console.log('✅ Password reset successful for:', user.email);

        res.json({
            success: true,
            message: 'Password reset successful! You can now sign in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check for user (include password this time)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been disabled. Please contact support.'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for verification code.',
                requiresVerification: true,
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    whatsapp: user.whatsapp,
                    country: user.country,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                }
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                country: user.country,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            },
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                country: user.country,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters'),
    body('whatsapp')
        .optional()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Please provide a valid WhatsApp number'),
    body('country')
        .optional()
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, whatsapp, country } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (whatsapp) user.whatsapp = whatsapp;
        if (country) user.country = country;

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                whatsapp: updatedUser.whatsapp,
                country: updatedUser.country,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

export default router;