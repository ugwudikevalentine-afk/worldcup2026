import express from 'express';
import Payment from '../models/payment.js';
import Booking from '../models/booking.js';
import { protect, admin } from '../middleware/auth.js';
import { sendPaymentConfirmation } from '../utils/email.js';

const router = express.Router();

const PAYMENT_DETAILS = {
    cashapp: {
        name: 'CashApp',
        handle: process.env.CASHAPP_HANDLE || '$LawnmowerMan25',
        instructions: 'Send payment to CashApp handle. Include booking reference in note.',
        available: true
    },
    bitcoin: {
        name: 'Bitcoin (BTC)',
        address: process.env.BITCOIN_ADDRESS || 'bc1qrrdpy7axrhfktt2xm2etgddrlapxvpum7me9mn',
        network: 'Bitcoin',
        memo: 'Not required',
        instructions: 'Send exact BTC amount. No memo required.',
        available: true
    },
    usdt_trc20: {
        name: 'USDT (TRC20)',
        address: process.env.USDT_TRC20_ADDRESS || 'TPk5swCGr8NyRLMED11CG4R8EnAEpHu7Pi',
        network: 'TRC20',
        memo: 'Not required',
        instructions: 'Send exact USDT amount on TRC20 network. No memo required.',
        available: true
    },
    bank_sofi: {
        name: 'Bank Transfer (SoFi)',
        bankName: process.env.BANK1_NAME || 'SoFi Bank',
        accountName: process.env.BANK1_ACCOUNT_NAME || 'Patricia Gray',
        routingNumber: process.env.BANK1_ROUTING || '031101334',
        accountNumber: process.env.BANK1_ACCOUNT || '411057596092',
        instructions: 'Transfer exact amount to SoFi bank account.',
        available: false,
        unavailableMessage: 'Bank transfer is currently down. Please use another payment method.'
    },
    bank_chime: {
        name: 'Bank Transfer (Chime)',
        bankName: process.env.BANK2_NAME || 'Chime Bank',
        accountName: process.env.BANK2_ACCOUNT_NAME || 'Patricia Gray',
        routingNumber: process.env.BANK2_ROUTING || '103100195',
        accountNumber: process.env.BANK2_ACCOUNT || '346895145728517',
        instructions: 'Transfer exact amount to Chime bank account.',
        available: false,
        unavailableMessage: 'Bank transfer is currently down. Please use another payment method.'
    }
};

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', (req, res) => {
    res.json({
        success: true,
        methods: PAYMENT_DETAILS
    });
});

// @route   POST /api/payments/submit
// @desc    Submit payment proof for one booking
// @access  Private
router.post('/submit', protect, async (req, res) => {
    try {
        const {
            bookingId,
            paymentMethod,
            transactionId,
            proofImage
        } = req.body;

        // Validate booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Validate payment method
        const method = PAYMENT_DETAILS[paymentMethod];
        if (!method) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        if (!method.available) {
            return res.status(400).json({
                success: false,
                message: method.unavailableMessage || 'This payment method is currently unavailable'
            });
        }

        // Check if payment already submitted
        const existingPayment = await Payment.findOne({
            booking: bookingId,
            status: { $in: ['pending', 'submitted', 'approved'] }
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Payment already submitted for this booking'
            });
        }

        // Create payment
        const payment = await Payment.create({
            booking: bookingId,
            user: req.user._id,
            paymentMethod,
            amount: booking.totalPrice,
            transactionId: transactionId || null,
            proofImage: proofImage || null,
            status: 'submitted',
            submittedAt: new Date()
        });

        // Update booking payment status
        booking.paymentStatus = 'pending';
        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Payment proof submitted! Our team will verify within 24 hours.',
            payment: {
                _id: payment._id,
                paymentReference: payment.paymentReference,
                paymentMethod: payment.paymentMethod,
                amount: payment.amount,
                status: payment.status,
                submittedAt: payment.submittedAt
            }
        });
    } catch (error) {
        console.error('Submit payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting payment',
            error: error.message
        });
    }
});

// @route   GET /api/payments/my-payments
// @desc    Get user payments
// @access  Private
router.get('/my-payments', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('booking', 'itemName bookingReference totalPrice bookingType status')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// @route   GET /api/payments/admin/all
// @desc    Get all payments (Admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') query.status = status;

        const payments = await Payment.find(query)
            .populate('user', 'name email whatsapp country')
            .populate('booking', 'itemName bookingReference totalPrice bookingType status paymentStatus')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        console.error('Admin get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// @route   PUT /api/payments/admin/:id/approve
// @desc    Approve payment (Admin)
// @access  Private/Admin
router.put('/admin/:id/approve', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Update payment
        payment.status = 'approved';
        payment.adminNotes = adminNotes || '';
        payment.reviewedAt = new Date();
        await payment.save();

        // Update booking to confirmed + paid
        await Booking.findByIdAndUpdate(payment.booking._id, {
            paymentStatus: 'paid',
            status: 'confirmed'
        });

        // Send confirmation email
        try {
            await sendPaymentConfirmation(
                payment.user,
                payment.booking,
                payment
            );
            console.log('✅ Payment approval email sent to:', payment.user.email);
        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Payment approved! Booking confirmed.',
            payment
        });
    } catch (error) {
        console.error('Approve payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving payment',
            error: error.message
        });
    }
});

// @route   PUT /api/payments/admin/:id/reject
// @desc    Reject payment (Admin)
// @access  Private/Admin
router.put('/admin/:id/reject', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Update payment
        payment.status = 'rejected';
        payment.adminNotes = adminNotes || '';
        payment.reviewedAt = new Date();
        await payment.save();

        // Update booking payment status
        await Booking.findByIdAndUpdate(payment.booking._id, {
            paymentStatus: 'failed'
        });

        res.json({
            success: true,
            message: 'Payment rejected.',
            payment
        });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting payment',
            error: error.message
        });
    }
});

export default router;