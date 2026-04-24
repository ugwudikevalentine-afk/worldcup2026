import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    // Single booking (backward compatible)
booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
},
// Multiple bookings (cart checkout)
bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
}],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cashapp', 'bitcoin', 'usdt_trc20', 'bank_sofi', 'bank_chime'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    proofImage: {
        type: String,
        default: null
    },
    transactionId: {
        type: String,
        default: null,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    submittedAt: {
        type: Date,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    paymentReference: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

paymentSchema.pre('validate', function(next) {
    if (!this.paymentReference) {
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.paymentReference = `PAY-${timestamp}-${random}`;
    }
    next();
});

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentReference: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;