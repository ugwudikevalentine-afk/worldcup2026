import express from 'express';

// Import routes
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import bookingRoutes from './routes/bookings.js';
import hotelRoutes from './routes/hotels.js';
import flightRoutes from './routes/flights.js';
import extraRoutes from './routes/extras.js';
import contactRoutes from './routes/contacts.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';

const router = express.Router();

// ===== ROUTE MOUNTING =====
router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/hotels', hotelRoutes);
router.use('/flights', flightRoutes);
router.use('/extras', extraRoutes);
router.use('/contact', contactRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);

// ===== CONFIG ENDPOINT =====
router.get('/config', (req, res) => {
    res.json({
        success: true,
        worldCupStartDate: '2026-06-11T19:00:00Z',
        tournamentName: 'FIFA World Cup 2026',
        hostCountries: ['USA', 'Canada', 'Mexico'],
        totalTeams: 48,
        contact: {
            email: process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com',
            whatsapp: process.env.WHATSAPP_PRIMARY || '+16154145082',
            whatsappSecondary: process.env.WHATSAPP_SECONDARY || '+17274584599'
        }
    });
});

// ===== NEXT MATCH =====
router.get('/next-match', async (req, res) => {
    try {
        const Match = (await import('./models/match.js')).default;
        
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
                datetime: matchDateTime.toISOString()
            }
        });
    } catch (error) {
        console.error('Next match error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching next match'
        });
    }
});

// ===== TICKETS ENDPOINT =====
router.get('/tickets', async (req, res) => {
    try {
        const Match = (await import('./models/match.js')).default;
        
        const matches = await Match.find({ status: 'upcoming' });
        
        const tickets = matches.map(match => ({
            match_id: match._id,
            match: `${match.team1} vs ${match.team2}`,
            date: match.date,
            stadium: match.stadium,
            prices: match.ticket_prices,
            available: match.tickets_available
        }));

        res.json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        console.error('Tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tickets'
        });
    }
});

// ===== PARKING ENDPOINT =====
router.get('/parking', async (req, res) => {
    try {
        const Extra = (await import('./models/extra.js')).default;
        
        const parking = await Extra.find({ type: 'parking', isActive: true });
        
        res.json({
            success: true,
            count: parking.length,
            parking
        });
    } catch (error) {
        console.error('Parking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching parking'
        });
    }
});

// ===== COUNTRIES ENDPOINT =====
router.get('/countries', (req, res) => {
    const countries = [
        { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸' },
        { code: 'GB', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        { code: 'US', name: 'USA', flag: '🇺🇸' },
        { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹' },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'KR', name: 'South Korea', flag: '🇰🇷' }
    ];
    res.json({
        success: true,
        count: countries.length,
        countries
    });
});

// ===== FAQ ENDPOINT =====
router.get('/faq', (req, res) => {
    const faqs = [
        {
            id: 1,
            question: 'How do I book tickets?',
            answer: 'Click on the Tickets section, select your match, choose your seats, and complete payment.'
        },
        {
            id: 2,
            question: 'What payment methods do you accept?',
            answer: 'We accept CashApp, cryptocurrency payments (Bitcoin, USDT), and bank transfers.'
        },
        {
            id: 3,
            question: 'Can I cancel my booking?',
            answer: 'Yes, you can cancel up to 7 days before the match for a full refund.'
        },
        {
            id: 4,
            question: 'Do you offer group discounts?',
            answer: 'Yes! Groups of 10+ get 15% discount. Contact our support team via WhatsApp.'
        },
        {
            id: 5,
            question: 'How do I track my booking?',
            answer: 'Log into your account to view all bookings, tickets, and reservations.'
        },
        {
            id: 6,
            question: 'How can I contact support?',
            answer: 'Contact us via WhatsApp at +1 (615) 414-5082 or email at worldcupbookinghub@gmail.com'
        }
    ];
    res.json({
        success: true,
        count: faqs.length,
        faqs
    });
});

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;