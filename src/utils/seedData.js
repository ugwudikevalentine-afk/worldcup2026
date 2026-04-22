import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/match.js';
import User from '../models/user.js';
import Hotel from '../models/hotel.js';
import Flight from '../models/flight.js';
import Extra from '../models/extra.js';

dotenv.config();

// ===== MATCHES DATA =====
const matches = [
    {
        team1: 'Argentina',
        team2: 'France',
        date: '2026-06-15',
        time: '20:00',
        stadium: 'MetLife Stadium',
        city: 'East Rutherford',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'D',
        tickets_available: 2500,
        ticket_prices: { vip: 500, premium: 300, regular: 150 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Brazil',
        team2: 'Germany',
        date: '2026-06-16',
        time: '18:00',
        stadium: 'AT&T Stadium',
        city: 'Arlington',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'E',
        tickets_available: 3000,
        ticket_prices: { vip: 550, premium: 320, regular: 180 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Spain',
        team2: 'England',
        date: '2026-06-17',
        time: '20:00',
        stadium: 'SoFi Stadium',
        city: 'Los Angeles',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'F',
        tickets_available: 2800,
        ticket_prices: { vip: 480, premium: 280, regular: 140 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'USA',
        team2: 'Mexico',
        date: '2026-06-18',
        time: '19:00',
        stadium: 'Arrowhead Stadium',
        city: 'Kansas City',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'B',
        tickets_available: 4000,
        ticket_prices: { vip: 600, premium: 350, regular: 200 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Portugal',
        team2: 'Netherlands',
        date: '2026-06-19',
        time: '17:00',
        stadium: 'Lincoln Financial Field',
        city: 'Philadelphia',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'G',
        tickets_available: 3500,
        ticket_prices: { vip: 450, premium: 260, regular: 130 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Italy',
        team2: 'Belgium',
        date: '2026-06-20',
        time: '21:00',
        stadium: 'Lumen Field',
        city: 'Seattle',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'H',
        tickets_available: 3200,
        ticket_prices: { vip: 420, premium: 240, regular: 120 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Canada',
        team2: 'Japan',
        date: '2026-06-21',
        time: '16:00',
        stadium: 'BMO Field',
        city: 'Toronto',
        hostCountry: 'Canada',
        stage: 'Group Stage',
        group: 'C',
        tickets_available: 2000,
        ticket_prices: { vip: 380, premium: 220, regular: 110 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'South Korea',
        team2: 'Uruguay',
        date: '2026-06-22',
        time: '19:00',
        stadium: 'Hard Rock Stadium',
        city: 'Miami',
        hostCountry: 'USA',
        stage: 'Group Stage',
        group: 'I',
        tickets_available: 2700,
        ticket_prices: { vip: 400, premium: 230, regular: 115 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== MEXICO MATCHES =====
    {
        team1: 'Mexico',
        team2: 'TBD',
        date: '2026-06-11',
        time: '19:00',
        stadium: 'Estadio Azteca',
        city: 'Mexico City',
        hostCountry: 'Mexico',
        stage: 'Group Stage',
        group: 'A',
        tickets_available: 80000,
        ticket_prices: { vip: 800, premium: 500, regular: 200 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Mexico',
        team2: 'TBD',
        date: '2026-06-18',
        time: '18:00',
        stadium: 'Estadio BBVA',
        city: 'Monterrey',
        hostCountry: 'Mexico',
        stage: 'Group Stage',
        group: 'A',
        tickets_available: 53000,
        ticket_prices: { vip: 650, premium: 400, regular: 160 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'TBD',
        team2: 'TBD',
        date: '2026-06-19',
        time: '17:00',
        stadium: 'Estadio Akron',
        city: 'Guadalajara',
        hostCountry: 'Mexico',
        stage: 'Group Stage',
        group: 'A',
        tickets_available: 49000,
        ticket_prices: { vip: 600, premium: 350, regular: 150 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== CANADA MATCHES =====
    {
        team1: 'Canada',
        team2: 'TBD',
        date: '2026-06-12',
        time: '17:00',
        stadium: 'BMO Field',
        city: 'Toronto',
        hostCountry: 'Canada',
        stage: 'Group Stage',
        group: 'C',
        tickets_available: 30000,
        ticket_prices: { vip: 700, premium: 420, regular: 170 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'Canada',
        team2: 'TBD',
        date: '2026-06-20',
        time: '19:00',
        stadium: 'BC Place',
        city: 'Vancouver',
        hostCountry: 'Canada',
        stage: 'Group Stage',
        group: 'C',
        tickets_available: 54000,
        ticket_prices: { vip: 700, premium: 420, regular: 170 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== ROUND OF 16 =====
    {
        team1: '1st Group A',
        team2: '2nd Group B',
        date: '2026-07-04',
        time: '18:00',
        stadium: 'MetLife Stadium',
        city: 'East Rutherford',
        hostCountry: 'USA',
        stage: 'Round of 16',
        tickets_available: 82000,
        ticket_prices: { vip: 1000, premium: 600, regular: 250 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: '1st Group C',
        team2: '2nd Group D',
        date: '2026-07-05',
        time: '14:00',
        stadium: 'AT&T Stadium',
        city: 'Arlington',
        hostCountry: 'USA',
        stage: 'Round of 16',
        tickets_available: 80000,
        ticket_prices: { vip: 1000, premium: 600, regular: 250 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== QUARTER-FINALS =====
    {
        team1: 'QF Team A',
        team2: 'QF Team B',
        date: '2026-07-10',
        time: '18:00',
        stadium: 'SoFi Stadium',
        city: 'Los Angeles',
        hostCountry: 'USA',
        stage: 'Quarter-Final',
        tickets_available: 70000,
        ticket_prices: { vip: 1200, premium: 750, regular: 300 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'QF Team C',
        team2: 'QF Team D',
        date: '2026-07-11',
        time: '14:00',
        stadium: 'Hard Rock Stadium',
        city: 'Miami',
        hostCountry: 'USA',
        stage: 'Quarter-Final',
        tickets_available: 65000,
        ticket_prices: { vip: 1200, premium: 750, regular: 300 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== SEMI-FINALS =====
    {
        team1: 'SF Team A',
        team2: 'SF Team B',
        date: '2026-07-14',
        time: '20:00',
        stadium: 'MetLife Stadium',
        city: 'East Rutherford',
        hostCountry: 'USA',
        stage: 'Semi-Final',
        tickets_available: 82000,
        ticket_prices: { vip: 1500, premium: 900, regular: 400 },
        status: 'upcoming',
        source: 'manual'
    },
    {
        team1: 'SF Team C',
        team2: 'SF Team D',
        date: '2026-07-15',
        time: '20:00',
        stadium: 'AT&T Stadium',
        city: 'Arlington',
        hostCountry: 'USA',
        stage: 'Semi-Final',
        tickets_available: 80000,
        ticket_prices: { vip: 1500, premium: 900, regular: 400 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== THIRD PLACE =====
    {
        team1: '3rd Place Team A',
        team2: '3rd Place Team B',
        date: '2026-07-18',
        time: '18:00',
        stadium: 'Hard Rock Stadium',
        city: 'Miami',
        hostCountry: 'USA',
        stage: 'Third Place',
        tickets_available: 65000,
        ticket_prices: { vip: 1000, premium: 600, regular: 250 },
        status: 'upcoming',
        source: 'manual'
    },
    // ===== THE FINAL =====
    {
        team1: 'Finalist A',
        team2: 'Finalist B',
        date: '2026-07-19',
        time: '20:00',
        stadium: 'MetLife Stadium',
        city: 'East Rutherford',
        hostCountry: 'USA',
        stage: 'Final',
        tickets_available: 82000,
        ticket_prices: { vip: 3000, premium: 1800, regular: 800 },
        status: 'upcoming',
        source: 'manual'
    }
];

// ===== HOTELS DATA =====
const hotels = [
    {
        name: 'Luxury World Cup Hotel',
        city: 'New York',
        country: 'USA',
        address: '123 Stadium Avenue',
        rating: 5,
        price_per_night: 450,
        distance_to_stadium: '2 km',
        rooms: 200,
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service'],
        description: 'Luxury 5-star hotel just steps from MetLife Stadium',
        isActive: true
    },
    {
        name: 'Premium Stadium View Hotel',
        city: 'New York',
        country: 'USA',
        address: '456 Sports Blvd',
        rating: 4.5,
        price_per_night: 320,
        distance_to_stadium: '5 km',
        rooms: 350,
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'],
        description: 'Premium hotel with stunning stadium views',
        isActive: true
    },
    {
        name: 'Budget Friendly Inn',
        city: 'New York',
        country: 'USA',
        address: '789 Economy Lane',
        rating: 3.5,
        price_per_night: 120,
        distance_to_stadium: '10 km',
        rooms: 500,
        amenities: ['WiFi', 'Parking', 'Breakfast'],
        description: 'Affordable accommodation for budget travelers',
        isActive: true
    },
    {
        name: 'Dallas Grand Hotel',
        city: 'Dallas',
        country: 'USA',
        address: '100 Texas Way',
        rating: 5,
        price_per_night: 480,
        distance_to_stadium: '3 km',
        rooms: 280,
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
        description: 'Luxury hotel in the heart of Dallas',
        isActive: true
    },
    {
        name: 'Dallas Stadium Hotel',
        city: 'Dallas',
        country: 'USA',
        address: '200 AT&T Plaza',
        rating: 4,
        price_per_night: 280,
        distance_to_stadium: '1 km',
        rooms: 400,
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Shuttle'],
        description: 'Walking distance to AT&T Stadium',
        isActive: true
    },
    {
        name: 'LA Sunset Resort',
        city: 'Los Angeles',
        country: 'USA',
        address: '500 Hollywood Blvd',
        rating: 4.5,
        price_per_night: 380,
        distance_to_stadium: '8 km',
        rooms: 320,
        amenities: ['WiFi', 'Pool', 'Spa', 'Beach Access', 'Restaurant'],
        description: 'Beautiful resort with California sunshine',
        isActive: true
    },
    {
        name: 'Miami Beach Hotel',
        city: 'Miami',
        country: 'USA',
        address: '888 Ocean Drive',
        rating: 4.5,
        price_per_night: 350,
        distance_to_stadium: '6 km',
        rooms: 250,
        amenities: ['WiFi', 'Pool', 'Beach', 'Spa', 'Restaurant'],
        description: 'Beachfront luxury in Miami',
        isActive: true
    },
    {
        name: 'Seattle Downtown Hotel',
        city: 'Seattle',
        country: 'USA',
        address: '300 Pike Street',
        rating: 4,
        price_per_night: 260,
        distance_to_stadium: '4 km',
        rooms: 180,
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Coffee Bar'],
        description: 'Modern hotel in downtown Seattle',
        isActive: true
    }
];

// ===== FLIGHTS DATA =====
const flights = [
    {
        airline: 'American Airlines',
        flightNumber: 'AA1234',
        departure: 'New York',
        arrival: 'Dallas',
        date: '2026-06-14',
        time: '08:00',
        duration: '3h 30m',
        price: 450,
        seats: 120,
        isActive: true
    },
    {
        airline: 'United Airlines',
        flightNumber: 'UA5678',
        departure: 'Los Angeles',
        arrival: 'Dallas',
        date: '2026-06-14',
        time: '10:30',
        duration: '2h 45m',
        price: 380,
        seats: 95,
        isActive: true
    },
    {
        airline: 'Delta Airlines',
        flightNumber: 'DL9012',
        departure: 'Miami',
        arrival: 'Dallas',
        date: '2026-06-14',
        time: '12:00',
        duration: '3h 00m',
        price: 320,
        seats: 150,
        isActive: true
    },
    {
        airline: 'Southwest Airlines',
        flightNumber: 'WN3456',
        departure: 'Chicago',
        arrival: 'Dallas',
        date: '2026-06-14',
        time: '14:00',
        duration: '2h 30m',
        price: 290,
        seats: 180,
        isActive: true
    },
    {
        airline: 'JetBlue',
        flightNumber: 'B61234',
        departure: 'Boston',
        arrival: 'New York',
        date: '2026-06-14',
        time: '07:00',
        duration: '1h 15m',
        price: 180,
        seats: 100,
        isActive: true
    },
    {
        airline: 'American Airlines',
        flightNumber: 'AA5555',
        departure: 'Dallas',
        arrival: 'Los Angeles',
        date: '2026-06-16',
        time: '09:00',
        duration: '2h 45m',
        price: 350,
        seats: 110,
        isActive: true
    },
    {
        airline: 'United Airlines',
        flightNumber: 'UA7777',
        departure: 'Seattle',
        arrival: 'Los Angeles',
        date: '2026-06-16',
        time: '11:00',
        duration: '2h 30m',
        price: 280,
        seats: 85,
        isActive: true
    },
    {
        airline: 'Delta Airlines',
        flightNumber: 'DL8888',
        departure: 'Atlanta',
        arrival: 'Miami',
        date: '2026-06-20',
        time: '13:30',
        duration: '1h 45m',
        price: 220,
        seats: 130,
        isActive: true
    },
    {
        airline: 'Air Canada',
        flightNumber: 'AC1001',
        departure: 'Toronto',
        arrival: 'New York',
        date: '2026-06-14',
        time: '08:30',
        duration: '1h 30m',
        price: 250,
        seats: 90,
        isActive: true
    },
    {
        airline: 'Aeromexico',
        flightNumber: 'AM2002',
        departure: 'Mexico City',
        arrival: 'Dallas',
        date: '2026-06-17',
        time: '10:00',
        duration: '2h 15m',
        price: 300,
        seats: 100,
        isActive: true
    }
];

// ===== EXTRAS DATA =====
const extras = [
    {
        name: 'Stadium Parking',
        type: 'parking',
        description: 'Official stadium parking lot with easy access to entrances',
        price: 50,
        priceType: 'per_day',
        location: 'Stadium Lot A',
        available: 500,
        isActive: true
    },
    {
        name: 'VIP Parking',
        type: 'parking',
        description: 'Premium parking with valet service and closest spots',
        price: 100,
        priceType: 'per_day',
        location: 'VIP Lot',
        available: 100,
        isActive: true
    },
    {
        name: 'Economy SUV Rental',
        type: 'car_rental',
        description: 'Spacious SUV perfect for families, seats 7',
        price: 120,
        priceType: 'per_day',
        location: 'Airport/Hotel Pickup',
        available: 50,
        isActive: true
    },
    {
        name: 'Luxury Sedan Rental',
        type: 'car_rental',
        description: 'Premium sedan with leather interior and GPS',
        price: 180,
        priceType: 'per_day',
        location: 'Airport/Hotel Pickup',
        available: 30,
        isActive: true
    },
    {
        name: 'Compact Car Rental',
        type: 'car_rental',
        description: 'Fuel-efficient compact car for city driving',
        price: 80,
        priceType: 'per_day',
        location: 'Airport/Hotel Pickup',
        available: 80,
        isActive: true
    },
    {
        name: 'Stadium Tour',
        type: 'tour',
        description: '2-hour behind-the-scenes tour including locker rooms and field access',
        price: 75,
        priceType: 'per_person',
        duration: '2 hours',
        location: 'Stadium Main Entrance',
        available: 200,
        isActive: true
    },
    {
        name: 'City Sightseeing Tour',
        type: 'tour',
        description: 'Full day guided tour of city highlights and landmarks',
        price: 95,
        priceType: 'per_person',
        duration: '6 hours',
        location: 'Hotel Pickup',
        available: 150,
        isActive: true
    },
    {
        name: 'Fan Experience Package',
        type: 'experience',
        description: 'Photo with World Cup trophy replica, official jersey, and VIP lounge access',
        price: 150,
        priceType: 'per_person',
        location: 'Fan Zone',
        available: 100,
        isActive: true
    },
    {
        name: 'Meet & Greet Package',
        type: 'experience',
        description: 'Meet former World Cup legends and get autographs',
        price: 250,
        priceType: 'per_person',
        location: 'VIP Area',
        available: 50,
        isActive: true
    },
    {
        name: 'Airport Shuttle',
        type: 'transport',
        description: 'Round-trip shuttle service from airport to hotel',
        price: 45,
        priceType: 'per_person',
        location: 'Airport',
        available: 500,
        isActive: true
    },
    {
        name: 'Match Day Shuttle',
        type: 'transport',
        description: 'Round-trip shuttle from hotel to stadium on match day',
        price: 25,
        priceType: 'per_person',
        location: 'Hotel Lobby',
        available: 300,
        isActive: true
    },
    {
        name: 'Official Team Jersey',
        type: 'merchandise',
        description: 'Authentic FIFA World Cup 2026 team jersey',
        price: 120,
        priceType: 'per_item',
        location: 'Official Store',
        available: 1000,
        isActive: true
    },
    {
        name: 'World Cup Souvenir Pack',
        type: 'merchandise',
        description: 'Includes scarf, cap, keychain, and mini ball',
        price: 65,
        priceType: 'per_item',
        location: 'Official Store',
        available: 500,
        isActive: true
    }
];

// ===== ADMIN USER =====
const adminUser = {
    name: 'Admin',
    email: 'admin@worldcup2026.com',
    whatsapp: '16154145082',
    password: 'admin123456',
    role: 'admin'
};

// ===== SEED DATABASE =====
const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await Match.deleteMany({});
        await Hotel.deleteMany({});
        await Flight.deleteMany({});
        await Extra.deleteMany({});
        console.log('✅ Cleared existing data');

        // Insert matches
        const createdMatches = await Match.insertMany(matches);
        console.log(`✅ Added ${createdMatches.length} matches`);

        // Insert hotels
        const createdHotels = await Hotel.insertMany(hotels);
        console.log(`✅ Added ${createdHotels.length} hotels`);

        // Insert flights
        const createdFlights = await Flight.insertMany(flights);
        console.log(`✅ Added ${createdFlights.length} flights`);

        // Insert extras
        const createdExtras = await Extra.insertMany(extras);
        console.log(`✅ Added ${createdExtras.length} extras`);

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminUser.email });
        if (!existingAdmin) {
            await User.create(adminUser);
            console.log('✅ Admin user created');
            console.log('   Email: admin@worldcup2026.com');
            console.log('   Password: admin123456');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        console.log('');
        console.log('🎉 ============================================');
        console.log('   DATABASE SEEDED SUCCESSFULLY!');
        console.log('🎉 ============================================');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   - Matches: ${createdMatches.length}`);
        console.log(`   - Hotels: ${createdHotels.length}`);
        console.log(`   - Flights: ${createdFlights.length}`);
        console.log(`   - Extras: ${createdExtras.length}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();