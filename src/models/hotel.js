import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hotel name is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    country: {
        type: String,
        default: 'USA',
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 4
    },
    price_per_night: {
        type: Number,
        required: [true, 'Price per night is required'],
        min: 0
    },
    distance_to_stadium: {
        type: String,
        default: '10 km'
    },
    rooms: {
        type: Number,
        default: 100,
        min: 0
    },
    amenities: [{
        type: String
    }],
    image: {
        type: String,
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
hotelSchema.index({ city: 1, price_per_night: 1 });
hotelSchema.index({ isActive: 1 });

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;