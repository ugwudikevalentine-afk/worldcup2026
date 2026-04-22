import express from 'express';
import Hotel from '../models/hotel.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/hotels
// @desc    Get all hotels
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { city, minPrice, maxPrice, rating } = req.query;

        let query = { isActive: true };

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }
        if (minPrice) {
            query.price_per_night = { ...query.price_per_night, $gte: parseInt(minPrice) };
        }
        if (maxPrice) {
            query.price_per_night = { ...query.price_per_night, $lte: parseInt(maxPrice) };
        }
        if (rating) {
            query.rating = { $gte: parseFloat(rating) };
        }

        const hotels = await Hotel.find(query).sort({ price_per_night: 1 });

        res.json({
            success: true,
            count: hotels.length,
            hotels
        });
    } catch (error) {
        console.error('Get hotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hotels',
            error: error.message
        });
    }
});

// @route   GET /api/hotels/:id
// @desc    Get single hotel
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            hotel
        });
    } catch (error) {
        console.error('Get hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hotel',
            error: error.message
        });
    }
});

// @route   POST /api/hotels
// @desc    Create new hotel (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
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

// @route   PUT /api/hotels/:id
// @desc    Update hotel (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
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

// @route   DELETE /api/hotels/:id
// @desc    Delete hotel (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
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

export default router;