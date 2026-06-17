import express from 'express';
import Match from '../models/match.js';
import Flight from '../models/flight.js';
import { protect, admin } from '../middleware/auth.js';
import sportsDbService from '../utils/sportsDbService.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// @route   GET /api/matches
// @desc    Get all matches (with filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { status, city, date, country, stage, team, upcoming, limit } = req.query;

        let query = {};

        if (status) query.status = status;
        if (city) query.city = { $regex: city, $options: 'i' };
        if (date) query.date = date;
        if (country) query.hostCountry = country;
        if (stage) query.stage = stage;
        if (team) {
            query.$or = [
                { team1: { $regex: team, $options: 'i' } },
                { team2: { $regex: team, $options: 'i' } }
            ];
        }
        if (upcoming === 'true') {
            query.date = { $gte: new Date().toISOString().split('T')[0] };
            query.status = 'upcoming';
        }

        let matchQuery = Match.find(query).sort({ date: 1, time: 1 });

        if (limit) {
            matchQuery = matchQuery.limit(parseInt(limit));
        }

        const matches = await matchQuery;

        res.json({
            success: true,
            count: matches.length,
            matches
        });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching matches',
            error: error.message
        });
    }
});

// @route   GET /api/matches/next
// @desc    Get next upcoming match
// @access  Public
router.get('/next', async (req, res) => {
    try {
        const now = new Date();

        const matches = await Match.find({
            status: 'upcoming'
        }).sort({ date: 1, time: 1 });

        const futureMatches = matches.filter(match => {
            const matchDateTime = new Date(`${match.date}T${match.time}:00Z`);
            return matchDateTime > now;
        });

        if (futureMatches.length === 0) {
            return res.json({
                success: true,
                message: 'No upcoming matches found'
            });
        }

        const nextMatch = futureMatches[0];
        const matchDateTime = new Date(`${nextMatch.date}T${nextMatch.time}:00Z`);

        res.json({
            success: true,
            match: {
                id: nextMatch._id,
                team1: nextMatch.team1,
                team2: nextMatch.team2,
                stadium: nextMatch.stadium,
                city: nextMatch.city,
                date: nextMatch.date,
                time: nextMatch.time,
                datetime: matchDateTime.toISOString(),
                stage: nextMatch.stage,
                group: nextMatch.group,
                hostCountry: nextMatch.hostCountry,
                team1Badge: nextMatch.team1Badge,
                team2Badge: nextMatch.team2Badge,
                tickets_available: nextMatch.tickets_available
            }
        });
    } catch (error) {
        console.error('Get next match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching next match',
            error: error.message
        });
    }
});

// @route   GET /api/matches/live
// @desc    Get currently live matches
// @access  Public
router.get('/live', async (req, res) => {
    try {
        const matches = await Match.find({ status: 'ongoing' })
            .sort({ date: 1, time: 1 });

        res.json({
            success: true,
            count: matches.length,
            matches
        });
    } catch (error) {
        console.error('Get live matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching live matches',
            error: error.message
        });
    }
});

// @route   GET /api/matches/country/:country
// @desc    Get matches by host country
// @access  Public
router.get('/country/:country', async (req, res) => {
    try {
        const matches = await Match.find({
            hostCountry: req.params.country
        }).sort({ date: 1, time: 1 });

        res.json({
            success: true,
            count: matches.length,
            country: req.params.country,
            matches
        });
    } catch (error) {
        console.error('Get country matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching matches',
            error: error.message
        });
    }
});

// @route   GET /api/matches/:id/countdown
// @desc    Get countdown timer data for a match
// @access  Public
router.get('/:id/countdown', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        const matchDateTime = new Date(`${match.date}T${match.time}:00Z`);
        const now = new Date();
        const diff = matchDateTime - now;

        // Match already started or finished
        if (diff <= 0) {
            return res.json({
                success: true,
                match: `${match.team1} vs ${match.team2}`,
                status: match.status,
                countdown: null,
                message: match.status === 'ongoing'
                    ? `🔴 LIVE! ${match.score1 ?? 0} - ${match.score2 ?? 0}`
                    : 'Match has ended'
            });
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        res.json({
            success: true,
            match: `${match.team1} vs ${match.team2}`,
            status: match.status,
            matchDateTime: matchDateTime.toISOString(),
            countdown: { days, hours, minutes, seconds },
            totalMilliseconds: diff
        });
    } catch (error) {
        console.error('Countdown error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating countdown',
            error: error.message
        });
    }
});

// @route   GET /api/matches/:id
// @desc    Get single match with linked flights/hotels
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('linkedFlights')
            .populate('linkedHotels');

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        res.json({
            success: true,
            match
        });
    } catch (error) {
        console.error('Get match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching match',
            error: error.message
        });
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @route   POST /api/matches
// @desc    Create match manually (Admin)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const match = await Match.create({
            ...req.body,
            source: 'manual'
        });

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

