import axios from 'axios';

// ============================================
// API-Football (via RapidAPI) - FREE TIER
// 100 requests/day free
// FIFA World Cup 2026 League ID = 1
// Season = 2026
// ============================================

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

// FIFA World Cup league ID in API-Football
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

// Axios instance with headers
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-apisports-key': API_KEY
    },
    timeout: 10000
});

const sportsDbService = {

    // ============================
    // FETCH FROM API
    // ============================

    // Get all World Cup 2026 fixtures/matches
    async getWorldCupEvents() {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    league: WORLD_CUP_LEAGUE_ID,
                    season: WORLD_CUP_SEASON
                }
            });

            const fixtures = response.data?.response || [];

            if (fixtures.length === 0) {
                console.log('   ℹ️ No WC 2026 fixtures on API-Football yet');
            }

            return fixtures;
        } catch (error) {
            console.error('❌ Error fetching WC events:', error.message);
            return [];
        }
    },

    // Get next 15 upcoming fixtures
    async getNextEvents() {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    league: WORLD_CUP_LEAGUE_ID,
                    season: WORLD_CUP_SEASON,
                    next: 15
                }
            });

            return response.data?.response || [];
        } catch (error) {
            console.error('❌ Error fetching next events:', error.message);
            return [];
        }
    },

    // Get last 15 completed fixtures
    async getPastEvents() {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    league: WORLD_CUP_LEAGUE_ID,
                    season: WORLD_CUP_SEASON,
                    last: 15
                }
            });

            return response.data?.response || [];
        } catch (error) {
            console.error('❌ Error fetching past events:', error.message);
            return [];
        }
    },

    // Get specific fixture by API-Football fixture ID
    async getEventById(fixtureId) {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    id: fixtureId
                }
            });

            return response.data?.response?.[0] || null;
        } catch (error) {
            console.error('❌ Error fetching event:', error.message);
            return null;
        }
    },

    // Get fixtures by round
    async getEventsByRound(round) {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    league: WORLD_CUP_LEAGUE_ID,
                    season: WORLD_CUP_SEASON,
                    round: round
                }
            });

            return response.data?.response || [];
        } catch (error) {
            console.error('❌ Error fetching round events:', error.message);
            return [];
        }
    },

    // Get currently live fixtures
    async getLiveEvents() {
        try {
            const response = await apiClient.get('/fixtures', {
                params: {
                    live: `${WORLD_CUP_LEAGUE_ID}`
                }
            });

            return response.data?.response || [];
        } catch (error) {
            console.error('❌ Error fetching live events:', error.message);
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

    // Detect match stage from round string
    detectStage(roundStr) {
        if (!roundStr) return 'Group Stage';

        const round = roundStr.toLowerCase();

        if (round.includes('final') && !round.includes('quarter') && !round.includes('semi')) {
            return 'Final';
        }
        if (round.includes('semi')) return 'Semi-Final';
        if (round.includes('quarter')) return 'Quarter-Final';
        if (round.includes('16') || round.includes('round of 16')) return 'Round of 16';
        if (round.includes('third') || round.includes('3rd')) return 'Third Place';

        return 'Group Stage';
    },

    // Detect group from round string e.g "Group Stage - A"
    detectGroup(roundStr) {
        if (!roundStr) return null;
        const match = roundStr.match(/group\s+([A-Z])/i);
        return match ? `Group ${match[1].toUpperCase()}` : null;
    },

    // Convert API-Football status to our status format
    detectStatus(fixture) {
        const shortStatus = fixture?.fixture?.status?.short || '';

        // API-Football status codes:
        // NS = Not Started
        // 1H, HT, 2H, ET, BT, P = In Progress
        // FT, AET, PEN = Finished
        // PST = Postponed
        // CANC = Cancelled
        // SUSP = Suspended

        if (['FT', 'AET', 'PEN'].includes(shortStatus)) return 'completed';
        if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(shortStatus)) return 'ongoing';
        if (['PST', 'CANC', 'SUSP', 'ABD', 'AWD', 'WO'].includes(shortStatus)) return 'cancelled';

        return 'upcoming';
    },

    // Convert one API-Football fixture → our Match format
    convertToOurFormat(fixture) {
        const venue = fixture?.fixture?.venue?.name || 'TBD';
        const location = this.getVenueLocation(venue);
        const roundStr = fixture?.league?.round || '';

        // Date and time from fixture
        const fixtureDate = fixture?.fixture?.date
            ? new Date(fixture.fixture.date)
            : null;

        const dateStr = fixtureDate
            ? fixtureDate.toISOString().split('T')[0]
            : null;

        const timeStr = fixtureDate
            ? fixtureDate.toISOString().split('T')[1].substring(0, 5)
            : '00:00';

        return {
            externalId: fixture?.fixture?.id?.toString(),
            team1: fixture?.teams?.home?.name || 'TBD',
            team2: fixture?.teams?.away?.name || 'TBD',
            score1: fixture?.goals?.home ?? null,
            score2: fixture?.goals?.away ?? null,
            date: dateStr,
            time: timeStr,
            stadium: venue,
            city: location.city,
            hostCountry: location.country,
            stage: this.detectStage(roundStr),
            group: this.detectGroup(roundStr),
            status: this.detectStatus(fixture),
            team1Badge: fixture?.teams?.home?.logo || null,
            team2Badge: fixture?.teams?.away?.logo || null,
            thumbnail: null, // API-Football doesn't provide match thumbnails
            source: 'apifootball',
            lastSynced: new Date()
        };
    },

    // Convert getEventById result for live score updates
    // (used in matchScheduler updateLiveMatches)
    extractScoreFromEvent(fixture) {
        if (!fixture) return null;

        return {
            intHomeScore: fixture?.goals?.home ?? null,
            intAwayScore: fixture?.goals?.away ?? null,
            status: fixture?.fixture?.status?.short || ''
        };
    }
};

export default sportsDbService;