import express from 'express';
import Contact from '../models/contact.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Create contact submission
        const contact = await Contact.create({
            name,
            email,
            subject: subject || 'General Inquiry',
            message,
            phone
        });

        // Log to console (for now)
        console.log('📧 New contact form submission:');
        console.log(`   ID: ${contact._id}`);
        console.log(`   Name: ${name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Subject: ${subject || 'General Inquiry'}`);
        console.log(`   Message: ${message.substring(0, 50)}...`);

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will respond within 24 hours.',
            contact: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                subject: contact.subject
            },
            supportInfo: {
                whatsapp: process.env.WHATSAPP_PRIMARY,
                email: process.env.CONTACT_EMAIL,
                responseTime: '24 hours'
            }
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting contact form',
            error: error.message
        });
    }
});

// @route   GET /api/contact
// @desc    Get all contact submissions (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const { status, priority } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }
        if (priority) {
            query.priority = priority;
        }

        const contacts = await Contact.find(query)
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
            message: 'Error fetching contact submissions',
            error: error.message
        });
    }
});

// @route   GET /api/contact/:id
// @desc    Get single contact submission
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact submission not found'
            });
        }

        res.json({
            success: true,
            contact
        });
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact submission',
            error: error.message
        });
    }
});

// @route   PUT /api/contact/:id
// @desc    Update contact submission (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { status, priority, notes } = req.body;

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact submission not found'
            });
        }

        // Update fields
        if (status) contact.status = status;
        if (priority) contact.priority = priority;
        if (notes !== undefined) contact.notes = notes;

        // Mark as responded if status changed to in_progress or resolved
        if (status === 'in_progress' || status === 'resolved') {
            if (!contact.respondedAt) {
                contact.respondedAt = new Date();
            }
        }

        const updatedContact = await contact.save();

        res.json({
            success: true,
            message: 'Contact submission updated',
            contact: updatedContact
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact submission',
            error: error.message
        });
    }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact submission (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact submission not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact submission deleted'
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact submission',
            error: error.message
        });
    }
});

export default router;