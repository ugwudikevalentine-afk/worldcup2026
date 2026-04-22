import mongoose from 'mongoose';

const extraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Extra name is required'],
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['parking', 'car_rental', 'tour', 'experience', 'transport', 'merchandise'],
        default: 'experience'
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    priceType: {
        type: String,
        enum: ['per_day', 'per_person', 'per_item', 'flat'],
        default: 'per_item'
    },
    duration: {
        type: String,
        default: null
    },
    location: {
        type: String,
        trim: true
    },
    available: {
        type: Number,
        default: 100,
        min: 0
    },
    image: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
extraSchema.index({ type: 1, isActive: 1 });

const Extra = mongoose.model('Extra', extraSchema);

export default Extra;