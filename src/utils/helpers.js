// Generate random booking reference
export const generateBookingReference = (type = 'GEN') => {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Format date
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Format date and time
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Calculate days until event
export const daysUntil = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Validate email format
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate WhatsApp number
export const isValidWhatsApp = (number) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(number.replace(/\D/g, ''));
};

// Sanitize user input
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

// Pagination helper
export const paginate = (page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    return {
        page: pageNum,
        limit: limitNum,
        skip
    };
};

// Response helper
export const sendResponse = (res, statusCode, success, message, data = null) => {
    const response = {
        success,
        message
    };
    
    if (data) {
        response.data = data;
    }
    
    return res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (res, statusCode, message, error = null) => {
    const response = {
        success: false,
        message
    };
    
    if (process.env.NODE_ENV === 'development' && error) {
        response.error = error.message || error;
    }
    
    return res.status(statusCode).json(response);
};