// @route   PUT /api/matches/:id
// @desc    Update match (Admin)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastSynced: new Date() },
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

// @route   DELETE /api/matches/:id
// @desc    Delete match (Admin)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
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

// ==========================================
// THESPORTSDB SYNC ROUTES (Admin)
// ==========================================

// @route   POST /api/matches/sync/thesportsdb
// @desc    Sync matches from TheSportsDB API
// @access  Private/Admin
router.post('/sync/espn', protect, admin, async (req, res) => {
    try {
        console.log('🔄 Manual sync triggered by admin...');

        const events = await sportsDbService.getWorldCupEvents();

        if (!events || events.length === 0) {
            return res.json({
                success: true,
                message: 'No World Cup 2026 events found on TheSportsDB yet. Data may not be available until closer to the tournament.',
                synced: 0,
                updated: 0
            });
        }

        let synced = 0;
        let updated = 0;
        let errors = 0;

        for (const event of events) {
            try {
                const matchData = sportsDbService.convertToOurFormat(event);

                // Check if we already have this match
                const existing = await Match.findOne({ externalId: matchData.externalId });

                if (existing) {
                    // Update only API-sourced fields, keep our custom fields
                    await Match.findByIdAndUpdate(existing._id, {
                        team1: matchData.team1,
                        team2: matchData.team2,
                        score1: matchData.score1,
                        score2: matchData.score2,
                        date: matchData.date,
                        time: matchData.time,
                        stadium: matchData.stadium,
                        city: matchData.city,
                        hostCountry: matchData.hostCountry,
                        stage: matchData.stage,
                        group: matchData.group,
                        status: matchData.status,
                        team1Badge: matchData.team1Badge,
                        team2Badge: matchData.team2Badge,
                        thumbnail: matchData.thumbnail,
                        lastSynced: new Date()
                    });
                    updated++;
                } else {
                    // Create new match from API
                    await Match.create(matchData);
                    synced++;
                }
            } catch (err) {
                console.error(`Error syncing event ${event.idEvent}:`, err.message);
                errors++;
            }
        }

        console.log(`✅ Sync complete: ${synced} new, ${updated} updated, ${errors} errors`);

        res.json({
            success: true,
            message: `Sync complete!`,
            synced,
            updated,
            errors,
            totalFromAPI: events.length
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed',
            error: error.message
        });
    }
});

// @route   GET /api/matches/sync/status
// @desc    Check last sync status
// @access  Private/Admin
router.get('/sync/status', protect, admin, async (req, res) => {
    try {
     const lastSynced = await Match.findOne({ source: 'espn' })
            .sort({ lastSynced: -1 })
            .select('lastSynced');

        const totalMatches = await Match.countDocuments();
        const apiMatches = await Match.countDocuments({ source: 'thesportsdb' });
        const manualMatches = await Match.countDocuments({ source: 'manual' });
        const upcomingCount = await Match.countDocuments({ status: 'upcoming' });
        const liveCount = await Match.countDocuments({ status: 'ongoing' });
        const completedCount = await Match.countDocuments({ status: 'completed' });

        res.json({
            success: true,
            lastSynced: lastSynced?.lastSynced || null,
            counts: {
                total: totalMatches,
                fromAPI: apiMatches,
                manual: manualMatches,
                upcoming: upcomingCount,
                live: liveCount,
                completed: completedCount
            }
        });
    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sync status',
            error: error.message
        });
    }
});

// ==========================================
// MATCH-FLIGHT/HOTEL LINKING (Admin)
// ==========================================

// @route   POST /api/matches/:id/link
// @desc    Link flights and hotels to a match
// @access  Private/Admin
router.post('/:id/link', protect, admin, async (req, res) => {
    try {
        const { flightIds, hotelIds } = req.body;
        const update = {};

        if (flightIds) update.linkedFlights = flightIds;
        if (hotelIds) update.linkedHotels = hotelIds;

        const match = await Match.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).populate('linkedFlights').populate('linkedHotels');

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        res.json({
            success: true,
            message: 'Match linked successfully',
            match
        });
    } catch (error) {
        console.error('Link error:', error);
        res.status(500).json({
            success: false,
            message: 'Error linking match',
            error: error.message
        });
    }
});

// @route   GET /api/matches/:id/suggestions
// @desc    Get suggested flights/hotels for a match (by city)
// @access  Private/Admin
router.get('/:id/suggestions', protect, admin, async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Find flights arriving in the match city or country
        const suggestedFlights = await Flight.find({
            isActive: true,
            $or: [
                { arrival: { $regex: match.city, $options: 'i' } },
                { arrivalCountry: { $regex: match.hostCountry || '', $options: 'i' } }
            ]
        }).limit(10);

        res.json({
            success: true,
            match: `${match.team1} vs ${match.team2}`,
            city: match.city,
            country: match.hostCountry,
            suggestedFlights,
            suggestedHotels: [] // Will populate when Hotel model is used
        });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching suggestions',
            error: error.message
        });
    }
});

export default router;