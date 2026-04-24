import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/match.js';
import User from '../models/user.js';
import Hotel from '../models/hotel.js';
import Flight from '../models/flight.js';
import Extra from '../models/extra.js';

dotenv.config();

// ===== 1 HOTEL =====
const hotels = [
    {
        name: 'MetLife Stadium Hotel',
        city: 'East Rutherford',
        country: 'USA',
        address: '1 MetLife Stadium Dr, East Rutherford, NJ',
        rating: 4.5,
        price_per_night: 350,
        distance_to_stadium: '0.5 km',
        rooms: 200,
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Room Service'],
        description: 'Premium hotel located right next to MetLife Stadium — the venue for the World Cup Final.',
        isActive: true
    }
];

// ===== 1 FLIGHT FROM NIGERIA =====
const flights = [
    {
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
    }
];

// ===== ALL 13 EXTRAS =====
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
    email: 'admin@worldcupbookinghub.com',
    whatsapp: '16154145082',
    password: 'admin123456',
    role: 'admin',
    isEmailVerified: true
};

// ===== SEED DATABASE =====
const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear hotels, flights, extras only
        // DO NOT touch matches (keep TheSportsDB matches)
        console.log('🗑️ Clearing hotels, flights, extras...');
        await Hotel.deleteMany({});
        await Flight.deleteMany({});
        await Extra.deleteMany({});
        console.log('✅ Cleared');

        // Insert 1 hotel
        const createdHotels = await Hotel.insertMany(hotels);
        console.log(`✅ Added ${createdHotels.length} hotel`);

        // Insert 1 flight
        const createdFlights = await Flight.insertMany(flights);
        console.log(`✅ Added ${createdFlights.length} flight (Lagos → New York)`);

        // Insert all extras
        const createdExtras = await Extra.insertMany(extras);
        console.log(`✅ Added ${createdExtras.length} extras`);

        // Check matches
        const matchCount = await Match.countDocuments();
        console.log(`ℹ️ Keeping ${matchCount} existing matches`);

        // Check/create admin
        const existingAdmin = await User.findOne({ email: adminUser.email });
        if (!existingAdmin) {
            await User.create(adminUser);
            console.log('✅ Admin user created');
            console.log('   Email: admin@worldcupbookinghub.com');
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
        console.log(`   - Matches: ${matchCount} (from TheSportsDB)`);
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