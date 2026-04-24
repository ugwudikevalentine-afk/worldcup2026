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

// ===== ONE TIME SEED ROUTE (DELETE AFTER USE) =====
router.post('/seed-database', async (req, res) => {
    try {
        const { seedKey } = req.body;

        // Secret key to prevent unauthorized access
        if (seedKey !== 'WORLDCUP2026SEED') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const Hotel = (await import('./models/hotel.js')).default;
        const Flight = (await import('./models/flight.js')).default;
        const Extra = (await import('./models/extra.js')).default;
        const Match = (await import('./models/match.js')).default;
        const User = (await import('./models/user.js')).default;

        // Clear hotels, flights, extras only
        await Hotel.deleteMany({});
        await Flight.deleteMany({});
        await Extra.deleteMany({});

        // 1 Hotel
        await Hotel.create({
            name: 'MetLife Stadium Hotel',
            city: 'East Rutherford',
            country: 'USA',
            address: '1 MetLife Stadium Dr, East Rutherford, NJ',
            rating: 4.5,
            price_per_night: 350,
            distance_to_stadium: '0.5 km',
            rooms: 200,
            amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Room Service'],
            description: 'Premium hotel located right next to MetLife Stadium.',
            isActive: true
        });

        // 1 Flight from Nigeria
        await Flight.create({
            airline: 'Air Peace',
            flightNumber: 'P47001',
            departure: 'Lagos',
            arrival: 'New York',
            departureCountry: 'Nigeria',
            arrivalCountry: 'United States',
            date: '2026-06-10',
            time: '23:00',
            duration: '12h 30m',
            price: 850,
            seats: 120,
            class: 'economy',
            isActive: true
        });

        // All 13 Extras
        const extras = [
            { name: 'Stadium Parking', type: 'parking', description: 'Official stadium parking lot with easy access to entrances', price: 50, priceType: 'per_day', location: 'Stadium Lot A', available: 500, isActive: true },
            { name: 'VIP Parking', type: 'parking', description: 'Premium parking with valet service and closest spots', price: 100, priceType: 'per_day', location: 'VIP Lot', available: 100, isActive: true },
            { name: 'Economy SUV Rental', type: 'car_rental', description: 'Spacious SUV perfect for families, seats 7', price: 120, priceType: 'per_day', location: 'Airport/Hotel Pickup', available: 50, isActive: true },
            { name: 'Luxury Sedan Rental', type: 'car_rental', description: 'Premium sedan with leather interior and GPS', price: 180, priceType: 'per_day', location: 'Airport/Hotel Pickup', available: 30, isActive: true },
            { name: 'Compact Car Rental', type: 'car_rental', description: 'Fuel-efficient compact car for city driving', price: 80, priceType: 'per_day', location: 'Airport/Hotel Pickup', available: 80, isActive: true },
            { name: 'Stadium Tour', type: 'tour', description: '2-hour behind-the-scenes tour including locker rooms and field access', price: 75, priceType: 'per_person', duration: '2 hours', location: 'Stadium Main Entrance', available: 200, isActive: true },
            { name: 'City Sightseeing Tour', type: 'tour', description: 'Full day guided tour of city highlights and landmarks', price: 95, priceType: 'per_person', duration: '6 hours', location: 'Hotel Pickup', available: 150, isActive: true },
            { name: 'Fan Experience Package', type: 'experience', description: 'Photo with World Cup trophy replica, official jersey, and VIP lounge access', price: 150, priceType: 'per_person', location: 'Fan Zone', available: 100, isActive: true },
            { name: 'Meet & Greet Package', type: 'experience', description: 'Meet former World Cup legends and get autographs', price: 250, priceType: 'per_person', location: 'VIP Area', available: 50, isActive: true },
            { name: 'Airport Shuttle', type: 'transport', description: 'Round-trip shuttle service from airport to hotel', price: 45, priceType: 'per_person', location: 'Airport', available: 500, isActive: true },
            { name: 'Match Day Shuttle', type: 'transport', description: 'Round-trip shuttle from hotel to stadium on match day', price: 25, priceType: 'per_person', location: 'Hotel Lobby', available: 300, isActive: true },
            { name: 'Official Team Jersey', type: 'merchandise', description: 'Authentic FIFA World Cup 2026 team jersey', price: 120, priceType: 'per_item', location: 'Official Store', available: 1000, isActive: true },
            { name: 'World Cup Souvenir Pack', type: 'merchandise', description: 'Includes scarf, cap, keychain, and mini ball', price: 65, priceType: 'per_item', location: 'Official Store', available: 500, isActive: true }
        ];
        await Extra.insertMany(extras);

        // Admin user
        const existingAdmin = await User.findOne({ email: 'admin@worldcupbookinghub.com' });
        if (!existingAdmin) {
            await User.create({
                name: 'Admin',
                email: 'admin@worldcupbookinghub.com',
                whatsapp: '16154145082',
                password: 'admin123456',
                role: 'admin',
                isEmailVerified: true
            });
        }

        const matchCount = await Match.countDocuments();

        res.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                matches: matchCount,
                hotels: 1,
                flights: 1,
                extras: 13
            }
        });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: 'Seed failed',
            error: error.message
        });
    }
});

export default router;