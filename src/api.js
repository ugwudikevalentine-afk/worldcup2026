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

// ===== TEMPORARY HOTEL SEED ROUTE (DELETE AFTER USE) =====
router.post('/seed-hotels', async (req, res) => {
    try {
        const { seedKey } = req.body;
        if (seedKey !== 'SEEDHOTELS2026') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const Hotel = (await import('./models/hotel.js')).default;

        // Clear existing hotels
        await Hotel.deleteMany({});

        const hotels = [
            // ===== NEW YORK / EAST RUTHERFORD (MetLife Stadium) =====
            {
                name: 'Hilton Meadowlands',
                city: 'East Rutherford',
                country: 'USA',
                address: '2 Meadowlands Plaza, East Rutherford, NJ 07073',
                rating: 4,
                price_per_night: 280,
                distance_to_stadium: '0.5 km',
                rooms: 310,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Bar'],
                description: 'Walking distance to MetLife Stadium. Perfect for World Cup fans with easy access to NYC.',
                isActive: true
            },
            {
                name: 'Courtyard by Marriott Lyndhurst',
                city: 'East Rutherford',
                country: 'USA',
                address: '1 Polito Ave, Lyndhurst, NJ 07071',
                rating: 4,
                price_per_night: 220,
                distance_to_stadium: '3 km',
                rooms: 227,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking', 'Shuttle'],
                description: 'Close to MetLife Stadium with complimentary shuttle service on match days.',
                isActive: true
            },
            {
                name: 'The Westin Jersey City Newport',
                city: 'Jersey City',
                country: 'USA',
                address: '479 Washington Blvd, Jersey City, NJ 07310',
                rating: 4.5,
                price_per_night: 350,
                distance_to_stadium: '12 km',
                rooms: 429,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service'],
                description: 'Luxury waterfront hotel with Manhattan views. Easy transit access to MetLife Stadium.',
                isActive: true
            },

            // ===== ARLINGTON / DALLAS (AT&T Stadium) =====
            {
                name: 'Live! by Loews Arlington',
                city: 'Arlington',
                country: 'USA',
                address: '1600 E Randol Mill Rd, Arlington, TX 76011',
                rating: 4.5,
                price_per_night: 320,
                distance_to_stadium: '0.3 km',
                rooms: 302,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Steps away from AT&T Stadium in the Arlington Entertainment District.',
                isActive: true
            },
            {
                name: 'Sheraton Arlington Hotel',
                city: 'Arlington',
                country: 'USA',
                address: '1500 Convention Center Dr, Arlington, TX 76011',
                rating: 4,
                price_per_night: 240,
                distance_to_stadium: '1.5 km',
                rooms: 311,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking'],
                description: 'Full-service hotel near AT&T Stadium and Globe Life Field.',
                isActive: true
            },

            // ===== MIAMI (Hard Rock Stadium) =====
            {
                name: 'Turnberry Isle Miami',
                city: 'Miami',
                country: 'USA',
                address: '19999 W Country Club Dr, Aventura, FL 33180',
                rating: 5,
                price_per_night: 450,
                distance_to_stadium: '8 km',
                rooms: 408,
                amenities: ['WiFi', 'Pool', 'Spa', 'Golf', 'Gym', 'Restaurant', 'Beach Access'],
                description: 'Luxury resort near Hard Rock Stadium. World-class amenities for the ultimate fan experience.',
                isActive: true
            },
            {
                name: 'Residence Inn Miami Aventura',
                city: 'Miami',
                country: 'USA',
                address: '19900 West Country Club Dr, Aventura, FL 33180',
                rating: 4,
                price_per_night: 250,
                distance_to_stadium: '9 km',
                rooms: 156,
                amenities: ['WiFi', 'Pool', 'Gym', 'Kitchen', 'Parking', 'Breakfast'],
                description: 'Extended-stay hotel with kitchenettes. Great for families attending multiple matches.',
                isActive: true
            },

            // ===== LOS ANGELES (SoFi Stadium) =====
            {
                name: 'SoFi Stadium Marriott',
                city: 'Los Angeles',
                country: 'USA',
                address: '5855 W Century Blvd, Los Angeles, CA 90045',
                rating: 4.5,
                price_per_night: 380,
                distance_to_stadium: '3 km',
                rooms: 380,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Airport Shuttle'],
                description: 'Modern hotel near SoFi Stadium and LAX airport. Ideal for World Cup visitors.',
                isActive: true
            },
            {
                name: 'Hyatt Regency LAX',
                city: 'Los Angeles',
                country: 'USA',
                address: '6225 W Century Blvd, Los Angeles, CA 90045',
                rating: 4,
                price_per_night: 280,
                distance_to_stadium: '4 km',
                rooms: 580,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Airport Shuttle', 'Parking'],
                description: 'Large hotel near SoFi Stadium. Complimentary airport shuttle available.',
                isActive: true
            },

            // ===== HOUSTON (NRG Stadium) =====
            {
                name: 'Hilton Houston NRG Park',
                city: 'Houston',
                country: 'USA',
                address: '8686 Kirby Dr, Houston, TX 77054',
                rating: 4,
                price_per_night: 230,
                distance_to_stadium: '1 km',
                rooms: 295,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Shuttle'],
                description: 'Adjacent to NRG Stadium with direct covered walkway access on match days.',
                isActive: true
            },

            // ===== PHILADELPHIA (Lincoln Financial Field) =====
            {
                name: 'Philadelphia Marriott Downtown',
                city: 'Philadelphia',
                country: 'USA',
                address: '1201 Market St, Philadelphia, PA 19107',
                rating: 4.5,
                price_per_night: 290,
                distance_to_stadium: '8 km',
                rooms: 1408,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Largest hotel in Philadelphia. Easy subway access to Lincoln Financial Field.',
                isActive: true
            },

            // ===== SEATTLE (Lumen Field) =====
            {
                name: 'Hyatt Regency Seattle',
                city: 'Seattle',
                country: 'USA',
                address: '808 Howell St, Seattle, WA 98101',
                rating: 4.5,
                price_per_night: 310,
                distance_to_stadium: '2 km',
                rooms: 1260,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar', 'Room Service', 'Concierge'],
                description: 'Walking distance to Lumen Field in downtown Seattle.',
                isActive: true
            },

            // ===== ATLANTA (Mercedes-Benz Stadium) =====
            {
                name: 'Omni Atlanta Hotel at CNN Center',
                city: 'Atlanta',
                country: 'USA',
                address: '100 CNN Center, Atlanta, GA 30303',
                rating: 4.5,
                price_per_night: 300,
                distance_to_stadium: '0.5 km',
                rooms: 1059,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
                description: 'Steps from Mercedes-Benz Stadium. Connected to CNN Center and State Farm Arena.',
                isActive: true
            },

            // ===== KANSAS CITY (Arrowhead Stadium) =====
            {
                name: 'Drury Inn Kansas City Stadium',
                city: 'Kansas City',
                country: 'USA',
                address: '3830 Blue Ridge Cutoff, Kansas City, MO 64133',
                rating: 4,
                price_per_night: 200,
                distance_to_stadium: '3 km',
                rooms: 193,
                amenities: ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Shuttle'],
                description: 'Near Arrowhead Stadium with free hot breakfast and evening reception.',
                isActive: true
            },

            // ===== FOXBOROUGH / BOSTON (Gillette Stadium) =====
            {
                name: 'Renaissance Boston Patriot Place',
                city: 'Foxborough',
                country: 'USA',
                address: '28 Patriot Pl, Foxborough, MA 02035',
                rating: 4.5,
                price_per_night: 320,
                distance_to_stadium: '0.2 km',
                rooms: 195,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Directly at Gillette Stadium in Patriot Place. Walk to matches in minutes.',
                isActive: true
            },

            // ===== SANTA CLARA / SAN FRANCISCO (Levi Stadium) =====
            {
                name: 'Hilton Santa Clara',
                city: 'Santa Clara',
                country: 'USA',
                address: '4949 Great America Pkwy, Santa Clara, CA 95054',
                rating: 4,
                price_per_night: 270,
                distance_to_stadium: '1 km',
                rooms: 280,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Shuttle'],
                description: 'Next to Levis Stadium and Great America theme park. Easy Bay Area access.',
                isActive: true
            },

            // ===== MEXICO CITY (Estadio Azteca) =====
            {
                name: 'Camino Real Pedregal',
                city: 'Mexico City',
                country: 'Mexico',
                address: 'Periférico Sur 4363, Jardines en la Montaña, Mexico City',
                rating: 5,
                price_per_night: 250,
                distance_to_stadium: '5 km',
                rooms: 150,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Garden'],
                description: 'Elegant hotel near Estadio Azteca. Beautiful gardens and world-class dining.',
                isActive: true
            },
            {
                name: 'Fiesta Inn Insurgentes Sur',
                city: 'Mexico City',
                country: 'Mexico',
                address: 'Av. Insurgentes Sur 1235, Mexico City',
                rating: 3.5,
                price_per_night: 120,
                distance_to_stadium: '8 km',
                rooms: 210,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking', 'Business Center'],
                description: 'Affordable hotel with easy metro access to Estadio Azteca.',
                isActive: true
            },

            // ===== MONTERREY (Estadio BBVA) =====
            {
                name: 'Fiesta Americana Monterrey',
                city: 'Monterrey',
                country: 'Mexico',
                address: 'Av. Vasconcelos 300, Monterrey, NL 66260',
                rating: 4.5,
                price_per_night: 200,
                distance_to_stadium: '10 km',
                rooms: 207,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Premium hotel in the San Pedro area with great access to Estadio BBVA.',
                isActive: true
            },

            // ===== GUADALAJARA (Estadio Akron) =====
            {
                name: 'Hotel Riu Plaza Guadalajara',
                city: 'Guadalajara',
                country: 'Mexico',
                address: 'Av. López Mateos Sur 830, Guadalajara, JAL 45040',
                rating: 4,
                price_per_night: 180,
                distance_to_stadium: '12 km',
                rooms: 263,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
                description: 'Modern hotel with pool and spa. Good transport links to Estadio Akron.',
                isActive: true
            },

            // ===== TORONTO (BMO Field) =====
            {
                name: 'Hotel X Toronto',
                city: 'Toronto',
                country: 'Canada',
                address: '111 Princes Blvd, Toronto, ON M6K 3C3',
                rating: 5,
                price_per_night: 400,
                distance_to_stadium: '0.5 km',
                rooms: 404,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Cinema', 'Rooftop Bar'],
                description: 'Luxury lakefront hotel steps from BMO Field. Rooftop pool with CN Tower views.',
                isActive: true
            },
            {
                name: 'Radisson Blu Toronto Downtown',
                city: 'Toronto',
                country: 'Canada',
                address: '249 Queens Quay West, Toronto, ON M5J 2N5',
                rating: 4,
                price_per_night: 280,
                distance_to_stadium: '2 km',
                rooms: 253,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Waterfront'],
                description: 'Waterfront hotel near BMO Field. Walk along the harbourfront to match day.',
                isActive: true
            },

            // ===== VANCOUVER (BC Place) =====
            {
                name: 'JW Marriott Parq Vancouver',
                city: 'Vancouver',
                country: 'Canada',
                address: '39 Smithe St, Vancouver, BC V6B 0R3',
                rating: 5,
                price_per_night: 420,
                distance_to_stadium: '0.3 km',
                rooms: 329,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Casino', 'Bar'],
                description: 'Luxury hotel directly adjacent to BC Place. Walk to matches in under 5 minutes.',
                isActive: true
            },
            {
                name: 'YWCA Hotel Vancouver',
                city: 'Vancouver',
                country: 'Canada',
                address: '733 Beatty St, Vancouver, BC V6B 2M4',
                rating: 3,
                price_per_night: 120,
                distance_to_stadium: '0.4 km',
                rooms: 155,
                amenities: ['WiFi', 'Kitchen', 'Laundry'],
                description: 'Budget-friendly option right next to BC Place. Clean rooms at unbeatable prices.',
                isActive: true
            }
        ];

        const created = await Hotel.insertMany(hotels);

        res.json({
            success: true,
            message: 'Hotels seeded successfully!',
            count: created.length,
            cities: [...new Set(created.map(h => h.city))]
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