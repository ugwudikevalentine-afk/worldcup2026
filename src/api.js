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

// ===== FULL HOTEL + FLIGHT SEED (ALL 16 HOST CITIES) =====
router.post('/seed-full-data', async (req, res) => {
    try {
        const { seedKey } = req.body;
        if (seedKey !== 'SEEDFULL2026') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const Hotel = (await import('./models/hotel.js')).default;
        const Flight = (await import('./models/flight.js')).default;

        // Clear existing data
        await Hotel.deleteMany({});
        await Flight.deleteMany({});
        console.log('✅ Cleared existing hotels and flights');

        // ===================================
        // 🏨 HOTELS — ALL 16 HOST CITIES
        // ===================================
        const hotels = [

            // ===== NEW YORK / NEW JERSEY (MetLife Stadium) =====
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
                description: 'Walking distance to MetLife Stadium. Perfect base for World Cup fans attending matches in New York/New Jersey.',
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
                description: 'Comfortable hotel close to MetLife Stadium with complimentary shuttle service on match days.',
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
                description: 'Luxury waterfront hotel with Manhattan skyline views. Easy transit to MetLife Stadium.',
                isActive: true
            },

            // ===== LOS ANGELES (SoFi Stadium) =====
            {
                name: 'Marriott Los Angeles Airport',
                city: 'Los Angeles',
                country: 'USA',
                address: '5855 W Century Blvd, Los Angeles, CA 90045',
                rating: 4.5,
                price_per_night: 380,
                distance_to_stadium: '3 km',
                rooms: 380,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Airport Shuttle'],
                description: 'Modern hotel near SoFi Stadium and LAX airport. Ideal for international World Cup visitors.',
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
                description: 'Large hotel near SoFi Stadium with complimentary airport shuttle.',
                isActive: true
            },
            {
                name: 'Hotel Indigo Los Angeles Downtown',
                city: 'Los Angeles',
                country: 'USA',
                address: '899 Francisco St, Los Angeles, CA 90017',
                rating: 4,
                price_per_night: 240,
                distance_to_stadium: '15 km',
                rooms: 350,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar', 'Rooftop Pool'],
                description: 'Boutique hotel in Downtown LA. Great access to public transport and World Cup fan zones.',
                isActive: true
            },

            // ===== DALLAS / ARLINGTON (AT&T Stadium) =====
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
                description: 'Steps away from AT&T Stadium in the Arlington Entertainment District. Best location for match days.',
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
            {
                name: 'Omni Dallas Hotel',
                city: 'Dallas',
                country: 'USA',
                address: '555 S Lamar St, Dallas, TX 75202',
                rating: 4.5,
                price_per_night: 290,
                distance_to_stadium: '18 km',
                rooms: 1001,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Rooftop Pool'],
                description: 'Luxury downtown Dallas hotel connected to the convention center. Easy access to AT&T Stadium.',
                isActive: true
            },

            // ===== SAN FRANCISCO / SANTA CLARA (Levi Stadium) =====
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
                description: 'Adjacent to Levis Stadium. Walking distance to the stadium on match days.',
                isActive: true
            },
            {
                name: 'Hyatt Regency San Francisco',
                city: 'San Francisco',
                country: 'USA',
                address: '5 Embarcadero Center, San Francisco, CA 94111',
                rating: 4.5,
                price_per_night: 350,
                distance_to_stadium: '55 km',
                rooms: 802,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar', 'Waterfront View'],
                description: 'Iconic waterfront hotel in San Francisco. Great base for exploring the Bay Area during the World Cup.',
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
                address: '19900 W Country Club Dr, Aventura, FL 33180',
                rating: 4,
                price_per_night: 250,
                distance_to_stadium: '9 km',
                rooms: 156,
                amenities: ['WiFi', 'Pool', 'Gym', 'Kitchen', 'Parking', 'Breakfast'],
                description: 'Extended-stay hotel with kitchenettes. Great for families attending multiple matches.',
                isActive: true
            },
            {
                name: 'InterContinental Miami',
                city: 'Miami',
                country: 'USA',
                address: '100 Chopin Plaza, Miami, FL 33131',
                rating: 4.5,
                price_per_night: 320,
                distance_to_stadium: '18 km',
                rooms: 641,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Bayfront View'],
                description: 'Elegant bayfront hotel in downtown Miami. Easy highway access to Hard Rock Stadium.',
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
                description: 'Walking distance to Lumen Field in downtown Seattle. Largest hotel in the Pacific Northwest.',
                isActive: true
            },
            {
                name: 'Marriott Seattle Waterfront',
                city: 'Seattle',
                country: 'USA',
                address: '2100 Alaskan Way, Seattle, WA 98121',
                rating: 4.5,
                price_per_night: 340,
                distance_to_stadium: '3 km',
                rooms: 358,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar', 'Waterfront View'],
                description: 'Beautiful waterfront hotel with Puget Sound views. Short walk to Lumen Field.',
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
                description: 'Steps from Mercedes-Benz Stadium. Connected to CNN Center via sky bridge.',
                isActive: true
            },
            {
                name: 'Hilton Atlanta',
                city: 'Atlanta',
                country: 'USA',
                address: '255 Courtland St NE, Atlanta, GA 30303',
                rating: 4,
                price_per_night: 250,
                distance_to_stadium: '2 km',
                rooms: 1224,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Business Center'],
                description: 'Large convention hotel in downtown Atlanta. Easy MARTA access to Mercedes-Benz Stadium.',
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
            {
                name: 'Marriott Houston Medical Center',
                city: 'Houston',
                country: 'USA',
                address: '6580 Fannin St, Houston, TX 77030',
                rating: 4,
                price_per_night: 200,
                distance_to_stadium: '5 km',
                rooms: 385,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking'],
                description: 'Well-located hotel near the Texas Medical Center and NRG Stadium.',
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
            {
                name: 'Loews Philadelphia Hotel',
                city: 'Philadelphia',
                country: 'USA',
                address: '1200 Market St, Philadelphia, PA 19107',
                rating: 4.5,
                price_per_night: 280,
                distance_to_stadium: '8 km',
                rooms: 581,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
                description: 'Historic skyscraper hotel in Center City Philadelphia. Convenient for all World Cup matches.',
                isActive: true
            },

            // ===== KANSAS CITY (Arrowhead Stadium) =====
            {
                name: 'Sheraton Kansas City Hotel at Crown Center',
                city: 'Kansas City',
                country: 'USA',
                address: '2345 McGee St, Kansas City, MO 64108',
                rating: 4,
                price_per_night: 220,
                distance_to_stadium: '8 km',
                rooms: 731,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Parking'],
                description: 'Connected to Crown Center shops and Hallmark Visitor Center. Good access to Arrowhead Stadium.',
                isActive: true
            },
            {
                name: 'Drury Inn Kansas City Stadium',
                city: 'Kansas City',
                country: 'USA',
                address: '3830 Blue Ridge Cutoff, Kansas City, MO 64133',
                rating: 4,
                price_per_night: 180,
                distance_to_stadium: '3 km',
                rooms: 193,
                amenities: ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Shuttle'],
                description: 'Closest hotel to Arrowhead Stadium with free hot breakfast and shuttle service.',
                isActive: true
            },

            // ===== BOSTON / FOXBOROUGH (Gillette Stadium) =====
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
                description: 'Directly at Gillette Stadium in Patriot Place. Walk to matches in under 5 minutes.',
                isActive: true
            },
            {
                name: 'Boston Marriott Copley Place',
                city: 'Boston',
                country: 'USA',
                address: '110 Huntington Ave, Boston, MA 02116',
                rating: 4.5,
                price_per_night: 350,
                distance_to_stadium: '40 km',
                rooms: 1147,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
                description: 'Iconic Boston hotel in Copley Place. Take commuter rail to Gillette Stadium on match days.',
                isActive: true
            },

            // ===== MEXICO CITY (Estadio Azteca) =====
            {
                name: 'Camino Real Pedregal Mexico City',
                city: 'Mexico City',
                country: 'Mexico',
                address: 'Periférico Sur 4363, Jardines en la Montaña, CDMX',
                rating: 5,
                price_per_night: 250,
                distance_to_stadium: '5 km',
                rooms: 150,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Garden'],
                description: 'Elegant hotel near Estadio Azteca. Beautiful gardens and world-class Mexican cuisine.',
                isActive: true
            },
            {
                name: 'Hyatt Regency Mexico City',
                city: 'Mexico City',
                country: 'Mexico',
                address: 'Campos Elíseos 204, Polanco, CDMX 11560',
                rating: 5,
                price_per_night: 280,
                distance_to_stadium: '15 km',
                rooms: 755,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Luxury hotel in Polanco, the most prestigious area of Mexico City. Metro access to Azteca.',
                isActive: true
            },
            {
                name: 'Fiesta Inn Insurgentes Sur',
                city: 'Mexico City',
                country: 'Mexico',
                address: 'Av. Insurgentes Sur 1235, Del Valle, CDMX',
                rating: 3.5,
                price_per_night: 100,
                distance_to_stadium: '8 km',
                rooms: 210,
                amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking', 'Business Center'],
                description: 'Budget-friendly option with easy metro access to Estadio Azteca. Great value for money.',
                isActive: true
            },

            // ===== GUADALAJARA (Estadio Akron) =====
            {
                name: 'Hotel Riu Plaza Guadalajara',
                city: 'Guadalajara',
                country: 'Mexico',
                address: 'Av. López Mateos Sur 830, Guadalajara, JAL',
                rating: 4,
                price_per_night: 180,
                distance_to_stadium: '12 km',
                rooms: 263,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
                description: 'Modern hotel with pool and spa. Good transport links to Estadio Akron.',
                isActive: true
            },
            {
                name: 'Hilton Guadalajara Midtown',
                city: 'Guadalajara',
                country: 'Mexico',
                address: 'Av. de las Américas 1551, Country Club, Guadalajara',
                rating: 4.5,
                price_per_night: 220,
                distance_to_stadium: '10 km',
                rooms: 453,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Premium hotel in the heart of Guadalajara. Easy access to Estadio Akron.',
                isActive: true
            },

            // ===== MONTERREY (Estadio BBVA) =====
            {
                name: 'Fiesta Americana Monterrey',
                city: 'Monterrey',
                country: 'Mexico',
                address: 'Av. Vasconcelos 300, San Pedro Garza García, NL',
                rating: 4.5,
                price_per_night: 200,
                distance_to_stadium: '10 km',
                rooms: 207,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
                description: 'Premium hotel in San Pedro with great views of the Sierra Madre mountains.',
                isActive: true
            },
            {
                name: 'Hyatt Regency Monterrey',
                city: 'Monterrey',
                country: 'Mexico',
                address: 'Av. Constitución 300 Ote, Centro, Monterrey, NL',
                rating: 4.5,
                price_per_night: 220,
                distance_to_stadium: '12 km',
                rooms: 316,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
                description: 'Luxury hotel in downtown Monterrey near the famous Macroplaza. Easy access to Estadio BBVA.',
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
                description: 'Waterfront hotel near BMO Field. Walk along the harbourfront to the stadium.',
                isActive: true
            },
            {
                name: 'Fairmont Royal York Toronto',
                city: 'Toronto',
                country: 'Canada',
                address: '100 Front St W, Toronto, ON M5J 1E3',
                rating: 5,
                price_per_night: 450,
                distance_to_stadium: '4 km',
                rooms: 1365,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Multiple Restaurants', 'Bar', 'Room Service'],
                description: 'Historic landmark hotel across from Union Station. Easy transit to BMO Field.',
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
                name: 'Fairmont Waterfront Vancouver',
                city: 'Vancouver',
                country: 'Canada',
                address: '900 Canada Place Way, Vancouver, BC V6C 3L5',
                rating: 5,
                price_per_night: 400,
                distance_to_stadium: '2 km',
                rooms: 489,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Harbour View'],
                description: 'Elegant harbour-view hotel near BC Place and Canada Place cruise terminal.',
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

        // ===================================
        // ✈️ FLIGHTS — ALL 16 HOST CITIES
        // ===================================
        const flights = [

            // ===================================
            // 🌍 FLIGHTS TO NEW YORK (MetLife)
            // ===================================

            // Africa → New York
            { airline: 'Air Peace', flightNumber: 'P47001', departure: 'Lagos', arrival: 'New York', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '23:00', duration: '12h 30m', price: 850, seats: 200, class: 'economy', isActive: true },
            { airline: 'Delta Airlines', flightNumber: 'DL402', departure: 'Lagos', arrival: 'New York', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '11h 45m', price: 920, seats: 180, class: 'economy', isActive: true },
            { airline: 'Delta Airlines', flightNumber: 'DL450', departure: 'Accra', arrival: 'New York', departureCountry: 'Ghana', arrivalCountry: 'United States', date: '2026-06-09', time: '22:00', duration: '11h 00m', price: 900, seats: 180, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF703', departure: 'Abidjan', arrival: 'New York', departureCountry: 'Ivory Coast', arrivalCountry: 'United States', date: '2026-06-09', time: '23:30', duration: '13h 15m', price: 950, seats: 160, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF710', departure: 'Dakar', arrival: 'New York', departureCountry: 'Senegal', arrivalCountry: 'United States', date: '2026-06-09', time: '21:00', duration: '10h 30m', price: 880, seats: 170, class: 'economy', isActive: true },
            { airline: 'Royal Air Maroc', flightNumber: 'AT200', departure: 'Casablanca', arrival: 'New York', departureCountry: 'Morocco', arrivalCountry: 'United States', date: '2026-06-09', time: '14:00', duration: '8h 45m', price: 820, seats: 200, class: 'economy', isActive: true },
            { airline: 'EgyptAir', flightNumber: 'MS985', departure: 'Cairo', arrival: 'New York', departureCountry: 'Egypt', arrivalCountry: 'United States', date: '2026-06-09', time: '10:00', duration: '12h 00m', price: 780, seats: 220, class: 'economy', isActive: true },
            { airline: 'Turkish Airlines', flightNumber: 'TK780', departure: 'Tunis', arrival: 'New York', departureCountry: 'Tunisia', arrivalCountry: 'United States', date: '2026-06-09', time: '08:00', duration: '14h 30m', price: 750, seats: 180, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF902', departure: 'Yaounde', arrival: 'New York', departureCountry: 'Cameroon', arrivalCountry: 'United States', date: '2026-06-09', time: '20:00', duration: '14h 00m', price: 970, seats: 140, class: 'economy', isActive: true },

            // Europe → New York
            { airline: 'British Airways', flightNumber: 'BA117', departure: 'London', arrival: 'New York', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '7h 30m', price: 450, seats: 280, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF006', departure: 'Paris', arrival: 'New York', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '10:30', duration: '8h 00m', price: 480, seats: 280, class: 'economy', isActive: true },
            { airline: 'Iberia', flightNumber: 'IB6251', departure: 'Madrid', arrival: 'New York', departureCountry: 'Spain', arrivalCountry: 'United States', date: '2026-06-10', time: '12:00', duration: '8h 30m', price: 460, seats: 260, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH400', departure: 'Frankfurt', arrival: 'New York', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '8h 45m', price: 490, seats: 280, class: 'economy', isActive: true },
            { airline: 'TAP Air Portugal', flightNumber: 'TP210', departure: 'Lisbon', arrival: 'New York', departureCountry: 'Portugal', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '7h 30m', price: 420, seats: 240, class: 'economy', isActive: true },
            { airline: 'KLM', flightNumber: 'KL641', departure: 'Amsterdam', arrival: 'New York', departureCountry: 'Netherlands', arrivalCountry: 'United States', date: '2026-06-10', time: '10:15', duration: '8h 15m', price: 470, seats: 280, class: 'economy', isActive: true },
            { airline: 'Brussels Airlines', flightNumber: 'SN501', departure: 'Brussels', arrival: 'New York', departureCountry: 'Belgium', arrivalCountry: 'United States', date: '2026-06-10', time: '11:30', duration: '8h 30m', price: 460, seats: 220, class: 'economy', isActive: true },
            { airline: 'ITA Airways', flightNumber: 'AZ608', departure: 'Rome', arrival: 'New York', departureCountry: 'Italy', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '9h 30m', price: 480, seats: 240, class: 'economy', isActive: true },
            { airline: 'Swiss Air', flightNumber: 'LX022', departure: 'Zurich', arrival: 'New York', departureCountry: 'Switzerland', arrivalCountry: 'United States', date: '2026-06-10', time: '10:30', duration: '9h 00m', price: 500, seats: 220, class: 'economy', isActive: true },
            { airline: 'Austrian Airlines', flightNumber: 'OS091', departure: 'Vienna', arrival: 'New York', departureCountry: 'Austria', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 00m', price: 510, seats: 200, class: 'economy', isActive: true },
            { airline: 'LOT Polish Airlines', flightNumber: 'LO003', departure: 'Warsaw', arrival: 'New York', departureCountry: 'Poland', arrivalCountry: 'United States', date: '2026-06-10', time: '09:00', duration: '10h 30m', price: 530, seats: 200, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH1634', departure: 'Bucharest', arrival: 'New York', departureCountry: 'Romania', arrivalCountry: 'United States', date: '2026-06-10', time: '06:30', duration: '13h 00m', price: 540, seats: 160, class: 'economy', isActive: true },
            { airline: 'Air Serbia', flightNumber: 'JU0203', departure: 'Belgrade', arrival: 'New York', departureCountry: 'Serbia', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '11h 30m', price: 520, seats: 160, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH1414', departure: 'Zagreb', arrival: 'New York', departureCountry: 'Croatia', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '12h 00m', price: 520, seats: 180, class: 'economy', isActive: true },
            { airline: 'Wizz Air', flightNumber: 'W61234', departure: 'Tirana', arrival: 'New York', departureCountry: 'Albania', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '12h 30m', price: 510, seats: 180, class: 'economy', isActive: true },
            { airline: 'Turkish Airlines', flightNumber: 'TK372', departure: 'Tbilisi', arrival: 'New York', departureCountry: 'Georgia', arrivalCountry: 'United States', date: '2026-06-10', time: '05:00', duration: '15h 30m', price: 580, seats: 160, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH1468', departure: 'Kyiv', arrival: 'New York', departureCountry: 'Ukraine', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '13h 00m', price: 560, seats: 160, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA1476', departure: 'Edinburgh', arrival: 'New York', departureCountry: 'Scotland', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '8h 00m', price: 460, seats: 200, class: 'economy', isActive: true },

            // Asia → New York
            { airline: 'Qatar Airways', flightNumber: 'QR701', departure: 'Doha', arrival: 'New York', departureCountry: 'Qatar', arrivalCountry: 'United States', date: '2026-06-10', time: '09:00', duration: '13h 00m', price: 700, seats: 280, class: 'economy', isActive: true },
            { airline: 'Saudia Airlines', flightNumber: 'SV21', departure: 'Riyadh', arrival: 'New York', departureCountry: 'Saudi Arabia', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '13h 30m', price: 720, seats: 240, class: 'economy', isActive: true },
            { airline: 'Turkish Airlines', flightNumber: 'TK780', departure: 'Tehran', arrival: 'New York', departureCountry: 'Iran', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '16h 00m', price: 750, seats: 180, class: 'economy', isActive: true },
            { airline: 'Royal Jordanian', flightNumber: 'RJ101', departure: 'Amman', arrival: 'New York', departureCountry: 'Jordan', arrivalCountry: 'United States', date: '2026-06-10', time: '08:30', duration: '12h 30m', price: 690, seats: 200, class: 'economy', isActive: true },
            { airline: 'Pakistan International Airlines', flightNumber: 'PK785', departure: 'Karachi', arrival: 'New York', departureCountry: 'Pakistan', arrivalCountry: 'United States', date: '2026-06-10', time: '03:00', duration: '16h 30m', price: 760, seats: 200, class: 'economy', isActive: true },

            // South America → New York
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1302', departure: 'Buenos Aires', arrival: 'New York', departureCountry: 'Argentina', arrivalCountry: 'United States', date: '2026-06-10', time: '22:00', duration: '13h 00m', price: 700, seats: 200, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8086', departure: 'Sao Paulo', arrival: 'New York', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '21:00', duration: '11h 00m', price: 620, seats: 240, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV027', departure: 'Bogota', arrival: 'New York', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '6h 00m', price: 380, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO LOS ANGELES (SoFi)
            // ===================================

            { airline: 'Japan Airlines', flightNumber: 'JL001', departure: 'Tokyo', arrival: 'Los Angeles', departureCountry: 'Japan', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 850, seats: 280, class: 'economy', isActive: true },
            { airline: 'ANA', flightNumber: 'NH005', departure: 'Tokyo', arrival: 'Los Angeles', departureCountry: 'Japan', arrivalCountry: 'United States', date: '2026-06-10', time: '17:00', duration: '10h 00m', price: 820, seats: 260, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE017', departure: 'Seoul', arrival: 'Los Angeles', departureCountry: 'South Korea', arrivalCountry: 'United States', date: '2026-06-10', time: '18:30', duration: '11h 00m', price: 820, seats: 280, class: 'economy', isActive: true },
            { airline: 'Air China', flightNumber: 'CA981', departure: 'Beijing', arrival: 'Los Angeles', departureCountry: 'China', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '11h 30m', price: 780, seats: 300, class: 'economy', isActive: true },
            { airline: 'Air New Zealand', flightNumber: 'NZ001', departure: 'Auckland', arrival: 'Los Angeles', departureCountry: 'New Zealand', arrivalCountry: 'United States', date: '2026-06-09', time: '21:00', duration: '12h 30m', price: 1100, seats: 220, class: 'economy', isActive: true },
            { airline: 'Virgin Atlantic', flightNumber: 'VS003', departure: 'London', arrival: 'Los Angeles', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '13:00', duration: '10h 30m', price: 520, seats: 250, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF084', departure: 'Paris', arrival: 'Los Angeles', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '12:00', duration: '11h 30m', price: 520, seats: 240, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH456', departure: 'Frankfurt', arrival: 'Los Angeles', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '11:30', duration: '12h 00m', price: 510, seats: 240, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET510', departure: 'Lagos', arrival: 'Los Angeles', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '08:00', duration: '20h 30m', price: 950, seats: 160, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8050', departure: 'Santiago', arrival: 'Los Angeles', departureCountry: 'Chile', arrivalCountry: 'United States', date: '2026-06-10', time: '18:00', duration: '12h 30m', price: 580, seats: 200, class: 'economy', isActive: true },
            { airline: 'Qatar Airways', flightNumber: 'QR741', departure: 'Doha', arrival: 'Los Angeles', departureCountry: 'Qatar', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '17h 00m', price: 750, seats: 240, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO DALLAS (AT&T Stadium)
            // ===================================

            { airline: 'Air Peace', flightNumber: 'P47002', departure: 'Lagos', arrival: 'Dallas', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '21:00', duration: '14h 00m', price: 880, seats: 180, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA193', departure: 'London', arrival: 'Dallas', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '10h 00m', price: 470, seats: 240, class: 'economy', isActive: true },
            { airline: 'Iberia', flightNumber: 'IB6289', departure: 'Madrid', arrival: 'Dallas', departureCountry: 'Spain', arrivalCountry: 'United States', date: '2026-06-10', time: '12:00', duration: '10h 30m', price: 490, seats: 220, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1301', departure: 'Buenos Aires', arrival: 'Dallas', departureCountry: 'Argentina', arrivalCountry: 'United States', date: '2026-06-10', time: '22:00', duration: '12h 00m', price: 700, seats: 200, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV029', departure: 'Bogota', arrival: 'Dallas', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '5h 30m', price: 350, seats: 160, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH440', departure: 'Frankfurt', arrival: 'Dallas', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '11h 00m', price: 500, seats: 220, class: 'economy', isActive: true },
            { airline: 'Aeromexico', flightNumber: 'AM002', departure: 'Mexico City', arrival: 'Dallas', departureCountry: 'Mexico', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '2h 30m', price: 180, seats: 150, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO SAN FRANCISCO (Levis)
            // ===================================

            { airline: 'Japan Airlines', flightNumber: 'JL062', departure: 'Tokyo', arrival: 'San Francisco', departureCountry: 'Japan', arrivalCountry: 'United States', date: '2026-06-10', time: '14:00', duration: '9h 30m', price: 810, seats: 280, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE023', departure: 'Seoul', arrival: 'San Francisco', departureCountry: 'South Korea', arrivalCountry: 'United States', date: '2026-06-10', time: '15:00', duration: '10h 00m', price: 790, seats: 260, class: 'economy', isActive: true },
            { airline: 'Air China', flightNumber: 'CA983', departure: 'Beijing', arrival: 'San Francisco', departureCountry: 'China', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '11h 00m', price: 760, seats: 300, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA285', departure: 'London', arrival: 'San Francisco', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 500, seats: 240, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF082', departure: 'Paris', arrival: 'San Francisco', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '12:00', duration: '11h 30m', price: 520, seats: 240, class: 'economy', isActive: true },
            { airline: 'Air New Zealand', flightNumber: 'NZ007', departure: 'Auckland', arrival: 'San Francisco', departureCountry: 'New Zealand', arrivalCountry: 'United States', date: '2026-06-09', time: '20:00', duration: '12h 00m', price: 1050, seats: 200, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET524', departure: 'Lagos', arrival: 'San Francisco', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '08:00', duration: '21h 00m', price: 1000, seats: 140, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8099', departure: 'Santiago', arrival: 'San Francisco', departureCountry: 'Chile', arrivalCountry: 'United States', date: '2026-06-10', time: '19:00', duration: '12h 00m', price: 600, seats: 200, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO MIAMI (Hard Rock)
            // ===================================

            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1301', departure: 'Buenos Aires', arrival: 'Miami', departureCountry: 'Argentina', arrivalCountry: 'United States', date: '2026-06-10', time: '22:00', duration: '10h 30m', price: 650, seats: 220, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8084', departure: 'Sao Paulo', arrival: 'Miami', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '21:30', duration: '9h 00m', price: 580, seats: 250, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV25', departure: 'Bogota', arrival: 'Miami', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '4h 00m', price: 320, seats: 180, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA2001', departure: 'Lima', arrival: 'Miami', departureCountry: 'Peru', arrivalCountry: 'United States', date: '2026-06-10', time: '23:30', duration: '7h 30m', price: 450, seats: 180, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA502', departure: 'Santiago', arrival: 'Miami', departureCountry: 'Chile', arrivalCountry: 'United States', date: '2026-06-10', time: '20:00', duration: '11h 00m', price: 550, seats: 200, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1401', departure: 'Montevideo', arrival: 'Miami', departureCountry: 'Uruguay', arrivalCountry: 'United States', date: '2026-06-10', time: '23:00', duration: '10h 00m', price: 620, seats: 150, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF068', departure: 'Paris', arrival: 'Miami', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '13:30', duration: '9h 30m', price: 500, seats: 250, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA082', departure: 'London', arrival: 'Miami', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '09:00', duration: '9h 30m', price: 480, seats: 240, class: 'economy', isActive: true },
            { airline: 'South African Airways', flightNumber: 'SA203', departure: 'Johannesburg', arrival: 'Miami', departureCountry: 'South Africa', arrivalCountry: 'United States', date: '2026-06-09', time: '18:00', duration: '18h 30m', price: 1100, seats: 150, class: 'economy', isActive: true },
            { airline: 'American Airlines', flightNumber: 'AA1234', departure: 'Kingston', arrival: 'Miami', departureCountry: 'Jamaica', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '2h 30m', price: 280, seats: 150, class: 'economy', isActive: true },
            { airline: 'Caribbean Airlines', flightNumber: 'BW451', departure: 'Port of Spain', arrival: 'Miami', departureCountry: 'Trinidad and Tobago', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '3h 30m', price: 300, seats: 150, class: 'economy', isActive: true },
            { airline: 'Copa Airlines', flightNumber: 'CM201', departure: 'Panama City', arrival: 'Miami', departureCountry: 'Panama', arrivalCountry: 'United States', date: '2026-06-10', time: '06:00', duration: '2h 45m', price: 250, seats: 160, class: 'economy', isActive: true },
            { airline: 'Copa Airlines', flightNumber: 'CM407', departure: 'San Jose', arrival: 'Miami', departureCountry: 'Costa Rica', arrivalCountry: 'United States', date: '2026-06-10', time: '07:30', duration: '3h 00m', price: 280, seats: 150, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO SEATTLE (Lumen Field)
            // ===================================

            { airline: 'ANA', flightNumber: 'NH007', departure: 'Tokyo', arrival: 'Seattle', departureCountry: 'Japan', arrivalCountry: 'United States', date: '2026-06-10', time: '17:00', duration: '9h 30m', price: 820, seats: 260, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE019', departure: 'Seoul', arrival: 'Seattle', departureCountry: 'South Korea', arrivalCountry: 'United States', date: '2026-06-10', time: '16:00', duration: '9h 30m', price: 780, seats: 260, class: 'economy', isActive: true },
            { airline: 'Air China', flightNumber: 'CA991', departure: 'Beijing', arrival: 'Seattle', departureCountry: 'China', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 750, seats: 280, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA049', departure: 'London', arrival: 'Seattle', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '9h 30m', price: 480, seats: 240, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH490', departure: 'Frankfurt', arrival: 'Seattle', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '10h 30m', price: 500, seats: 220, class: 'economy', isActive: true },
            { airline: 'Air New Zealand', flightNumber: 'NZ010', departure: 'Auckland', arrival: 'Seattle', departureCountry: 'New Zealand', arrivalCountry: 'United States', date: '2026-06-09', time: '19:00', duration: '13h 30m', price: 980, seats: 200, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET518', departure: 'Lagos', arrival: 'Seattle', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '07:00', duration: '22h 00m', price: 1020, seats: 140, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8092', departure: 'Santiago', arrival: 'Seattle', departureCountry: 'Chile', arrivalCountry: 'United States', date: '2026-06-10', time: '18:00', duration: '12h 30m', price: 620, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO ATLANTA (Mercedes-Benz)
            // ===================================

            { airline: 'Delta Airlines', flightNumber: 'DL470', departure: 'Lagos', arrival: 'Atlanta', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '10:00', duration: '12h 00m', price: 860, seats: 180, class: 'economy', isActive: true },
            { airline: 'Delta Airlines', flightNumber: 'DL472', departure: 'Accra', arrival: 'Atlanta', departureCountry: 'Ghana', arrivalCountry: 'United States', date: '2026-06-09', time: '21:00', duration: '11h 30m', price: 890, seats: 180, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF682', departure: 'Paris', arrival: 'Atlanta', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '9h 30m', price: 490, seats: 240, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA221', departure: 'London', arrival: 'Atlanta', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '9h 00m', price: 460, seats: 260, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH466', departure: 'Frankfurt', arrival: 'Atlanta', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '11:30', duration: '10h 00m', price: 500, seats: 220, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8094', departure: 'Sao Paulo', arrival: 'Atlanta', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '19:00', duration: '9h 30m', price: 590, seats: 220, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV064', departure: 'Bogota', arrival: 'Atlanta', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '4h 00m', price: 300, seats: 180, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE037', departure: 'Seoul', arrival: 'Atlanta', departureCountry: 'South Korea', arrivalCountry: 'United States', date: '2026-06-10', time: '17:00', duration: '13h 00m', price: 840, seats: 240, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO HOUSTON (NRG Stadium)
            // ===================================

            { airline: 'Air Peace', flightNumber: 'P47003', departure: 'Lagos', arrival: 'Houston', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '21:00', duration: '13h 00m', price: 880, seats: 200, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA195', departure: 'London', arrival: 'Houston', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 480, seats: 240, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF742', departure: 'Paris', arrival: 'Houston', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '13:00', duration: '11h 00m', price: 500, seats: 220, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8060', departure: 'Sao Paulo', arrival: 'Houston', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '19:00', duration: '10h 30m', price: 620, seats: 220, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV030', departure: 'Bogota', arrival: 'Houston', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '4h 30m', price: 350, seats: 160, class: 'economy', isActive: true },
            { airline: 'United Airlines', flightNumber: 'UA1502', departure: 'Tegucigalpa', arrival: 'Houston', departureCountry: 'Honduras', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '3h 30m', price: 260, seats: 140, class: 'economy', isActive: true },
            { airline: 'Aeromexico', flightNumber: 'AM004', departure: 'Mexico City', arrival: 'Houston', departureCountry: 'Mexico', arrivalCountry: 'United States', date: '2026-06-10', time: '09:00', duration: '2h 15m', price: 160, seats: 150, class: 'economy', isActive: true },
            { airline: 'Qatar Airways', flightNumber: 'QR773', departure: 'Doha', arrival: 'Houston', departureCountry: 'Qatar', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '15h 30m', price: 740, seats: 220, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO PHILADELPHIA
            // ===================================

            { airline: 'British Airways', flightNumber: 'BA177', departure: 'London', arrival: 'Philadelphia', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '09:00', duration: '7h 30m', price: 440, seats: 240, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF072', departure: 'Paris', arrival: 'Philadelphia', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '10:30', duration: '8h 00m', price: 460, seats: 220, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH416', departure: 'Frankfurt', arrival: 'Philadelphia', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '8h 30m', price: 470, seats: 220, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET516', departure: 'Lagos', arrival: 'Philadelphia', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '09:00', duration: '13h 00m', price: 870, seats: 160, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8090', departure: 'Sao Paulo', arrival: 'Philadelphia', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '20:00', duration: '10h 00m', price: 600, seats: 200, class: 'economy', isActive: true },
            { airline: 'Royal Air Maroc', flightNumber: 'AT206', departure: 'Casablanca', arrival: 'Philadelphia', departureCountry: 'Morocco', arrivalCountry: 'United States', date: '2026-06-09', time: '12:00', duration: '9h 00m', price: 840, seats: 180, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV062', departure: 'Bogota', arrival: 'Philadelphia', departureCountry: 'Colombia', arrivalCountry: 'United States', date: '2026-06-10', time: '07:00', duration: '5h 30m', price: 380, seats: 160, class: 'economy', isActive: true },
            { airline: 'Turkish Airlines', flightNumber: 'TK012', departure: 'Istanbul', arrival: 'Philadelphia', departureCountry: 'Turkey', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '11h 00m', price: 580, seats: 200, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO KANSAS CITY
            // ===================================

            { airline: 'British Airways', flightNumber: 'BA183', departure: 'London', arrival: 'Kansas City', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '9h 00m', price: 470, seats: 200, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH492', departure: 'Frankfurt', arrival: 'Kansas City', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '10:30', duration: '10h 00m', price: 490, seats: 180, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF688', departure: 'Paris', arrival: 'Kansas City', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 480, seats: 200, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET520', departure: 'Lagos', arrival: 'Kansas City', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '08:00', duration: '14h 00m', price: 900, seats: 140, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1201', departure: 'Buenos Aires', arrival: 'Kansas City', departureCountry: 'Argentina', arrivalCountry: 'United States', date: '2026-06-10', time: '21:00', duration: '12h 00m', price: 670, seats: 180, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8096', departure: 'Sao Paulo', arrival: 'Kansas City', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '20:00', duration: '11h 00m', price: 610, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO BOSTON (Gillette)
            // ===================================

            { airline: 'British Airways', flightNumber: 'BA213', departure: 'London', arrival: 'Boston', departureCountry: 'England', arrivalCountry: 'United States', date: '2026-06-10', time: '09:30', duration: '7h 00m', price: 430, seats: 260, class: 'economy', isActive: true },
            { airline: 'Aer Lingus', flightNumber: 'EI137', departure: 'Dublin', arrival: 'Boston', departureCountry: 'Ireland', arrivalCountry: 'United States', date: '2026-06-10', time: '08:00', duration: '7h 30m', price: 420, seats: 200, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF334', departure: 'Paris', arrival: 'Boston', departureCountry: 'France', arrivalCountry: 'United States', date: '2026-06-10', time: '10:00', duration: '7h 30m', price: 460, seats: 240, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH424', departure: 'Frankfurt', arrival: 'Boston', departureCountry: 'Germany', arrivalCountry: 'United States', date: '2026-06-10', time: '10:30', duration: '8h 30m', price: 480, seats: 220, class: 'economy', isActive: true },
            { airline: 'TAP Air Portugal', flightNumber: 'TP218', departure: 'Lisbon', arrival: 'Boston', departureCountry: 'Portugal', arrivalCountry: 'United States', date: '2026-06-10', time: '11:00', duration: '7h 00m', price: 410, seats: 220, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET522', departure: 'Lagos', arrival: 'Boston', departureCountry: 'Nigeria', arrivalCountry: 'United States', date: '2026-06-09', time: '09:00', duration: '12h 30m', price: 860, seats: 160, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8098', departure: 'Sao Paulo', arrival: 'Boston', departureCountry: 'Brazil', arrivalCountry: 'United States', date: '2026-06-10', time: '21:00', duration: '10h 00m', price: 590, seats: 200, class: 'economy', isActive: true },
            { airline: 'Japan Airlines', flightNumber: 'JL008', departure: 'Tokyo', arrival: 'Boston', departureCountry: 'Japan', arrivalCountry: 'United States', date: '2026-06-10', time: '16:00', duration: '13h 30m', price: 870, seats: 220, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO MEXICO CITY (Azteca)
            // ===================================

            { airline: 'Ethiopian Airlines', flightNumber: 'ET512', departure: 'Lagos', arrival: 'Mexico City', departureCountry: 'Nigeria', arrivalCountry: 'Mexico', date: '2026-06-09', time: '08:00', duration: '16h 30m', price: 980, seats: 160, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA243', departure: 'London', arrival: 'Mexico City', departureCountry: 'England', arrivalCountry: 'Mexico', date: '2026-06-09', time: '12:00', duration: '11h 30m', price: 680, seats: 240, class: 'economy', isActive: true },
            { airline: 'Iberia', flightNumber: 'IB6403', departure: 'Madrid', arrival: 'Mexico City', departureCountry: 'Spain', arrivalCountry: 'Mexico', date: '2026-06-09', time: '11:00', duration: '11h 00m', price: 650, seats: 260, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF178', departure: 'Paris', arrival: 'Mexico City', departureCountry: 'France', arrivalCountry: 'Mexico', date: '2026-06-09', time: '13:30', duration: '12h 00m', price: 700, seats: 240, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1101', departure: 'Buenos Aires', arrival: 'Mexico City', departureCountry: 'Argentina', arrivalCountry: 'Mexico', date: '2026-06-09', time: '22:00', duration: '8h 30m', price: 480, seats: 200, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8001', departure: 'Sao Paulo', arrival: 'Mexico City', departureCountry: 'Brazil', arrivalCountry: 'Mexico', date: '2026-06-09', time: '20:00', duration: '8h 00m', price: 450, seats: 220, class: 'economy', isActive: true },
            { airline: 'Avianca', flightNumber: 'AV56', departure: 'Bogota', arrival: 'Mexico City', departureCountry: 'Colombia', arrivalCountry: 'Mexico', date: '2026-06-09', time: '08:00', duration: '4h 30m', price: 280, seats: 180, class: 'economy', isActive: true },
            { airline: 'Japan Airlines', flightNumber: 'JL057', departure: 'Tokyo', arrival: 'Mexico City', departureCountry: 'Japan', arrivalCountry: 'Mexico', date: '2026-06-09', time: '17:00', duration: '13h 30m', price: 900, seats: 200, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE057', departure: 'Seoul', arrival: 'Mexico City', departureCountry: 'South Korea', arrivalCountry: 'Mexico', date: '2026-06-09', time: '18:00', duration: '14h 00m', price: 880, seats: 200, class: 'economy', isActive: true },
            { airline: 'Qatar Airways', flightNumber: 'QR775', departure: 'Doha', arrival: 'Mexico City', departureCountry: 'Qatar', arrivalCountry: 'Mexico', date: '2026-06-09', time: '07:00', duration: '16h 00m', price: 820, seats: 200, class: 'economy', isActive: true },
            { airline: 'Delta Airlines', flightNumber: 'DL452', departure: 'Accra', arrival: 'Mexico City', departureCountry: 'Ghana', arrivalCountry: 'Mexico', date: '2026-06-09', time: '20:00', duration: '14h 30m', price: 950, seats: 150, class: 'economy', isActive: true },
            { airline: 'Royal Air Maroc', flightNumber: 'AT204', departure: 'Casablanca', arrival: 'Mexico City', departureCountry: 'Morocco', arrivalCountry: 'Mexico', date: '2026-06-09', time: '10:00', duration: '13h 00m', price: 860, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO GUADALAJARA (Akron)
            // ===================================

            { airline: 'Air France', flightNumber: 'AF180', departure: 'Paris', arrival: 'Guadalajara', departureCountry: 'France', arrivalCountry: 'Mexico', date: '2026-06-09', time: '14:00', duration: '12h 30m', price: 720, seats: 200, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8005', departure: 'Sao Paulo', arrival: 'Guadalajara', departureCountry: 'Brazil', arrivalCountry: 'Mexico', date: '2026-06-09', time: '21:00', duration: '8h 30m', price: 470, seats: 200, class: 'economy', isActive: true },
            { airline: 'Copa Airlines', flightNumber: 'CM301', departure: 'Panama City', arrival: 'Guadalajara', departureCountry: 'Panama', arrivalCountry: 'Mexico', date: '2026-06-10', time: '07:00', duration: '3h 30m', price: 240, seats: 150, class: 'economy', isActive: true },
            { airline: 'Iberia', flightNumber: 'IB6405', departure: 'Madrid', arrival: 'Guadalajara', departureCountry: 'Spain', arrivalCountry: 'Mexico', date: '2026-06-09', time: '12:00', duration: '11h 30m', price: 670, seats: 200, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET513', departure: 'Lagos', arrival: 'Guadalajara', departureCountry: 'Nigeria', arrivalCountry: 'Mexico', date: '2026-06-09', time: '09:00', duration: '17h 00m', price: 990, seats: 140, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1103', departure: 'Buenos Aires', arrival: 'Guadalajara', departureCountry: 'Argentina', arrivalCountry: 'Mexico', date: '2026-06-09', time: '21:00', duration: '9h 00m', price: 490, seats: 180, class: 'economy', isActive: true },
            { airline: 'Japan Airlines', flightNumber: 'JL059', departure: 'Tokyo', arrival: 'Guadalajara', departureCountry: 'Japan', arrivalCountry: 'Mexico', date: '2026-06-09', time: '16:00', duration: '14h 00m', price: 920, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO MONTERREY (BBVA)
            // ===================================

            { airline: 'Iberia', flightNumber: 'IB6441', departure: 'Madrid', arrival: 'Monterrey', departureCountry: 'Spain', arrivalCountry: 'Mexico', date: '2026-06-09', time: '12:00', duration: '11h 30m', price: 670, seats: 200, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1105', departure: 'Buenos Aires', arrival: 'Monterrey', departureCountry: 'Argentina', arrivalCountry: 'Mexico', date: '2026-06-09', time: '20:00', duration: '9h 30m', price: 500, seats: 180, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET515', departure: 'Lagos', arrival: 'Monterrey', departureCountry: 'Nigeria', arrivalCountry: 'Mexico', date: '2026-06-09', time: '10:00', duration: '17h 30m', price: 1000, seats: 140, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF182', departure: 'Paris', arrival: 'Monterrey', departureCountry: 'France', arrivalCountry: 'Mexico', date: '2026-06-09', time: '13:00', duration: '12h 30m', price: 730, seats: 180, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8007', departure: 'Sao Paulo', arrival: 'Monterrey', departureCountry: 'Brazil', arrivalCountry: 'Mexico', date: '2026-06-09', time: '20:00', duration: '9h 00m', price: 480, seats: 180, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH442', departure: 'Frankfurt', arrival: 'Monterrey', departureCountry: 'Germany', arrivalCountry: 'Mexico', date: '2026-06-09', time: '11:00', duration: '12h 00m', price: 510, seats: 180, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE059', departure: 'Seoul', arrival: 'Monterrey', departureCountry: 'South Korea', arrivalCountry: 'Mexico', date: '2026-06-09', time: '17:00', duration: '15h 00m', price: 900, seats: 180, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO TORONTO (BMO Field)
            // ===================================

            { airline: 'Air Peace', flightNumber: 'P47004', departure: 'Lagos', arrival: 'Toronto', departureCountry: 'Nigeria', arrivalCountry: 'Canada', date: '2026-06-09', time: '22:00', duration: '11h 30m', price: 870, seats: 180, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA091', departure: 'London', arrival: 'Toronto', departureCountry: 'England', arrivalCountry: 'Canada', date: '2026-06-10', time: '09:00', duration: '8h 00m', price: 480, seats: 260, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF342', departure: 'Paris', arrival: 'Toronto', departureCountry: 'France', arrivalCountry: 'Canada', date: '2026-06-10', time: '10:00', duration: '8h 30m', price: 500, seats: 240, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH470', departure: 'Frankfurt', arrival: 'Toronto', departureCountry: 'Germany', arrivalCountry: 'Canada', date: '2026-06-10', time: '11:00', duration: '9h 00m', price: 510, seats: 240, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8100', departure: 'Sao Paulo', arrival: 'Toronto', departureCountry: 'Brazil', arrivalCountry: 'Canada', date: '2026-06-10', time: '22:00', duration: '10h 00m', price: 600, seats: 200, class: 'economy', isActive: true },
            { airline: 'Delta Airlines', flightNumber: 'DL460', departure: 'Accra', arrival: 'Toronto', departureCountry: 'Ghana', arrivalCountry: 'Canada', date: '2026-06-09', time: '21:00', duration: '12h 00m', price: 920, seats: 150, class: 'economy', isActive: true },
            { airline: 'Japan Airlines', flightNumber: 'JL060', departure: 'Tokyo', arrival: 'Toronto', departureCountry: 'Japan', arrivalCountry: 'Canada', date: '2026-06-10', time: '16:00', duration: '12h 30m', price: 860, seats: 200, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE073', departure: 'Seoul', arrival: 'Toronto', departureCountry: 'South Korea', arrivalCountry: 'Canada', date: '2026-06-10', time: '17:00', duration: '13h 00m', price: 840, seats: 200, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1107', departure: 'Buenos Aires', arrival: 'Toronto', departureCountry: 'Argentina', arrivalCountry: 'Canada', date: '2026-06-10', time: '21:00', duration: '13h 00m', price: 720, seats: 180, class: 'economy', isActive: true },
            { airline: 'ITA Airways', flightNumber: 'AZ610', departure: 'Rome', arrival: 'Toronto', departureCountry: 'Italy', arrivalCountry: 'Canada', date: '2026-06-10', time: '10:00', duration: '10h 00m', price: 490, seats: 200, class: 'economy', isActive: true },
            { airline: 'Royal Air Maroc', flightNumber: 'AT208', departure: 'Casablanca', arrival: 'Toronto', departureCountry: 'Morocco', arrivalCountry: 'Canada', date: '2026-06-09', time: '13:00', duration: '10h 00m', price: 850, seats: 160, class: 'economy', isActive: true },

            // ===================================
            // 🌍 FLIGHTS TO VANCOUVER (BC Place)
            // ===================================

            { airline: 'Air New Zealand', flightNumber: 'NZ005', departure: 'Auckland', arrival: 'Vancouver', departureCountry: 'New Zealand', arrivalCountry: 'Canada', date: '2026-06-09', time: '20:00', duration: '14h 00m', price: 950, seats: 200, class: 'economy', isActive: true },
            { airline: 'British Airways', flightNumber: 'BA093', departure: 'London', arrival: 'Vancouver', departureCountry: 'England', arrivalCountry: 'Canada', date: '2026-06-10', time: '10:00', duration: '9h 30m', price: 500, seats: 240, class: 'economy', isActive: true },
            { airline: 'Lufthansa', flightNumber: 'LH480', departure: 'Frankfurt', arrival: 'Vancouver', departureCountry: 'Germany', arrivalCountry: 'Canada', date: '2026-06-10', time: '11:30', duration: '10h 00m', price: 520, seats: 220, class: 'economy', isActive: true },
            { airline: 'Korean Air', flightNumber: 'KE073', departure: 'Seoul', arrival: 'Vancouver', departureCountry: 'South Korea', arrivalCountry: 'Canada', date: '2026-06-10', time: '17:00', duration: '9h 30m', price: 780, seats: 240, class: 'economy', isActive: true },
            { airline: 'Japan Airlines', flightNumber: 'JL016', departure: 'Tokyo', arrival: 'Vancouver', departureCountry: 'Japan', arrivalCountry: 'Canada', date: '2026-06-10', time: '16:30', duration: '9h 00m', price: 760, seats: 260, class: 'economy', isActive: true },
            { airline: 'Air China', flightNumber: 'CA837', departure: 'Beijing', arrival: 'Vancouver', departureCountry: 'China', arrivalCountry: 'Canada', date: '2026-06-10', time: '10:00', duration: '10h 00m', price: 720, seats: 280, class: 'economy', isActive: true },
            { airline: 'Ethiopian Airlines', flightNumber: 'ET514', departure: 'Lagos', arrival: 'Vancouver', departureCountry: 'Nigeria', arrivalCountry: 'Canada', date: '2026-06-09', time: '07:00', duration: '22h 00m', price: 1050, seats: 150, class: 'economy', isActive: true },
            { airline: 'Air France', flightNumber: 'AF346', departure: 'Paris', arrival: 'Vancouver', departureCountry: 'France', arrivalCountry: 'Canada', date: '2026-06-10', time: '11:00', duration: '10h 30m', price: 520, seats: 220, class: 'economy', isActive: true },
            { airline: 'LATAM Airlines', flightNumber: 'LA8102', departure: 'Santiago', arrival: 'Vancouver', departureCountry: 'Chile', arrivalCountry: 'Canada', date: '2026-06-10', time: '19:00', duration: '13h 00m', price: 640, seats: 180, class: 'economy', isActive: true },
            { airline: 'Aerolíneas Argentinas', flightNumber: 'AR1109', departure: 'Buenos Aires', arrival: 'Vancouver', departureCountry: 'Argentina', arrivalCountry: 'Canada', date: '2026-06-10', time: '20:00', duration: '14h 00m', price: 730, seats: 160, class: 'economy', isActive: true }

        ];

        // Insert hotels
        const createdHotels = await Hotel.insertMany(hotels);
        console.log(`✅ Added ${createdHotels.length} hotels`);

        // Insert flights
        const createdFlights = await Flight.insertMany(flights);
        console.log(`✅ Added ${createdFlights.length} flights`);

        // Summary
        const hotelCities = [...new Set(createdHotels.map(h => h.city))];
        const flightDestinations = [...new Set(createdFlights.map(f => f.arrival))];
        const flightOrigins = [...new Set(createdFlights.map(f => f.departure))];

        res.json({
            success: true,
            message: '✅ Full World Cup 2026 data seeded!',
            summary: {
                hotels: {
                    count: createdHotels.length,
                    cities: hotelCities
                },
                flights: {
                    count: createdFlights.length,
                    destinations: flightDestinations,
                    origins: flightOrigins,
                    countries: [...new Set(createdFlights.map(f => f.departureCountry))].length
                }
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
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