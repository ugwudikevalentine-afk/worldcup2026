import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import database connection
import connectDB from './config/database.js';

// Import API routes
import apiRoutes from './api.js';

// Import match scheduler
import matchScheduler from './utils/matchScheduler.js';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// ===== CONNECT TO DATABASE =====
connectDB().then(() => {
    // Start match scheduler AFTER database connects
    matchScheduler.start();
}).catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
});

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after an hour.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ===== CORS CONFIGURATION =====
const corsOptions = {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// ===== BODY PARSING MIDDLEWARE =====
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===== REQUEST LOGGING (Development only) =====
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📨 ${req.method} ${req.path}`);
        next();
    });
}

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, '../public')));

// ===== API ROUTES =====
app.use('/api', apiRoutes);

// ===== SERVE FRONTEND =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch all - serve index.html for client-side routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== ERROR HANDLING MIDDLEWARE =====
// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: messages
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log('');
    console.log('🏆 ============================================ 🏆');
    console.log('   FIFA World Cup 2026 Booking Platform');
    console.log('🏆 ============================================ 🏆');
    console.log('');
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Static files: ${path.join(__dirname, '../public')}`);
    console.log('');
    console.log('📌 API Endpoints:');
    console.log(`   - Auth:     http://localhost:${PORT}/api/auth`);
    console.log(`   - Matches:  http://localhost:${PORT}/api/matches`);
    console.log(`   - Bookings: http://localhost:${PORT}/api/bookings`);
    console.log(`   - Config:   http://localhost:${PORT}/api/config`);
    console.log(`   - Health:   http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('🔗 Contact:');
    console.log(`   - WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+16154145082'}`);
    console.log(`   - Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}`);
    console.log('');
    console.log('⚽ Match Scheduler: Running');
    console.log('   - API Sync: every 6 hours');
    console.log('   - Live check: every 2 minutes');
    console.log('   - Notifications: every 1 minute');
    console.log('');
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

export default app;