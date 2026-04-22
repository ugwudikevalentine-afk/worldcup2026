import axios from 'axios';

// TheSportsDB Free API
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// FIFA World Cup league ID in TheSportsDB = 4429
const WORLD_CUP_ID = 4429;

const sportsDbService = {

    // ============================
    // FETCH FROM API
    // ============================

    // Get all World Cup 2026 events/matches
    async getWorldCupEvents() {
        try {
            const response = await axios.get(
                `${BASE_URL}/eventsseason.php?id=${WORLD_CUP_ID}&s=2026`
            );
            return response.data?.events || [];
        } catch (error) {
            console.error('❌ Error fetching WC events:', error.message);
            return [];
        }
    },

    // Get next 15 upcoming events
    async getNextEvents() {
        try {
            const response = await axios.get(
                `${BASE_URL}/eventsnextleague.php?id=${WORLD_CUP_ID}`
            );
            return response.data?.events || [];
        } catch (error) {
            console.error('❌ Error fetching next events:', error.message);
            return [];
        }
    },

    // Get last 15 completed events
    async getPastEvents() {
        try {
            const response = await axios.get(
                `${BASE_URL}/eventspastleague.php?id=${WORLD_CUP_ID}`
            );
            return response.data?.events || [];
        } catch (error) {
            console.error('❌ Error fetching past events:', error.message);
            return [];
        }
    },

    // Get specific event by TheSportsDB ID
    async getEventById(eventId) {
        try {
            const response = await axios.get(
                `${BASE_URL}/lookupevent.php?id=${eventId}`
            );
            return response.data?.events?.[0] || null;
        } catch (error) {
            console.error('❌ Error fetching event:', error.message);
            return null;
        }
    },

    // Get events by round
    async getEventsByRound(round) {
        try {
            const response = await axios.get(
                `${BASE_URL}/eventsround.php?id=${WORLD_CUP_ID}&r=${round}&s=2026`
            );
            return response.data?.events || [];
        } catch (error) {
            console.error('❌ Error fetching round events:', error.message);
            return [];
        }
    },

    // ============================
    // CONVERT API DATA TO OUR FORMAT
    // ============================

    // Map venue names to cities/countries
    getVenueLocation(venueName) {
        const venueMap = {
            // USA venues
            'MetLife Stadium': { city: 'East Rutherford', country: 'USA' },
            'AT&T Stadium': { city: 'Arlington', country: 'USA' },
            'Hard Rock Stadium': { city: 'Miami', country: 'USA' },
            'SoFi Stadium': { city: 'Los Angeles', country: 'USA' },
            'Lincoln Financial Field': { city: 'Philadelphia', country: 'USA' },
            'NRG Stadium': { city: 'Houston', country: 'USA' },
            'Mercedes-Benz Stadium': { city: 'Atlanta', country: 'USA' },
            'Lumen Field': { city: 'Seattle', country: 'USA' },
            "Levi's Stadium": { city: 'Santa Clara', country: 'USA' },
            'Arrowhead Stadium': { city: 'Kansas City', country: 'USA' },
            'Gillette Stadium': { city: 'Foxborough', country: 'USA' },
            // Mexico venues
            'Estadio Azteca': { city: 'Mexico City', country: 'Mexico' },
            'Estadio BBVA': { city: 'Monterrey', country: 'Mexico' },
            'Estadio Akron': { city: 'Guadalajara', country: 'Mexico' },
            // Canada venues
            'BMO Field': { city: 'Toronto', country: 'Canada' },
            'BC Place': { city: 'Vancouver', country: 'Canada' },
        };

        return venueMap[venueName] || { city: 'TBD', country: 'USA' };
    },

    // Detect match stage from round info
    detectStage(event) {
        const round = (event.intRound || event.strRound || '').toString().toLowerCase();

        if (round.includes('final') && !round.includes('quarter') && !round.includes('semi')) {
            return 'Final';
        }
        if (round.includes('semi')) return 'Semi-Final';
        if (round.includes('quarter')) return 'Quarter-Final';
        if (round.includes('16') || round.includes('sixteen')) return 'Round of 16';
        if (round.includes('third') || round.includes('3rd')) return 'Third Place';
        return 'Group Stage';
    },

    // Detect match status
    detectStatus(event) {
        const apiStatus = (event.strStatus || '').toLowerCase();

        if (apiStatus.includes('finished') || apiStatus.includes('ft')) return 'completed';
        if (apiStatus.includes('live') || apiStatus.includes('progress') || apiStatus.includes('ht')) return 'ongoing';
        if (apiStatus.includes('postponed')) return 'cancelled';
        if (event.intHomeScore !== null && event.intAwayScore !== null) return 'completed';

        return 'upcoming';
    },

    // Convert one TheSportsDB event → our Match format
    convertToOurFormat(event) {
        const venue = event.strVenue || 'TBD';
        const location = this.getVenueLocation(venue);

        return {
            externalId: event.idEvent,
            team1: event.strHomeTeam || 'TBD',
            team2: event.strAwayTeam || 'TBD',
            score1: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
            score2: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
            date: event.dateEvent || null,
            time: event.strTime ? event.strTime.substring(0, 5) : '00:00',
            stadium: venue,
            city: location.city,
            hostCountry: location.country,
            stage: this.detectStage(event),
            group: event.strGroup || null,
            status: this.detectStatus(event),
            team1Badge: event.strHomeTeamBadge || null,
            team2Badge: event.strAwayTeamBadge || null,
            thumbnail: event.strThumb || null,
            source: 'thesportsdb',
            lastSynced: new Date()
        };
    }
};

export default sportsDbService;