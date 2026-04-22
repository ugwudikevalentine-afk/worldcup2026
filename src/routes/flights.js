import express from 'express';
import Flight from '../models/flight.js';
import { getCountryFromCity, getCitiesForCountry } from '../models/flight.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/flights
// @desc    Get all flights (with optional country priority)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { departure, arrival, date, maxPrice, country } = req.query;

        let query = { isActive: true };

        if (departure) {
            query.departure = { $regex: departure, $options: 'i' };
        }
        if (arrival) {
            query.arrival = { $regex: arrival, $options: 'i' };
        }
        if (date) {
            query.date = date;
        }
        if (maxPrice) {
            query.price = { $lte: parseInt(maxPrice) };
        }

        const flights = await Flight.find(query).sort({ date: 1, time: 1 });

        // If country is provided, sort flights: user's country first
        if (country) {
            const countryFlights = [];
            const otherFlights = [];

            flights.forEach(flight => {
                // Try stored departureCountry first, then auto-detect from city name
                const flightCountry = (
                    flight.departureCountry ||
                    getCountryFromCity(flight.departure) ||
                    ''
                ).toLowerCase().trim();

                const userCountry = country.toLowerCase().trim();

                if (flightCountry && flightCountry === userCountry) {
                    countryFlights.push({ ...flight.toObject(), isUserCountry: true });
                } else {
                    otherFlights.push({ ...flight.toObject(), isUserCountry: false });
                }
            });

            return res.json({
                success: true,
                count: flights.length,
                userCountry: country,
                userCountryFlights: countryFlights.length,
                flights: [...countryFlights, ...otherFlights]
            });
        }

        // No country provided - return all flights flagged as false
        res.json({
            success: true,
            count: flights.length,
            userCountryFlights: 0,
            flights: flights.map(f => ({ ...f.toObject(), isUserCountry: false }))
        });

    } catch (error) {
        console.error('Get flights error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flights',
            error: error.message
        });
    }
});

// @route   GET /api/flights/by-country/:country
// @desc    Get flights for a specific country
// @access  Public
router.get('/by-country/:country', async (req, res) => {
    try {
        const country = req.params.country;
        const cities = getCitiesForCountry(country);

        if (cities.length === 0) {
            return res.json({
                success: true,
                count: 0,
                country: country,
                message: `No departure cities found for ${country}`,
                flights: []
            });
        }

        const cityPatterns = cities.map(city => new RegExp(city, 'i'));

        const flights = await Flight.find({
            isActive: true,
            $or: cityPatterns.map(pattern => ({ departure: pattern }))
        }).sort({ date: 1, time: 1 });

        res.json({
            success: true,
            count: flights.length,
            country: country,
            departureCities: cities,
            flights
        });
    } catch (error) {
        console.error('Get flights by country error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flights by country',
            error: error.message
        });
    }
});

// @route   GET /api/flights/:id
// @desc    Get single flight
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            flight
        });
    } catch (error) {
        console.error('Get flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flight',
            error: error.message
        });
    }
});

// @route   POST /api/flights
// @desc    Create new flight (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const flightData = { ...req.body };
        if (flightData.departure) {
            flightData.departureCountry = getCountryFromCity(flightData.departure) || flightData.departureCountry;
        }
        if (flightData.arrival) {
            flightData.arrivalCountry = getCountryFromCity(flightData.arrival) || flightData.arrivalCountry;
        }

        const flight = await Flight.create(flightData);

        res.status(201).json({
            success: true,
            message: 'Flight created successfully',
            flight
        });
    } catch (error) {
        console.error('Create flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating flight',
            error: error.message
        });
    }
});

// @route   PUT /api/flights/:id
// @desc    Update flight (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.departure) {
            updateData.departureCountry = getCountryFromCity(updateData.departure) || updateData.departureCountry;
        }
        if (updateData.arrival) {
            updateData.arrivalCountry = getCountryFromCity(updateData.arrival) || updateData.arrivalCountry;
        }

        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight updated successfully',
            flight
        });
    } catch (error) {
        console.error('Update flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating flight',
            error: error.message
        });
    }
});

// @route   DELETE /api/flights/:id
// @desc    Delete flight (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const flight = await Flight.findByIdAndDelete(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight deleted successfully'
        });
    } catch (error) {
        console.error('Delete flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting flight',
            error: error.message
        });
    }
});

export default router;