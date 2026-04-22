import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingType: {
        type: String,
        enum: ['ticket', 'hotel', 'flight', 'parking', 'extra'],
        required: true
    },
    // For ticket bookings
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        default: null
    },
    ticketType: {
        type: String,
        enum: ['vip', 'premium', 'regular', null],
        default: null
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    // Generic booking details
    itemName: {
        type: String,
        required: true
    },
    itemDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Pricing
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        default: null
    },
    // Reference number - AUTO GENERATED
    bookingReference: {
        type: String,
        unique: true
        // NOT required - we generate it automatically
    },
    // Dates
    bookingDate: {
        type: Date,
        default: Date.now
    },
    eventDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Generate booking reference BEFORE validation
bookingSchema.pre('validate', function(next) {
    if (!this.bookingReference) {
        const prefix = this.bookingType ? this.bookingType.substring(0, 3).toUpperCase() : 'BOK';
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.bookingReference = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;