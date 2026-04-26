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

// ===== TEMPORARY FLIGHT SEED ROUTE (DELETE AFTER USE) =====
router.post('/seed-flights', async (req, res) => {
    try {
        const { seedKey } = req.body;
        if (seedKey !== 'SEEDFLIGHTS2026') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const Flight = (await import('./models/flight.js')).default;

        // Clear existing flights
        await Flight.deleteMany({});

        const flights = [

            // ===================================
            // 🌍 AFRICA
            // ===================================

            // Nigeria
            {
                airline: 'Air Peace',
                flightNumber: 'P47001',
                departure: 'Lagos',
                arrival: 'New York',
                departureCountry: 'Nigeria',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '23:00',
                duration: '12h 30m',
                price: 850,
                seats: 200,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Delta Airlines',
                flightNumber: 'DL402',
                departure: 'Lagos',
                arrival: 'New York',
                departureCountry: 'Nigeria',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '11h 45m',
                price: 920,
                seats: 180,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Air Peace',
                flightNumber: 'P47002',
                departure: 'Lagos',
                arrival: 'Houston',
                departureCountry: 'Nigeria',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '21:00',
                duration: '13h 00m',
                price: 880,
                seats: 200,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Ethiopian Airlines',
                flightNumber: 'ET510',
                departure: 'Lagos',
                arrival: 'Los Angeles',
                departureCountry: 'Nigeria',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '08:00',
                duration: '20h 30m',
                price: 950,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Ghana
            {
                airline: 'Delta Airlines',
                flightNumber: 'DL450',
                departure: 'Accra',
                arrival: 'New York',
                departureCountry: 'Ghana',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '22:00',
                duration: '11h 00m',
                price: 900,
                seats: 180,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'British Airways',
                flightNumber: 'BA082',
                departure: 'Accra',
                arrival: 'Miami',
                departureCountry: 'Ghana',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '09:00',
                duration: '14h 30m',
                price: 980,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Ivory Coast
            {
                airline: 'Air France',
                flightNumber: 'AF703',
                departure: 'Abidjan',
                arrival: 'New York',
                departureCountry: 'Ivory Coast',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '23:30',
                duration: '13h 15m',
                price: 950,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Senegal
            {
                airline: 'Air France',
                flightNumber: 'AF710',
                departure: 'Dakar',
                arrival: 'New York',
                departureCountry: 'Senegal',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '21:00',
                duration: '10h 30m',
                price: 880,
                seats: 170,
                class: 'economy',
                isActive: true
            },

            // Morocco
            {
                airline: 'Royal Air Maroc',
                flightNumber: 'AT200',
                departure: 'Casablanca',
                arrival: 'New York',
                departureCountry: 'Morocco',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '14:00',
                duration: '8h 45m',
                price: 820,
                seats: 200,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Royal Air Maroc',
                flightNumber: 'AT202',
                departure: 'Casablanca',
                arrival: 'Miami',
                departureCountry: 'Morocco',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '10h 00m',
                price: 860,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // Egypt
            {
                airline: 'EgyptAir',
                flightNumber: 'MS985',
                departure: 'Cairo',
                arrival: 'New York',
                departureCountry: 'Egypt',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '10:00',
                duration: '12h 00m',
                price: 780,
                seats: 220,
                class: 'economy',
                isActive: true
            },

            // Tunisia
            {
                airline: 'Turkish Airlines',
                flightNumber: 'TK780',
                departure: 'Tunis',
                arrival: 'New York',
                departureCountry: 'Tunisia',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '08:00',
                duration: '14h 30m',
                price: 750,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // South Africa
            {
                airline: 'South African Airways',
                flightNumber: 'SA203',
                departure: 'Johannesburg',
                arrival: 'Miami',
                departureCountry: 'South Africa',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '18:00',
                duration: '18h 30m',
                price: 1100,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Cameroon
            {
                airline: 'Air France',
                flightNumber: 'AF902',
                departure: 'Yaounde',
                arrival: 'New York',
                departureCountry: 'Cameroon',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '20:00',
                duration: '14h 00m',
                price: 970,
                seats: 140,
                class: 'economy',
                isActive: true
            },

            // ===================================
            // 🌎 SOUTH AMERICA
            // ===================================

            // Argentina
            {
                airline: 'Aerolíneas Argentinas',
                flightNumber: 'AR1301',
                departure: 'Buenos Aires',
                arrival: 'Miami',
                departureCountry: 'Argentina',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '22:00',
                duration: '10h 30m',
                price: 650,
                seats: 220,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'American Airlines',
                flightNumber: 'AA902',
                departure: 'Buenos Aires',
                arrival: 'Dallas',
                departureCountry: 'Argentina',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '20:00',
                duration: '12h 00m',
                price: 700,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // Brazil
            {
                airline: 'LATAM Airlines',
                flightNumber: 'LA8084',
                departure: 'Sao Paulo',
                arrival: 'Miami',
                departureCountry: 'Brazil',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '21:30',
                duration: '9h 00m',
                price: 580,
                seats: 250,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'LATAM Airlines',
                flightNumber: 'LA8060',
                departure: 'Sao Paulo',
                arrival: 'Houston',
                departureCountry: 'Brazil',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '19:00',
                duration: '10h 30m',
                price: 620,
                seats: 220,
                class: 'economy',
                isActive: true
            },

            // Colombia
            {
                airline: 'Avianca',
                flightNumber: 'AV25',
                departure: 'Bogota',
                arrival: 'Miami',
                departureCountry: 'Colombia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:00',
                duration: '4h 00m',
                price: 320,
                seats: 180,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Avianca',
                flightNumber: 'AV30',
                departure: 'Bogota',
                arrival: 'Houston',
                departureCountry: 'Colombia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '08:00',
                duration: '4h 30m',
                price: 350,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Uruguay
            {
                airline: 'Aerolíneas Argentinas',
                flightNumber: 'AR1401',
                departure: 'Montevideo',
                arrival: 'Miami',
                departureCountry: 'Uruguay',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '23:00',
                duration: '10h 00m',
                price: 620,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Peru
            {
                airline: 'LATAM Airlines',
                flightNumber: 'LA2001',
                departure: 'Lima',
                arrival: 'Miami',
                departureCountry: 'Peru',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '23:30',
                duration: '7h 30m',
                price: 450,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // Chile
            {
                airline: 'LATAM Airlines',
                flightNumber: 'LA502',
                departure: 'Santiago',
                arrival: 'Miami',
                departureCountry: 'Chile',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '20:00',
                duration: '11h 00m',
                price: 550,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // ===================================
            // 🌍 EUROPE
            // ===================================

            // England
            {
                airline: 'British Airways',
                flightNumber: 'BA117',
                departure: 'London',
                arrival: 'New York',
                departureCountry: 'England',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '11:00',
                duration: '7h 30m',
                price: 450,
                seats: 280,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Virgin Atlantic',
                flightNumber: 'VS003',
                departure: 'London',
                arrival: 'Los Angeles',
                departureCountry: 'England',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '13:00',
                duration: '10h 30m',
                price: 520,
                seats: 250,
                class: 'economy',
                isActive: true
            },

            // France
            {
                airline: 'Air France',
                flightNumber: 'AF006',
                departure: 'Paris',
                arrival: 'New York',
                departureCountry: 'France',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:30',
                duration: '8h 00m',
                price: 480,
                seats: 280,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Air France',
                flightNumber: 'AF068',
                departure: 'Paris',
                arrival: 'Miami',
                departureCountry: 'France',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '13:30',
                duration: '9h 30m',
                price: 500,
                seats: 250,
                class: 'economy',
                isActive: true
            },

            // Spain
            {
                airline: 'Iberia',
                flightNumber: 'IB6251',
                departure: 'Madrid',
                arrival: 'New York',
                departureCountry: 'Spain',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '12:00',
                duration: '8h 30m',
                price: 460,
                seats: 260,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Iberia',
                flightNumber: 'IB6275',
                departure: 'Madrid',
                arrival: 'Miami',
                departureCountry: 'Spain',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '14:00',
                duration: '9h 45m',
                price: 490,
                seats: 240,
                class: 'economy',
                isActive: true
            },

            // Germany
            {
                airline: 'Lufthansa',
                flightNumber: 'LH400',
                departure: 'Frankfurt',
                arrival: 'New York',
                departureCountry: 'Germany',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '8h 45m',
                price: 490,
                seats: 280,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'Lufthansa',
                flightNumber: 'LH462',
                departure: 'Munich',
                arrival: 'New York',
                departureCountry: 'Germany',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '09:00',
                duration: '9h 15m',
                price: 500,
                seats: 260,
                class: 'economy',
                isActive: true
            },

            // Portugal
            {
                airline: 'TAP Air Portugal',
                flightNumber: 'TP210',
                departure: 'Lisbon',
                arrival: 'New York',
                departureCountry: 'Portugal',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '11:00',
                duration: '7h 30m',
                price: 420,
                seats: 240,
                class: 'economy',
                isActive: true
            },

            // Netherlands
            {
                airline: 'KLM',
                flightNumber: 'KL641',
                departure: 'Amsterdam',
                arrival: 'New York',
                departureCountry: 'Netherlands',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:15',
                duration: '8h 15m',
                price: 470,
                seats: 280,
                class: 'economy',
                isActive: true
            },

            // Belgium
            {
                airline: 'Brussels Airlines',
                flightNumber: 'SN501',
                departure: 'Brussels',
                arrival: 'New York',
                departureCountry: 'Belgium',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '11:30',
                duration: '8h 30m',
                price: 460,
                seats: 220,
                class: 'economy',
                isActive: true
            },

            // Italy
            {
                airline: 'ITA Airways',
                flightNumber: 'AZ608',
                departure: 'Rome',
                arrival: 'New York',
                departureCountry: 'Italy',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '9h 30m',
                price: 480,
                seats: 240,
                class: 'economy',
                isActive: true
            },

            // Croatia
            {
                airline: 'Lufthansa',
                flightNumber: 'LH1414',
                departure: 'Zagreb',
                arrival: 'New York',
                departureCountry: 'Croatia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:00',
                duration: '12h 00m',
                price: 520,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // Serbia
            {
                airline: 'Air Serbia',
                flightNumber: 'JU0203',
                departure: 'Belgrade',
                arrival: 'New York',
                departureCountry: 'Serbia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '07:00',
                duration: '11h 30m',
                price: 520,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Switzerland
            {
                airline: 'Swiss Air',
                flightNumber: 'LX022',
                departure: 'Zurich',
                arrival: 'New York',
                departureCountry: 'Switzerland',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:30',
                duration: '9h 00m',
                price: 500,
                seats: 220,
                class: 'economy',
                isActive: true
            },

            // Austria
            {
                airline: 'Austrian Airlines',
                flightNumber: 'OS091',
                departure: 'Vienna',
                arrival: 'New York',
                departureCountry: 'Austria',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '11:00',
                duration: '10h 00m',
                price: 510,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // Poland
            {
                airline: 'LOT Polish Airlines',
                flightNumber: 'LO003',
                departure: 'Warsaw',
                arrival: 'New York',
                departureCountry: 'Poland',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '09:00',
                duration: '10h 30m',
                price: 530,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // Romania
            {
                airline: 'Lufthansa',
                flightNumber: 'LH1634',
                departure: 'Bucharest',
                arrival: 'New York',
                departureCountry: 'Romania',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:30',
                duration: '13h 00m',
                price: 540,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Albania
            {
                airline: 'Wizz Air',
                flightNumber: 'W61234',
                departure: 'Tirana',
                arrival: 'New York',
                departureCountry: 'Albania',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '07:00',
                duration: '12h 30m',
                price: 510,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // Georgia
            {
                airline: 'Turkish Airlines',
                flightNumber: 'TK372',
                departure: 'Tbilisi',
                arrival: 'New York',
                departureCountry: 'Georgia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '05:00',
                duration: '15h 30m',
                price: 580,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Ukraine
            {
                airline: 'Lufthansa',
                flightNumber: 'LH1468',
                departure: 'Kyiv',
                arrival: 'New York',
                departureCountry: 'Ukraine',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:00',
                duration: '13h 00m',
                price: 560,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Scotland
            {
                airline: 'British Airways',
                flightNumber: 'BA1476',
                departure: 'Edinburgh',
                arrival: 'New York',
                departureCountry: 'Scotland',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '8h 00m',
                price: 460,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // ===================================
            // 🌏 ASIA
            // ===================================

            // Japan
            {
                airline: 'Japan Airlines',
                flightNumber: 'JL001',
                departure: 'Tokyo',
                arrival: 'Los Angeles',
                departureCountry: 'Japan',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '11:00',
                duration: '10h 30m',
                price: 850,
                seats: 280,
                class: 'economy',
                isActive: true
            },
            {
                airline: 'ANA',
                flightNumber: 'NH005',
                departure: 'Tokyo',
                arrival: 'Seattle',
                departureCountry: 'Japan',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '17:00',
                duration: '9h 30m',
                price: 820,
                seats: 260,
                class: 'economy',
                isActive: true
            },

            // South Korea
            {
                airline: 'Korean Air',
                flightNumber: 'KE017',
                departure: 'Seoul',
                arrival: 'Los Angeles',
                departureCountry: 'South Korea',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '18:30',
                duration: '11h 00m',
                price: 820,
                seats: 280,
                class: 'economy',
                isActive: true
            },

            // China
            {
                airline: 'Air China',
                flightNumber: 'CA981',
                departure: 'Beijing',
                arrival: 'Los Angeles',
                departureCountry: 'China',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '10:00',
                duration: '11h 30m',
                price: 780,
                seats: 300,
                class: 'economy',
                isActive: true
            },

            // Saudi Arabia
            {
                airline: 'Saudia Airlines',
                flightNumber: 'SV21',
                departure: 'Riyadh',
                arrival: 'New York',
                departureCountry: 'Saudi Arabia',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '08:00',
                duration: '13h 30m',
                price: 720,
                seats: 240,
                class: 'economy',
                isActive: true
            },

            // Qatar
            {
                airline: 'Qatar Airways',
                flightNumber: 'QR701',
                departure: 'Doha',
                arrival: 'New York',
                departureCountry: 'Qatar',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '09:00',
                duration: '13h 00m',
                price: 700,
                seats: 280,
                class: 'economy',
                isActive: true
            },

            // Iran
            {
                airline: 'Turkish Airlines',
                flightNumber: 'TK780',
                departure: 'Tehran',
                arrival: 'New York',
                departureCountry: 'Iran',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:00',
                duration: '16h 00m',
                price: 750,
                seats: 180,
                class: 'economy',
                isActive: true
            },

            // Jordan
            {
                airline: 'Royal Jordanian',
                flightNumber: 'RJ101',
                departure: 'Amman',
                arrival: 'New York',
                departureCountry: 'Jordan',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '08:30',
                duration: '12h 30m',
                price: 690,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // Pakistan
            {
                airline: 'Pakistan International Airlines',
                flightNumber: 'PK785',
                departure: 'Karachi',
                arrival: 'New York',
                departureCountry: 'Pakistan',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '03:00',
                duration: '16h 30m',
                price: 760,
                seats: 200,
                class: 'economy',
                isActive: true
            },

            // ===================================
            // 🌏 OCEANIA
            // ===================================

            // New Zealand
            {
                airline: 'Air New Zealand',
                flightNumber: 'NZ001',
                departure: 'Auckland',
                arrival: 'Los Angeles',
                departureCountry: 'New Zealand',
                arrivalCountry: 'United States',
                date: '2026-06-09',
                time: '21:00',
                duration: '12h 30m',
                price: 1100,
                seats: 220,
                class: 'economy',
                isActive: true
            },

            // ===================================
            // 🌎 CONCACAF (Non-Host)
            // ===================================

            // Jamaica
            {
                airline: 'American Airlines',
                flightNumber: 'AA1234',
                departure: 'Kingston',
                arrival: 'Miami',
                departureCountry: 'Jamaica',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '07:00',
                duration: '2h 30m',
                price: 280,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Trinidad and Tobago
            {
                airline: 'Caribbean Airlines',
                flightNumber: 'BW451',
                departure: 'Port of Spain',
                arrival: 'Miami',
                departureCountry: 'Trinidad and Tobago',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '08:00',
                duration: '3h 30m',
                price: 300,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Panama
            {
                airline: 'Copa Airlines',
                flightNumber: 'CM201',
                departure: 'Panama City',
                arrival: 'Miami',
                departureCountry: 'Panama',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '06:00',
                duration: '2h 45m',
                price: 250,
                seats: 160,
                class: 'economy',
                isActive: true
            },

            // Costa Rica
            {
                airline: 'Copa Airlines',
                flightNumber: 'CM407',
                departure: 'San Jose',
                arrival: 'Miami',
                departureCountry: 'Costa Rica',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '07:30',
                duration: '3h 00m',
                price: 280,
                seats: 150,
                class: 'economy',
                isActive: true
            },

            // Honduras
            {
                airline: 'United Airlines',
                flightNumber: 'UA1502',
                departure: 'Tegucigalpa',
                arrival: 'Houston',
                departureCountry: 'Honduras',
                arrivalCountry: 'United States',
                date: '2026-06-10',
                time: '08:00',
                duration: '3h 30m',
                price: 260,
                seats: 140,
                class: 'economy',
                isActive: true
            }
        ];

        const created = await Flight.insertMany(flights);

        const countries = [...new Set(created.map(f => f.departureCountry))];

        res.json({
            success: true,
            message: 'Flights seeded successfully!',
            count: created.length,
            countries: countries,
            routes: created.map(f => `${f.departure} → ${f.arrival} ($${f.price})`)
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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