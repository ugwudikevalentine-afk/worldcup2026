import express from 'express';
import User from '../models/user.js';
import Booking from '../models/booking.js';
import Match from '../models/match.js';
import Hotel from '../models/hotel.js';
import Flight from '../models/flight.js';
import Extra from '../models/extra.js';
import Contact from '../models/contact.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin access
router.use(protect, admin);

// ===== DASHBOARD STATS =====
// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
        const totalMatches = await Match.countDocuments();
        const totalHotels = await Hotel.countDocuments();
        const totalFlights = await Flight.countDocuments();
        const totalExtras = await Extra.countDocuments();
        const totalContacts = await Contact.countDocuments({ status: 'new' });

        // Calculate total revenue
        const revenueResult = await Booking.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Recent bookings
        const recentBookings = await Booking.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent users
        const recentUsers = await User.find()
            .select('name email createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                users: totalUsers,
                bookings: {
                    total: totalBookings,
                    pending: pendingBookings,
                    confirmed: confirmedBookings,
                    cancelled: cancelledBookings
                },
                matches: totalMatches,
                hotels: totalHotels,
                flights: totalFlights,
                extras: totalExtras,
                contacts: totalContacts,
                revenue: totalRevenue
            },
            recentBookings,
            recentUsers
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admin stats',
            error: error.message
        });
    }
});

// ===== USERS MANAGEMENT =====
// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (role, status)
// @access  Private/Admin
router.put('/users/:id', async (req, res) => {
    try {
        const { role, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// ===== BOOKINGS MANAGEMENT =====
// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private/Admin
router.get('/bookings', async (req, res) => {
    try {
        const { status, bookingType } = req.query;

        let query = {};
        if (status) query.status = status;
        if (bookingType) query.bookingType = bookingType;

        const bookings = await Booking.find(query)
            .populate('user', 'name email whatsapp')
            .populate('match', 'team1 team2 date stadium')
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

// @route   PUT /api/admin/bookings/:id
// @desc    Update booking status
// @access  Private/Admin
router.put('/bookings/:id', async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (status) booking.status = status;
        if (paymentStatus) booking.paymentStatus = paymentStatus;

        const updatedBooking = await booking.save();

        res.json({
            success: true,
            message: 'Booking updated successfully',
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
});

// ===== MATCHES MANAGEMENT =====
// @route   POST /api/admin/matches
// @desc    Create new match
// @access  Private/Admin
router.post('/matches', async (req, res) => {
    try {
        const match = await Match.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Match created successfully',
            match
        });
    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating match',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/matches/:id
// @desc    Update match
// @access  Private/Admin
router.put('/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        res.json({
            success: true,
            message: 'Match updated successfully',
            match
        });
    } catch (error) {
        console.error('Update match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating match',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/matches/:id
// @desc    Delete match
// @access  Private/Admin
router.delete('/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        res.json({
            success: true,
            message: 'Match deleted successfully'
        });
    } catch (error) {
        console.error('Delete match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting match',
            error: error.message
        });
    }
});

// ===== HOTELS MANAGEMENT =====
// @route   POST /api/admin/hotels
// @desc    Create new hotel
// @access  Private/Admin
router.post('/hotels', async (req, res) => {
    try {
        const hotel = await Hotel.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Hotel created successfully',
            hotel
        });
    } catch (error) {
        console.error('Create hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating hotel',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/hotels/:id
// @desc    Update hotel
// @access  Private/Admin
router.put('/hotels/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            message: 'Hotel updated successfully',
            hotel
        });
    } catch (error) {
        console.error('Update hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating hotel',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/hotels/:id
// @desc    Delete hotel
// @access  Private/Admin
router.delete('/hotels/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            message: 'Hotel deleted successfully'
        });
    } catch (error) {
        console.error('Delete hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting hotel',
            error: error.message
        });
    }
});

// ===== FLIGHTS MANAGEMENT =====
// @route   POST /api/admin/flights
// @desc    Create new flight
// @access  Private/Admin
router.post('/flights', async (req, res) => {
    try {
        const flight = await Flight.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Flight created successfully',
            flight
        });
    } catch (error) {
        console.error('Create flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating flight',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/flights/:id
// @desc    Update flight
// @access  Private/Admin
router.put('/flights/:id', async (req, res) => {
    try {
        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight updated successfully',
            flight
        });
    } catch (error) {
        console.error('Update flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating flight',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/flights/:id
// @desc    Delete flight
// @access  Private/Admin
router.delete('/flights/:id', async (req, res) => {
    try {
        const flight = await Flight.findByIdAndDelete(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight deleted successfully'
        });
    } catch (error) {
        console.error('Delete flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting flight',
            error: error.message
        });
    }
});

// ===== CONTACTS MANAGEMENT =====
// @route   GET /api/admin/contacts
// @desc    Get all contacts
// @access  Private/Admin
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: contacts.length,
            contacts
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/contacts/:id
// @desc    Update contact status
// @access  Private/Admin
router.put('/contacts/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        if (status) contact.status = status;
        if (notes) contact.notes = notes;
        if (status === 'resolved' || status === 'in_progress') {
            contact.respondedAt = new Date();
        }

        const updatedContact = await contact.save();

        res.json({
            success: true,
            message: 'Contact updated successfully',
            contact: updatedContact
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact',
            error: error.message
        });
    }
});

export default router;