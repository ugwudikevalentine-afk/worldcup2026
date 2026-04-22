import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    // ===== CORE MATCH INFO =====
    team1: {
        type: String,
        required: [true, 'Team 1 is required'],
        trim: true
    },
    team2: {
        type: String,
        required: [true, 'Team 2 is required'],
        trim: true
    },
    date: {
        type: String,
        required: [true, 'Match date is required']
    },
    time: {
        type: String,
        required: [true, 'Match time is required']
    },
    stadium: {
        type: String,
        required: [true, 'Stadium is required'],
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },

    // ===== NEW: SCORES (from TheSportsDB) =====
    score1: {
        type: Number,
        default: null
    },
    score2: {
        type: Number,
        default: null
    },

    // ===== NEW: TOURNAMENT INFO =====
    hostCountry: {
        type: String,
        enum: ['USA', 'Mexico', 'Canada'],
        default: 'USA'
    },
    stage: {
        type: String,
        enum: ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Third Place', 'Final'],
        default: 'Group Stage'
    },
    group: {
        type: String,
        default: null
    },

    // ===== TICKETS =====
    tickets_available: {
        type: Number,
        default: 0,
        min: 0
    },
    ticket_prices: {
        vip: { type: Number, default: 500 },
        premium: { type: Number, default: 300 },
        regular: { type: Number, default: 150 }
    },

    // ===== STATUS =====
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },

    // ===== NEW: TEAM BADGES (from TheSportsDB) =====
    team1Badge: {
        type: String,
        default: null
    },
    team2Badge: {
        type: String,
        default: null
    },
    thumbnail: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },

    // ===== NEW: API SYNC FIELDS =====
    externalId: {
        type: String,
        unique: true,
        sparse: true
    },
    source: {
        type: String,
        enum: ['manual', 'thesportsdb'],
        default: 'manual'
    },
    lastSynced: {
        type: Date,
        default: null
    },

    // ===== NEW: LINKING =====
    linkedFlights: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight'
    }],
    linkedHotels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel'
    }],

    // ===== NEW: NOTIFICATION TRACKING =====
    notifications: {
        dayBefore: { type: Boolean, default: false },
        hourBefore: { type: Boolean, default: false },
        matchStart: { type: Boolean, default: false }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
matchSchema.index({ date: 1, time: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ hostCountry: 1 });
matchSchema.index({ externalId: 1 });
matchSchema.index({ stage: 1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;