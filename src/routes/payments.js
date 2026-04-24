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

// @route GET /api/payments/methods
router.get('/methods', (req, res) => {
    res.json({ success: true, methods: PAYMENT_DETAILS });
});

// @route POST /api/payments/submit
// @desc Submit payment for one or multiple bookings
router.post('/submit', protect, async (req, res) => {
    try {
        const {
            bookingId,
            bookingIds,
            paymentMethod,
            transactionId,
            proofImage
        } = req.body;

        // Determine which bookings this payment covers
        let allBookingIds = [];
        if (bookingIds && bookingIds.length > 0) {
            allBookingIds = bookingIds;
        } else if (bookingId) {
            allBookingIds = [bookingId];
        } else {
            return res.status(400).json({
                success: false,
                message: 'No booking ID provided'
            });
        }

        // Validate all bookings exist and belong to user
        const bookings = await Booking.find({
            _id: { $in: allBookingIds },
            user: req.user._id
        });

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid bookings found'
            });
        }

        if (bookings.length !== allBookingIds.length) {
            return res.status(403).json({
                success: false,
                message: 'One or more bookings not found or not authorized'
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

        // Check if payment already exists for any of these bookings
        const existingPayment = await Payment.findOne({
            bookings: { $in: allBookingIds },
            status: { $in: ['pending', 'submitted', 'approved'] }
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Payment already submitted for one or more of these bookings'
            });
        }

        // Calculate total amount
        const totalAmount = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

        // Create ONE payment for all bookings
        const payment = await Payment.create({
            booking: allBookingIds[0],
            bookings: allBookingIds,
            user: req.user._id,
            paymentMethod,
            amount: totalAmount,
            transactionId: transactionId || null,
            proofImage: proofImage || null,
            status: 'submitted',
            submittedAt: new Date()
        });

        // Update all bookings payment status
        await Booking.updateMany(
            { _id: { $in: allBookingIds } },
            { paymentStatus: 'pending' }
        );

        res.status(201).json({
            success: true,
            message: `Payment submitted for ${bookings.length} booking(s)! Our team will verify within 24 hours.`,
            payment: {
                _id: payment._id,
                paymentReference: payment.paymentReference,
                paymentMethod: payment.paymentMethod,
                amount: payment.amount,
                bookingCount: bookings.length,
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

// @route GET /api/payments/my-payments
router.get('/my-payments', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('booking', 'itemName bookingReference totalPrice bookingType status')
            .populate('bookings', 'itemName bookingReference totalPrice bookingType status')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// @route GET /api/payments/admin/all
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') query.status = status;

        const payments = await Payment.find(query)
            .populate('user', 'name email whatsapp country')
            .populate('booking', 'itemName bookingReference totalPrice bookingType status paymentStatus')
            .populate('bookings', 'itemName bookingReference totalPrice bookingType status paymentStatus')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('Admin get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// @route PUT /api/payments/admin/:id/approve
router.put('/admin/:id/approve', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking')
            .populate('bookings');

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

        // Confirm ALL linked bookings
        const bookingIdsToUpdate = payment.bookings && payment.bookings.length > 0
            ? payment.bookings.map(b => b._id)
            : [payment.booking._id];

        await Booking.updateMany(
            { _id: { $in: bookingIdsToUpdate } },
            {
                paymentStatus: 'paid',
                status: 'confirmed'
            }
        );

        const confirmedCount = bookingIdsToUpdate.length;

        // Send email
        try {
            await sendPaymentConfirmation(
                payment.user,
                payment.booking || payment.bookings[0],
                payment
            );
            console.log('✅ Payment approval email sent');
        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        res.json({
            success: true,
            message: `Payment approved! ${confirmedCount} booking(s) confirmed.`,
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

// @route PUT /api/payments/admin/:id/reject
router.put('/admin/:id/reject', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking')
            .populate('bookings');

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

        // Update ALL linked bookings
        const bookingIdsToUpdate = payment.bookings && payment.bookings.length > 0
            ? payment.bookings.map(b => b._id)
            : [payment.booking._id];

        await Booking.updateMany(
            { _id: { $in: bookingIdsToUpdate } },
            { paymentStatus: 'failed' }
        );

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