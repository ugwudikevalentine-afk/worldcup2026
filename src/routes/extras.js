import express from 'express';
import Extra from '../models/extra.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/extras
// @desc    Get all extras
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type, maxPrice } = req.query;

        let query = { isActive: true };

        if (type) {
            query.type = type;
        }
        if (maxPrice) {
            query.price = { $lte: parseInt(maxPrice) };
        }

        const extras = await Extra.find(query).sort({ type: 1, price: 1 });

        res.json({
            success: true,
            count: extras.length,
            extras
        });
    } catch (error) {
        console.error('Get extras error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching extras',
            error: error.message
        });
    }
});

// @route   GET /api/extras/:id
// @desc    Get single extra
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const extra = await Extra.findById(req.params.id);

        if (!extra) {
            return res.status(404).json({
                success: false,
                message: 'Extra not found'
            });
        }

        res.json({
            success: true,
            extra
        });
    } catch (error) {
        console.error('Get extra error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching extra',
            error: error.message
        });
    }
});

// @route   POST /api/extras
// @desc    Create new extra (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const extra = await Extra.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Extra created successfully',
            extra
        });
    } catch (error) {
        console.error('Create extra error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating extra',
            error: error.message
        });
    }
});

// @route   PUT /api/extras/:id
// @desc    Update extra (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!extra) {
            return res.status(404).json({
                success: false,
                message: 'Extra not found'
            });
        }

        res.json({
            success: true,
            message: 'Extra updated successfully',
            extra
        });
    } catch (error) {
        console.error('Update extra error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating extra',
            error: error.message
        });
    }
});

// @route   DELETE /api/extras/:id
// @desc    Delete extra (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndDelete(req.params.id);

        if (!extra) {
            return res.status(404).json({
                success: false,
                message: 'Extra not found'
            });
        }

        res.json({
            success: true,
            message: 'Extra deleted successfully'
        });
    } catch (error) {
        console.error('Delete extra error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting extra',
            error: error.message
        });
    }
});

export default router;