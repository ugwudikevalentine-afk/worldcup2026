import express from 'express';
import Payment from '../models/payment.js';
import Booking from '../models/booking.js';
import { protect, admin } from '../middleware/auth.js';
import { sendPaymentConfirmation } from '../utils/email.js';

const router = express.Router();

const PAYMENT_DETAILS = {
    cashapp: {
        name: 'CashApp',
        handle: '$LawnmowerMan25',
        instructions: 'Send payment to $LawnmowerMan25 on CashApp. Include your booking reference in the note.',
        available: true
    },
    bitcoin: {
        name: 'Bitcoin (BTC)',
        address: 'bc1qrrdpy7axrhfktt2xm2etgddrlapxvpum7me9mn',
        network: 'Bitcoin',
        memo: 'Not required',
        instructions: 'Send exact BTC amount to the address above. No memo required.',
        available: true
    },
    usdt_trc20: {
        name: 'USDT (TRC20)',
        address: 'TPk5swCGr8NyRLMED11CG4R8EnAEpHu7Pi',
        network: 'TRC20',
        memo: 'Not required',
        instructions: 'Send exact USDT amount on TRC20 network. No memo required.',
        available: true
    },
    bank_sofi: {
        name: 'Bank Transfer (SoFi)',
        bankName: 'SoFi Bank',
        accountName: 'Patricia Gray',
        routingNumber: '031101334',
        accountNumber: '411057596092',
        instructions: 'Transfer exact amount to SoFi bank account.',
        available: false,
        unavailableMessage: 'Bank transfer is currently down. Please use another payment method.'
    },
    bank_chime: {
        name: 'Bank Transfer (Chime)',
        bankName: 'Chime Bank',
        accountName: 'Patricia Gray',
        routingNumber: '103100195',
        accountNumber: '346895145728517',
        instructions: 'Transfer exact amount to Chime bank account.',
        available: false,
        unavailableMessage: 'Bank transfer is currently down. Please use another payment method.'
    }
};

router.get('/methods', (req, res) => {
    res.json({
        success: true,
        methods: PAYMENT_DETAILS
    });
});

router.post('/submit', protect, async (req, res) => {
    try {
        const { bookingId, paymentMethod, transactionId, proofImage } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const method = PAYMENT_DETAILS[paymentMethod];
        if (!method) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        if (!method.available) {
            return res.status(400).json({
                success: false,
                message: method.unavailableMessage || 'This payment method is currently unavailable'
            });
        }

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

        const payment = await Payment.create({
            booking: bookingId,
            user: req.user._id,
            paymentMethod,
            amount: booking.totalPrice,
            transactionId,
            proofImage,
            status: 'submitted',
            submittedAt: new Date()
        });

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
        res.status(500).json({ success: false, message: 'Error submitting payment', error: error.message });
    }
});

router.get('/my-payments', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('booking', 'itemName bookingReference totalPrice bookingType')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
});

router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const payments = await Payment.find(query)
            .populate('user', 'name email whatsapp')
            .populate('booking', 'itemName bookingReference totalPrice bookingType')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error('Admin get payments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
});

router.put('/admin/:id/approve', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.status = 'approved';
        payment.adminNotes = adminNotes || '';
        payment.reviewedAt = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.booking._id, {
            paymentStatus: 'paid',
            status: 'confirmed'
        });

        try {
            await sendPaymentConfirmation(payment.user, payment.booking, payment);
            console.log('✅ Payment approval email sent');
        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        res.json({ success: true, message: 'Payment approved!', payment });
    } catch (error) {
        console.error('Approve payment error:', error);
        res.status(500).json({ success: false, message: 'Error approving payment', error: error.message });
    }
});

router.put('/admin/:id/reject', protect, admin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('booking');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.status = 'rejected';
        payment.adminNotes = adminNotes || '';
        payment.reviewedAt = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.booking._id, {
            paymentStatus: 'failed'
        });

        res.json({ success: true, message: 'Payment rejected.', payment });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({ success: false, message: 'Error rejecting payment', error: error.message });
    }
});

export default router;