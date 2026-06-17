import axios from 'axios';

// ============================================
// ESPN Hidden API - 100% FREE, NO KEY NEEDED
// FIFA World Cup 2026 League ID = fifa.world
// ============================================

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000
});

const sportsDbService = {

    // ============================
    // FETCH FROM API
    // ============================

    // Get ALL World Cup 2026 fixtures by looping through the tournament dates
    async getWorldCupEvents() {
        try {
            const allEvents = [];

            // World Cup 2026 runs June 11 - July 19, 2026
            const startDate = new Date('2026-06-11');
            const endDate = new Date('2026-07-19');

            // Loop through each day and fetch fixtures
            const current = new Date(startDate);
            while (current <= endDate) {
                const dateStr = current.toISOString().split('T')[0].replace(/-/g, '');

                try {
                    const response = await apiClient.get(`/scoreboard?dates=${dateStr}`);
                    const events = response.data?.events || [];
                    allEvents.push(...events);
                } catch (err) {
                    // skip failed days silently
                }

                current.setDate(current.getDate() + 1);
            }

            if (allEvents.length === 0) {
                console.log('   ℹ️ No WC 2026 events found on ESPN');
            }

            return allEvents;
        } catch (error) {
            console.error('❌ Error fetching WC events:', error.message);
            return [];
        }
    },

    // Get next upcoming events (today + next 7 days)
    async getNextEvents() {
        try {
            const allEvents = [];
            const today = new Date();

            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

                try {
                    const response = await apiClient.get(`/scoreboard?dates=${dateStr}`);
                    const events = response.data?.events || [];
                    allEvents.push(...events);
                } catch (err) {}
            }

            return allEvents;
        } catch (error) {
            console.error('❌ Error fetching next events:', error.message);
            return [];
        }
    },

    // Get past 7 days of events
    async getPastEvents() {
        try {
            const allEvents = [];
            const today = new Date();

            for (let i = 1; i <= 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

                try {
                    const response = await apiClient.get(`/scoreboard?dates=${dateStr}`);
                    const events = response.data?.events || [];
                    allEvents.push(...events);
                } catch (err) {}
            }

            return allEvents;
        } catch (error) {
            console.error('❌ Error fetching past events:', error.message);
            return [];
        }
    },

    // Get specific event by ESPN event ID
    async getEventById(eventId) {
        try {
            const response = await apiClient.get(`/summary?event=${eventId}`);
            return response.data || null;
        } catch (error) {
            console.error('❌ Error fetching event:', error.message);
            return null;
        }
    },

    // Get events by round (not directly supported by ESPN - return all events filtered)
    async getEventsByRound(round) {
        try {
            const all = await this.getWorldCupEvents();
            return all.filter(e => {
                const note = e?.competitions?.[0]?.altGameNote || '';
                return note.toLowerCase().includes(round.toLowerCase());
            });
        } catch (error) {
            console.error('❌ Error fetching round events:', error.message);
            return [];
        }
    },

    // Get currently live events
    async getLiveEvents() {
        try {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const response = await apiClient.get(`/scoreboard?dates=${today}`);
            const events = response.data?.events || [];

            // Filter only live matches
            return events.filter(e => {
                const state = e?.status?.type?.state;
                return state === 'in'; // ESPN uses "in" for live matches
            });
        } catch (error) {
            console.error('❌ Error fetching live events:', error.message);
            return [];
        }
    },

    // ============================
    // CONVERT API DATA TO OUR FORMAT
    // ============================

    // Map venue names to cities/countries
    getVenueLocation(venueName, fallbackAddress) {
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
            'Estadio Banorte': { city: 'Mexico City', country: 'Mexico' },
            'Estadio BBVA': { city: 'Monterrey', country: 'Mexico' },
            'Estadio Akron': { city: 'Guadalajara', country: 'Mexico' },
            // Canada venues
            'BMO Field': { city: 'Toronto', country: 'Canada' },
            'BC Place': { city: 'Vancouver', country: 'Canada' },
        };

        if (venueMap[venueName]) return venueMap[venueName];

        // Use the address ESPN returns if available
        if (fallbackAddress?.city) {
            return {
                city: fallbackAddress.city,
                country: fallbackAddress.country || 'USA'
            };
        }

        return { city: 'TBD', country: 'USA' };
    },

    // Detect match stage from ESPN data
    detectStage(event) {
        const note = (event?.competitions?.[0]?.altGameNote || '').toLowerCase();
        const slug = (event?.season?.slug || '').toLowerCase();

        if (note.includes('final') && !note.includes('quarter') && !note.includes('semi') && !note.includes('3rd')) {
            return 'Final';
        }
        if (note.includes('semi') || slug.includes('semi')) return 'Semi-Final';
        if (note.includes('quarter') || slug.includes('quarter')) return 'Quarter-Final';
        if (note.includes('round of 16') || slug.includes('round-of-16')) return 'Round of 16';
        if (note.includes('3rd') || note.includes('third')) return 'Third Place';
        if (note.includes('round of 32') || slug.includes('round-of-32')) return 'Round of 16';

        return 'Group Stage';
    },

    // Detect group from ESPN altGameNote e.g. "FIFA World Cup, Group A"
    detectGroup(event) {
        const note = event?.competitions?.[0]?.altGameNote || '';
        const match = note.match(/group\s+([A-Z])/i);
        return match ? `Group ${match[1].toUpperCase()}` : null;
    },

    // Convert ESPN status to our format
    detectStatus(event) {
        const state = event?.status?.type?.state || '';
        const completed = event?.status?.type?.completed || false;

        // ESPN states:
        // "pre" = not started
        // "in" = in progress (live)
        // "post" = finished

        if (completed || state === 'post') return 'completed';
        if (state === 'in') return 'ongoing';
        if (state === 'pre') return 'upcoming';

        return 'upcoming';
    },

    // Convert ESPN event → our Match format
    convertToOurFormat(event) {
        const competition = event?.competitions?.[0];
        const venueName = competition?.venue?.fullName || event?.venue?.displayName || 'TBD';
        const venueAddress = competition?.venue?.address;
        const location = this.getVenueLocation(venueName, venueAddress);

        const competitors = competition?.competitors || [];
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');

        const eventDate = event?.date ? new Date(event.date) : null;
        const dateStr = eventDate ? eventDate.toISOString().split('T')[0] : null;
        const timeStr = eventDate ? eventDate.toISOString().split('T')[1].substring(0, 5) : '00:00';

        return {
            externalId: event?.id?.toString(),
            team1: homeTeam?.team?.displayName || homeTeam?.team?.name || 'TBD',
            team2: awayTeam?.team?.displayName || awayTeam?.team?.name || 'TBD',
            score1: homeTeam?.score !== undefined ? parseInt(homeTeam.score) : null,
            score2: awayTeam?.score !== undefined ? parseInt(awayTeam.score) : null,
            date: dateStr,
            time: timeStr,
            stadium: venueName,
            city: location.city,
            hostCountry: location.country,
            stage: this.detectStage(event),
            group: this.detectGroup(event),
            status: this.detectStatus(event),
            team1Badge: homeTeam?.team?.logo || null,
            team2Badge: awayTeam?.team?.logo || null,
            thumbnail: null,
            source: 'espn',
            lastSynced: new Date()
        };
    },

    // For matchScheduler updateLiveMatches
    extractScoreFromEvent(event) {
        if (!event) return null;

        // Handle both /scoreboard event format and /summary event format
        const competition = event?.competitions?.[0] || event?.header?.competitions?.[0];
        if (!competition) return null;

        const competitors = competition?.competitors || [];
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');

        return {
            intHomeScore: homeTeam?.score !== undefined ? parseInt(homeTeam.score) : null,
            intAwayScore: awayTeam?.score !== undefined ? parseInt(awayTeam.score) : null,
            status: event?.status?.type?.shortDetail || ''
        };
    }
};

export default sportsDbService;