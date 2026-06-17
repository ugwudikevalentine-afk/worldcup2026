import cron from 'node-cron';
import Match from '../models/match.js';
import sportsDbService from './sportsDbService.js';

const matchScheduler = {

    // Start all scheduled jobs
    start() {
        console.log('⚽ Match scheduler started');

        // ============================
        // JOB 1: Sync from API-Football every 6 hours
        // ============================
        cron.schedule('0 */6 * * *', async () => {
            console.log('🔄 [CRON] Running 6-hour match sync...');
            await this.syncFromAPI();
        });

        // ============================
        // JOB 2: Check for live matches every 2 minutes
        // ============================
        cron.schedule('*/2 * * * *', async () => {
            await this.updateLiveMatches();
        });

        // ============================
        // JOB 3: Check notifications every minute
        // ============================
        cron.schedule('* * * * *', async () => {
            await this.checkNotifications();
        });

        console.log('   📅 Sync: every 6 hours');
        console.log('   🔴 Live check: every 2 minutes');
        console.log('   🔔 Notifications: every 1 minute');
    },

    // ============================
    // SYNC FROM API
    // ============================
    async syncFromAPI() {
        try {
            const events = await sportsDbService.getWorldCupEvents();

            if (!events || events.length === 0) {
                console.log('   ℹ️ No WC 2026 events on API-Football yet');
                return { synced: 0, updated: 0 };
            }

            let synced = 0;
            let updated = 0;

            for (const event of events) {
                const matchData = sportsDbService.convertToOurFormat(event);

                const existing = await Match.findOne({
                    externalId: matchData.externalId
                });

                if (existing) {
                    const hasChanges =
                        existing.status !== matchData.status ||
                        existing.score1 !== matchData.score1 ||
                        existing.score2 !== matchData.score2 ||
                        existing.team1 !== matchData.team1 ||
                        existing.team2 !== matchData.team2;

                    if (hasChanges) {
                        await Match.findByIdAndUpdate(existing._id, {
                            ...matchData,
                            // Preserve our custom fields
                            tickets_available: existing.tickets_available,
                            ticket_prices: existing.ticket_prices,
                            linkedFlights: existing.linkedFlights,
                            linkedHotels: existing.linkedHotels
                        });
                        updated++;
                    }
                } else {
                    await Match.create(matchData);
                    synced++;
                }
            }

            if (synced > 0 || updated > 0) {
                console.log(`   ✅ Sync: ${synced} new, ${updated} updated`);
            }

            return { synced, updated };
        } catch (error) {
            console.error('   ❌ Sync error:', error.message);
            return { error: error.message };
        }
    },

    // ============================
    // UPDATE LIVE MATCHES
    // ============================
    async updateLiveMatches() {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            const todayMatches = await Match.find({
                date: today,
                status: { $in: ['upcoming', 'ongoing'] }
            });

            if (todayMatches.length === 0) return;

            for (const match of todayMatches) {
                const matchTime = new Date(`${match.date}T${match.time}:00Z`);
                const diffMinutes = (now - matchTime) / (1000 * 60);

                // Mark as ongoing if match started
                if (diffMinutes >= 0 && diffMinutes <= 120 && match.status === 'upcoming') {
                    await Match.findByIdAndUpdate(match._id, { status: 'ongoing' });
                    console.log(`   🔴 LIVE: ${match.team1} vs ${match.team2}`);
                }

                // Try to get final score after match ends
                if (diffMinutes > 130 && match.status === 'ongoing') {
                    if (match.externalId) {
                        // ✅ CHANGED: handle new API-Football response format
                        const fixture = await sportsDbService.getEventById(match.externalId);
                        const scoreData = sportsDbService.extractScoreFromEvent(fixture);

                        if (scoreData && scoreData.intHomeScore !== null) {
                            await Match.findByIdAndUpdate(match._id, {
                                status: 'completed',
                                score1: scoreData.intHomeScore,
                                score2: scoreData.intAwayScore,
                                lastSynced: new Date()
                            });
                            console.log(`   ✅ FINAL: ${match.team1} ${scoreData.intHomeScore}-${scoreData.intAwayScore} ${match.team2}`);
                        }
                    } else {
                        if (diffMinutes > 180) {
                            await Match.findByIdAndUpdate(match._id, { status: 'completed' });
                            console.log(`   ⏹️ ENDED: ${match.team1} vs ${match.team2} (no score data)`);
                        }
                    }
                }
            }
        } catch (error) {
            // Silent fail for live checks
        }
    },

    // ============================
    // CHECK NOTIFICATIONS
    // ============================
    async checkNotifications() {
        try {
            const now = new Date();

            const upcomingMatches = await Match.find({
                status: 'upcoming',
                $or: [
                    { 'notifications.dayBefore': false },
                    { 'notifications.hourBefore': false },
                    { 'notifications.matchStart': false }
                ]
            });

            for (const match of upcomingMatches) {
                const matchTime = new Date(`${match.date}T${match.time}:00Z`);
                const diffHours = (matchTime - now) / (1000 * 60 * 60);

                if (diffHours <= 24 && diffHours > 23 && !match.notifications.dayBefore) {
                    await Match.findByIdAndUpdate(match._id, {
                        'notifications.dayBefore': true
                    });
                    console.log(`   🔔 24h: ${match.team1} vs ${match.team2} tomorrow!`);
                }

                if (diffHours <= 1 && diffHours > 0.5 && !match.notifications.hourBefore) {
                    await Match.findByIdAndUpdate(match._id, {
                        'notifications.hourBefore': true
                    });
                    console.log(`   🔔 1h: ${match.team1} vs ${match.team2} starting soon!`);
                }

                if (diffHours <= 0 && diffHours > -0.1 && !match.notifications.matchStart) {
                    await Match.findByIdAndUpdate(match._id, {
                        'notifications.matchStart': true
                    });
                    console.log(`   🔔 KICKOFF: ${match.team1} vs ${match.team2} NOW!`);
                }
            }
        } catch (error) {
            // Silent fail
        }
    }
};

export default matchScheduler;