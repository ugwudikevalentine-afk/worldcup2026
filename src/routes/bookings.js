import express from 'express';
import Booking from '../models/booking.js';
import Match from '../models/match.js';
import { protect } from '../middleware/auth.js';
import { sendBookingConfirmation } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            bookingType,
            match,
            ticketType,
            quantity,
            itemName,
            itemDetails,
            pricePerUnit,
            eventDate
        } = req.body;

        // Validate required fields
        if (!bookingType || !itemName || !pricePerUnit) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bookingType, itemName, pricePerUnit'
            });
        }

        // If booking a ticket, verify match exists and has availability
        if (bookingType === 'ticket' && match) {
            const matchData = await Match.findById(match);
            
            if (!matchData) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            const qty = quantity || 1;

            if (matchData.tickets_available < qty) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough tickets available. Only ${matchData.tickets_available} left.`
                });
            }

            // Reduce available tickets
            matchData.tickets_available -= qty;
            await matchData.save();
        }

        // Calculate total price
        const qty = quantity || 1;
        const total = qty * pricePerUnit;

        // Create booking
        const booking = await Booking.create({
            user: req.user._id,
            bookingType,
            match,
            ticketType,
            quantity: qty,
            itemName,
            itemDetails,
            pricePerUnit,
            totalPrice: total,
            eventDate
        });

        // Populate match details if ticket booking
        const populatedBooking = await Booking.findById(booking._id)
            .populate('match', 'team1 team2 date time stadium city')
            .populate('user', 'name email');

        // Send booking confirmation email
        try {
            await sendBookingConfirmation(req.user, populatedBooking);
            console.log('✅ Booking confirmation email sent to:', req.user.email);
        } catch (emailError) {
            console.error('❌ Booking email failed:', emailError.message);
            // Continue - booking still successful
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: populatedBooking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, bookingType } = req.query;

        let query = { user: req.user._id };

        if (status) {
            query.status = status;
        }
        if (bookingType) {
            query.bookingType = bookingType;
        }

        const bookings = await Booking.find(query)
            .populate('match', 'team1 team2 date time stadium city')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('match', 'team1 team2 date time stadium city')
            .populate('user', 'name email whatsapp');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking belongs to user (unless admin)
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking'
            });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Check if already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // If ticket booking, restore availability
        if (booking.bookingType === 'ticket' && booking.match) {
            const match = await Match.findById(booking.match);
            if (match) {
                match.tickets_available += booking.quantity;
                await match.save();
            }
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
});

export default router;