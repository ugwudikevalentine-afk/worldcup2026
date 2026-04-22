// ===================================
// FIFA WORLD CUP 2026 BOOKING PLATFORM
// Full Frontend Script with Backend Connection
// ===================================

// API Base URL - Change this when deploying to production
const API_URL = 'http://localhost:5000';

// ===================================
// TOGGLE PASSWORD VISIBILITY
// ===================================
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.toggle-password');
    const icon = button.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===================================
// VERIFICATION CODE INPUT HANDLING
// ===================================
function setupVerificationCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-digit');
    if (codeInputs.length === 0) return;

    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.value = value.replace(/[^0-9]/g, '');
            
            if (e.target.value.length === 1) {
                e.target.classList.add('filled');
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                codeInputs[index - 1].focus();
                codeInputs[index - 1].value = '';
                codeInputs[index - 1].classList.remove('filled');
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            
            pastedData.split('').forEach((digit, i) => {
                if (codeInputs[i]) {
                    codeInputs[i].value = digit;
                    codeInputs[i].classList.add('filled');
                }
            });

            const lastIndex = Math.min(pastedData.length, 6) - 1;
            if (lastIndex >= 0 && lastIndex < codeInputs.length) {
                codeInputs[lastIndex].focus();
            }
        });
    });
}

function getVerificationCode() {
    const codeInputs = document.querySelectorAll('.code-digit');
    let code = '';
    codeInputs.forEach(input => {
        code += input.value;
    });
    return code;
}

function clearVerificationCode() {
    const codeInputs = document.querySelectorAll('.code-digit');
    codeInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    if (codeInputs.length > 0) {
        codeInputs[0].focus();
    }
}

function showCodeError() {
    const codeInputs = document.querySelectorAll('.code-digit');
    codeInputs.forEach(input => {
        input.classList.add('error');
    });
}

// ===================================
// EMAIL VERIFICATION FORM
// ===================================
async function setupEmailVerification() {
    const verifyForm = document.getElementById('verifyEmailForm');
    if (!verifyForm) return;

    setupVerificationCodeInputs();

    const user = getUser();
    const emailDisplay = document.getElementById('userEmail');
    if (emailDisplay && user) {
        emailDisplay.textContent = user.email;
    }

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (user.isEmailVerified) {
        window.location.href = 'account.html';
        return;
    }

    startResendCooldown();

    verifyForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const code = getVerificationCode();
        const submitBtn = document.getElementById('verifyBtn');
        const codeError = document.getElementById('codeError');

        codeError.textContent = '';
        document.querySelectorAll('.code-digit').forEach(input => {
            input.classList.remove('error');
        });

        if (code.length !== 6) {
            codeError.textContent = 'Please enter all 6 digits';
            showCodeError();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (data.success) {
                const updatedUser = { ...user, isEmailVerified: true };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                alert('🎉 Email verified successfully! Welcome to World Cup 2026!');
                window.location.href = 'account.html';
            } else {
                codeError.textContent = data.message || 'Invalid verification code';
                showCodeError();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Email';
            }
        } catch (error) {
            console.error('Verification error:', error);
            codeError.textContent = 'Network error. Please try again.';
            showCodeError();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Email';
        }
    });
}

// ===================================
// RESEND VERIFICATION CODE
// ===================================
let resendCooldown = 0;
let resendInterval = null;

function startResendCooldown() {
    const resendBtn = document.getElementById('resendBtn');
    const resendTimer = document.getElementById('resendTimer');
    
    if (!resendBtn || !resendTimer) return;

    const cooldownEnd = localStorage.getItem('resendCooldownEnd');
    if (cooldownEnd) {
        const remaining = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
        if (remaining > 0) {
            resendCooldown = remaining;
        }
    }

    if (resendCooldown > 0) {
        resendBtn.disabled = true;
        updateResendTimer();
        resendInterval = setInterval(updateResendTimer, 1000);
    }
}

function updateResendTimer() {
    const resendBtn = document.getElementById('resendBtn');
    const resendTimer = document.getElementById('resendTimer');

    if (resendCooldown > 0) {
        resendTimer.textContent = `Resend available in ${resendCooldown}s`;
        resendCooldown--;
    } else {
        resendTimer.textContent = '';
        resendBtn.disabled = false;
        if (resendInterval) {
            clearInterval(resendInterval);
            resendInterval = null;
        }
        localStorage.removeItem('resendCooldownEnd');
    }
}

async function resendVerificationCode() {
    const resendBtn = document.getElementById('resendBtn');
    const resendTimer = document.getElementById('resendTimer');
    const codeError = document.getElementById('codeError');

    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ New verification code sent! Check your email.');
            clearVerificationCode();
            codeError.textContent = '';

            resendCooldown = 60;
            localStorage.setItem('resendCooldownEnd', Date.now() + 60000);
            resendInterval = setInterval(updateResendTimer, 1000);
            updateResendTimer();
        } else {
            alert(data.message || 'Failed to resend code. Please try again.');
            resendBtn.disabled = false;
        }
    } catch (error) {
        console.error('Resend error:', error);
        alert('Network error. Please try again.');
        resendBtn.disabled = false;
    }

    resendBtn.innerHTML = '<i class="fas fa-redo"></i> Resend Code';
}

// ===================================
// FORGOT PASSWORD FORM
// ===================================
async function setupForgotPasswordForm() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email');
        const submitBtn = document.getElementById('forgotPasswordBtn');

        clearError('emailError');

        if (!email.value.trim()) {
            setError('emailError', 'Email address is required.');
            return;
        }

        if (!validateEmail(email.value.trim())) {
            setError('emailError', 'Please enter a valid email address.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Reset Code...';

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.value.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('resetEmail', email.value.trim());
                
                alert('✅ Reset code sent! Check your email inbox.');
                window.location.href = 'reset-password.html';
            } else {
                setError('emailError', data.message || 'Failed to send reset code.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Code';
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('emailError', 'Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Code';
        }
    });
}

// ===================================
// BANNER ROTATION
// ===================================
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.banner-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    if (n >= slides.length) {
        currentSlideIndex = 0;
    }
    if (n < 0) {
        currentSlideIndex = slides.length - 1;
    }

    if (slides.length > 0) slides[currentSlideIndex].classList.add('active');
    if (dots.length > 0) dots[currentSlideIndex].classList.add('active');
}

function currentSlide(n) {
    currentSlideIndex = n;
    showSlide(currentSlideIndex);
}

function nextSlide() {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
}

if (slides.length > 0) {
    setInterval(nextSlide, 5000);
    showSlide(currentSlideIndex);
}

// ===================================
// NAVBAR ACTIVE LINK
// ===================================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            link.classList.remove('active');
            if (href.slice(1) === current) {
                link.classList.add('active');
            }
        }
    });
});

// ===================================
// HAMBURGER MENU
// ===================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('open');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('open');
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('open');
        }
    });
}

// ===================================
// COUNTRY SELECTOR
// ===================================
const countrySelect = document.getElementById('countrySelect');
const countryButton = document.querySelector('.choose-country .btn-primary');

if (countryButton && countrySelect) {
    countryButton.addEventListener('click', () => {
        const selectedCountry = countrySelect.value;
        if (selectedCountry) {
            alert(`You selected: ${selectedCountry}. Personalizing your packages...`);
        } else {
            alert('Please select a country first!');
        }
    });
}

// ===================================
// SMOOTH SCROLL
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// FORM VALIDATION HELPERS
// ===================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateWhatsApp(whatsapp) {
    const re = /^[0-9]{10,}$/;
    return re.test(whatsapp.replace(/\D/g, ''));
}

function clearError(id) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
        errorEl.textContent = '';
    }
}

function setError(id, message) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
        errorEl.textContent = message;
    }
}

// ===================================
// AUTH HELPERS
// ===================================
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('resendCooldownEnd');
        window.location.href = 'login.html';
    }
}

// ===================================
// UPDATE NAVBAR - WITH ADMIN BUTTON
// ===================================
function updateNavbar() {
    const authNav = document.querySelector('.nav-auth');
    if (!authNav) return;

    if (isLoggedIn()) {
        const user = getUser();
        
        let adminButton = '';
        if (user && user.role === 'admin') {
            adminButton = `
                <a href="admin.html" class="btn-admin" style="
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                    color: #fff;
                    padding: 8px 15px;
                    border-radius: 5px;
                    margin-right: 10px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                ">
                    <i class="fas fa-crown"></i> Admin
                </a>
            `;
        }

        authNav.innerHTML = `
            ${adminButton}
            <a href="account.html" class="btn-account" style="
                color: #ffd700;
                margin-right: 15px;
                text-decoration: none;
                font-weight: bold;
            ">
                <i class="fas fa-user"></i> ${user?.name || 'Account'}
            </a>
            <button onclick="logout()" class="btn-signin" style="
                background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
                border: none;
                cursor: pointer;
                color: #fff;
                padding: 8px 15px;
                border-radius: 5px;
                font-weight: bold;
            ">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    } else {
        authNav.innerHTML = `
            <a href="login.html" class="btn-signin" data-i18n="nav_signin">Sign In</a>
        `;
    }
}

// ===================================
// LOGIN FORM - CONNECTED TO BACKEND
// ===================================
async function setupLoginValidation() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        let isValid = true;

        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const agreeTerms = document.getElementById('agreeTerms');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        clearError('emailError');
        clearError('passwordError');
        clearError('termsError');

        if (!email.value.trim()) {
            setError('emailError', 'Email address is required.');
            isValid = false;
        } else if (!validateEmail(email.value.trim())) {
            setError('emailError', 'Please enter a valid email address.');
            isValid = false;
        }

        if (!password.value.trim()) {
            setError('passwordError', 'Password is required.');
            isValid = false;
        } else if (password.value.trim().length < 6) {
            setError('passwordError', 'Password must be at least 6 characters.');
            isValid = false;
        }

        if (agreeTerms && !agreeTerms.checked) {
            setError('termsError', 'You must agree to the Terms & Conditions.');
            isValid = false;
        }

        if (isValid) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

            try {
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email.value.trim(),
                        password: password.value.trim()
                    })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    alert('Login successful! Welcome back, ' + data.user.name);
                    
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'account.html';
                    }
                } else {
                    if (data.requiresVerification) {
                        if (data.token) {
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                        }
                        alert('Please verify your email to continue.');
                        window.location.href = 'verify-email.html';
                    } else {
                        setError('emailError', data.message || 'Login failed');
                    }
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                }
            } catch (error) {
                console.error('Login error:', error);
                setError('emailError', 'Network error. Please check your connection and try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        }
    });
}

// ===================================
// REGISTER FORM - CONNECTED TO BACKEND
// ===================================
async function setupRegisterValidation() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        let isValid = true;

        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const whatsapp = document.getElementById('whatsapp');
        const country = document.getElementById('country');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const agreeRegisterTerms = document.getElementById('agreeRegisterTerms');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        clearError('nameError');
        clearError('emailError');
        clearError('whatsappError');
        clearError('countryError');
        clearError('passwordError');
        clearError('confirmPasswordError');
        clearError('registerTermsError');

        if (!name.value.trim()) {
            setError('nameError', 'Full name is required.');
            isValid = false;
        } else if (name.value.trim().length < 3) {
            setError('nameError', 'Full name must be at least 3 characters.');
            isValid = false;
        }

        if (!email.value.trim()) {
            setError('emailError', 'Email address is required.');
            isValid = false;
        } else if (!validateEmail(email.value.trim())) {
            setError('emailError', 'Please enter a valid email address.');
            isValid = false;
        }

        if (!whatsapp.value.trim()) {
            setError('whatsappError', 'WhatsApp number is required.');
            isValid = false;
        } else if (!validateWhatsApp(whatsapp.value.trim())) {
            setError('whatsappError', 'Please enter a valid WhatsApp number (10+ digits).');
            isValid = false;
        }

        if (!country.value) {
            setError('countryError', 'Please select your country.');
            isValid = false;
        }

        if (!password.value.trim()) {
            setError('passwordError', 'Password is required.');
            isValid = false;
        } else if (password.value.trim().length < 6) {
            setError('passwordError', 'Password must be at least 6 characters.');
            isValid = false;
        }

        if (!confirmPassword.value.trim()) {
            setError('confirmPasswordError', 'Please confirm your password.');
            isValid = false;
        } else if (confirmPassword.value !== password.value) {
            setError('confirmPasswordError', 'Passwords do not match.');
            isValid = false;
        }

        if (agreeRegisterTerms && !agreeRegisterTerms.checked) {
            setError('registerTermsError', 'You must agree to the Terms & Conditions.');
            isValid = false;
        }

        if (isValid) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

            try {
                const response = await fetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name.value.trim(),
                        email: email.value.trim(),
                        whatsapp: whatsapp.value.trim().replace(/\D/g, ''),
                        country: country.value,
                        password: password.value.trim(),
                        acceptedTerms: true
                    })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    alert('Registration successful! Please check your email for verification code.');
                    window.location.href = 'verify-email.html';
                } else {
                    if (data.errors && data.errors.length > 0) {
                        data.errors.forEach(err => {
                            if (err.path === 'name') setError('nameError', err.msg);
                            if (err.path === 'email') setError('emailError', err.msg);
                            if (err.path === 'whatsapp') setError('whatsappError', err.msg);
                            if (err.path === 'country') setError('countryError', err.msg);
                            if (err.path === 'password') setError('passwordError', err.msg);
                        });
                    } else {
                        setError('emailError', data.message || 'Registration failed');
                    }
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                }
            } catch (error) {
                console.error('Registration error:', error);
                setError('emailError', 'Network error. Please check your connection and try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            }
        }
    });
}

// ===================================
// BOOKING CARD CLICK HANDLERS
// ===================================
const bookingCards = document.querySelectorAll('.booking-card');
bookingCards.forEach(card => {
    card.addEventListener('click', function () {
        const link = this.querySelector('.card-link');
        if (link) {
            window.location.href = link.getAttribute('href');
        }
    });
});

// ===================================
// DYNAMIC DATA LOADING FROM BACKEND
// ===================================
async function loadMatches() {
    try {
        const response = await fetch(`${API_URL}/api/matches`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Matches loaded:', data.matches.length);
            displayMatches(data.matches);
        }
    } catch (error) {
        console.error('❌ Error loading matches:', error);
    }
}

function displayMatches(matches) {
    const matchesContainer = document.getElementById('matchesContainer');
    if (!matchesContainer) return;

    if (matches.length === 0) {
        matchesContainer.innerHTML = '<p>No matches available at the moment.</p>';
        return;
    }

    matchesContainer.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-teams">
                <span class="team">${match.team1}</span>
                <span class="vs">VS</span>
                <span class="team">${match.team2}</span>
            </div>
            <div class="match-info">
                <p><i class="fas fa-calendar"></i> ${match.date}</p>
                <p><i class="fas fa-clock"></i> ${match.time} UTC</p>
                <p><i class="fas fa-map-marker-alt"></i> ${match.stadium}, ${match.city}</p>
            </div>
            <div class="match-tickets">
                <p><i class="fas fa-ticket-alt"></i> ${match.tickets_available} tickets available</p>
                <p class="price">From $${match.ticket_prices?.regular || 150}</p>
            </div>
            <a href="ticket.html?match=${match._id}" class="btn btn-gold">Book Tickets</a>
        </div>
    `).join('');
}

// ===================================
// FLIGHTS - COUNTRY PRIORITY SYSTEM
// ===================================
let selectedFlight = null;
let allFlightsData = [];
let isSearchActive = false;

function getUserCountry() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const parsed = JSON.parse(user);
            return parsed.country || null;
        } catch (e) { return null; }
    }
    return null;
}

function isUserLoggedIn() {
    return !!localStorage.getItem('token');
}

function populateFlightDropdowns(flights) {
    const departureSelect = document.getElementById('departureCity');
    const arrivalSelect = document.getElementById('arrivalCity');
    if (!departureSelect || !arrivalSelect) return;

    const departureCities = [...new Set(flights.map(f => f.departure))].sort();
    const arrivalCities = [...new Set(flights.map(f => f.arrival))].sort();

    departureCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        departureSelect.appendChild(option);
    });

    arrivalCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        arrivalSelect.appendChild(option);
    });
}

async function loadFlights() {
    const flightsContainer = document.getElementById('flightsContainer');
    if (!flightsContainer) return;

    const isFlightPage = !!document.getElementById('departureCity');

    if (isFlightPage) {
        await loadTravelFlights();
    }
}

async function loadTravelFlights() {
    const loadingEl = document.getElementById('flightsLoading');
    const containerEl = document.getElementById('flightsContainer');

    if (loadingEl) loadingEl.style.display = 'block';
    containerEl.innerHTML = '';

    try {
        const userCountry = getUserCountry();
        let url = `${API_URL}/api/flights`;
        if (userCountry) {
            url += `?country=${encodeURIComponent(userCountry)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (loadingEl) loadingEl.style.display = 'none';

        if (data.success && data.flights.length > 0) {
            allFlightsData = data.flights;
            window.flightsData = data.flights;

            populateFlightDropdowns(data.flights);

            if (userCountry && data.userCountryFlights > 0) {
                displayCountryPriorityFlights(data.flights, userCountry, data.userCountryFlights);
            } else if (userCountry && data.userCountryFlights === 0) {
                displayNoCountryMatch(data.flights, userCountry);
            } else {
                displayAllFlights(data.flights);
            }
        } else {
            containerEl.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-plane"></i>
                    <h3>No Flights Available</h3>
                    <p>No flights have been added yet. Please check back later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading flights:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        containerEl.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle" style="color: #ff4444;"></i>
                <h3>Error Loading Flights</h3>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
    }
}

function searchFlights() {
    const departureCity = document.getElementById('departureCity').value;
    const arrivalCity = document.getElementById('arrivalCity').value;

    if (!departureCity && !arrivalCity) {
        clearSearch();
        return;
    }

    isSearchActive = true;

    let filtered = allFlightsData;

    if (departureCity) {
        filtered = filtered.filter(f =>
            f.departure.toLowerCase() === departureCity.toLowerCase()
        );
    }

    if (arrivalCity) {
        filtered = filtered.filter(f =>
            f.arrival.toLowerCase() === arrivalCity.toLowerCase()
        );
    }

    window.flightsData = filtered;

    const container = document.getElementById('flightsContainer');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No Flights Found</h3>
                <p>No flights match your search. Try different cities or <button onclick="clearSearch()" style="background:none; border:none; color: var(--light-blue); font-weight:600; cursor:pointer; font-size:1rem;">clear the search</button> to see all flights.</p>
            </div>
        `;
        return;
    }

    let searchLabel = '';
    if (departureCity && arrivalCity) {
        searchLabel = `${departureCity} → ${arrivalCity}`;
    } else if (departureCity) {
        searchLabel = `From ${departureCity}`;
    } else {
        searchLabel = `To ${arrivalCity}`;
    }

    container.innerHTML = `
        <div class="flights-section-header">
            <h2><i class="fas fa-search"></i> Results: ${searchLabel}</h2>
            <span class="flight-count">${filtered.length} flight${filtered.length > 1 ? 's' : ''} found</span>
        </div>
        <div class="content-grid">
            ${filtered.map(f => buildFlightCard(f, f.isUserCountry || false)).join('')}
        </div>
    `;
}

function clearSearch() {
    document.getElementById('departureCity').value = '';
    document.getElementById('arrivalCity').value = '';
    isSearchActive = false;
    window.flightsData = allFlightsData;

    const userCountry = getUserCountry();
    const countryFlights = allFlightsData.filter(f => f.isUserCountry);

    if (userCountry && countryFlights.length > 0) {
        displayCountryPriorityFlights(allFlightsData, userCountry, countryFlights.length);
    } else if (userCountry && countryFlights.length === 0) {
        displayNoCountryMatch(allFlightsData, userCountry);
    } else {
        displayAllFlights(allFlightsData);
    }
}

function displayCountryPriorityFlights(flights, userCountry, countryCount) {
    const container = document.getElementById('flightsContainer');
    const countryFlights = flights.filter(f => f.isUserCountry);
    const otherFlights = flights.filter(f => !f.isUserCountry);

    let html = '';

    html += `
        <div class="flights-section-header">
            <h2><i class="fas fa-flag"></i> Flights from ${userCountry}</h2>
            <span class="flight-count">${countryCount} flight${countryCount > 1 ? 's' : ''} found</span>
        </div>
        <div class="content-grid">
            ${countryFlights.map(f => buildFlightCard(f, true)).join('')}
        </div>
    `;

    if (otherFlights.length > 0) {
        html += `
            <div class="flights-section-header other-section-header" style="margin-top: 30px;">
                <h2><i class="fas fa-globe"></i> Other Available Flights</h2>
                <span class="flight-count">${otherFlights.length} flight${otherFlights.length > 1 ? 's' : ''}</span>
            </div>
            <div class="content-grid">
                ${otherFlights.map(f => buildFlightCard(f, false)).join('')}
            </div>
        `;
    }

    container.innerHTML = html;
}

function displayNoCountryMatch(flights, userCountry) {
    const container = document.getElementById('flightsContainer');

    container.innerHTML = `
        <div class="flights-section-header" style="background: linear-gradient(135deg, #92400e 0%, #b45309 100%); margin-bottom: 15px;">
            <h2><i class="fas fa-info-circle"></i> No flights from ${userCountry} yet</h2>
            <span class="flight-count" style="background: rgba(255,255,255,0.2); color: #fff;">Coming soon!</span>
        </div>
        <p style="text-align: center; color: var(--text-dark); margin-bottom: 25px;">
            We're adding flights from <strong>${userCountry}</strong> soon! Browse other available flights below.
        </p>
        <div class="flights-section-header other-section-header">
            <h2><i class="fas fa-globe"></i> All Available Flights</h2>
            <span class="flight-count">${flights.length} flight${flights.length > 1 ? 's' : ''}</span>
        </div>
        <div class="content-grid">
            ${flights.map(f => buildFlightCard(f, false)).join('')}
        </div>
    `;
}

function displayAllFlights(flights) {
    const container = document.getElementById('flightsContainer');

    let html = '';

    if (!isUserLoggedIn()) {
        html += `
            <div class="login-prompt">
                <p><i class="fas fa-info-circle"></i> Log in to see flights from your country first!</p>
                <a href="login.html"><i class="fas fa-sign-in-alt"></i> Sign In</a>
            </div>
        `;
    }

    html += `
        <div class="flights-section-header other-section-header">
            <h2><i class="fas fa-globe"></i> All Available Flights</h2>
            <span class="flight-count">${flights.length} flight${flights.length > 1 ? 's' : ''}</span>
        </div>
        <div class="content-grid">
            ${flights.map(f => buildFlightCard(f, false)).join('')}
        </div>
    `;

    container.innerHTML = html;
}

function buildFlightCard(flight, isUserCountry) {
    const seatsClass = flight.seats > 30 ? 'seats-available' : 'seats-low';
    const badge = isUserCountry
        ? '<span class="country-badge"><i class="fas fa-flag"></i> Your Country</span>'
        : '';

    return `
        <div class="content-card">
            ${badge}
            <div class="flight-route">
                <span class="city">${flight.departure}</span>
                <i class="fas fa-plane plane-icon"></i>
                <span class="city">${flight.arrival}</span>
            </div>
            <p><i class="fas fa-building"></i> <strong>Airline:</strong> ${flight.airline}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Date:</strong> ${formatFlightDate(flight.date)}</p>
            <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${flight.time}</p>
            <p><i class="fas fa-hourglass-half"></i> <strong>Duration:</strong> ${flight.duration || 'N/A'}</p>
            <p><i class="fas fa-chair"></i> <strong>Seats:</strong> <span class="${seatsClass}">${flight.seats} available</span></p>
            <p><i class="fas fa-dollar-sign"></i> <strong>Price:</strong> <span style="color: var(--gold); font-weight: bold; font-size: 1.1rem;">$${flight.price}</span> per person</p>
            <button class="btn btn-gold btn-full" onclick="openFlightBookingModal('${flight._id}')">
                <i class="fas fa-shopping-cart"></i> Book Flight
            </button>
        </div>
    `;
}

function formatFlightDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ===================================
// FLIGHT BOOKING MODAL FUNCTIONS
// ===================================
function openFlightBookingModal(flightId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to book a flight.');
        window.location.href = 'login.html';
        return;
    }

    const flight = window.flightsData.find(f => f._id === flightId);
    if (!flight) {
        alert('Flight not found. Please refresh the page.');
        return;
    }

    selectedFlight = flight;

    const modalFlightInfo = document.getElementById('modalFlightInfo');
    if (modalFlightInfo) {
        modalFlightInfo.innerHTML = `
            <div style="background-color: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div class="flight-route" style="margin-bottom: 15px;">
                    <span class="city">${flight.departure}</span>
                    <i class="fas fa-plane plane-icon"></i>
                    <span class="city">${flight.arrival}</span>
                </div>
                <p style="color: #fff; margin: 5px 0;"><i class="fas fa-building"></i> ${flight.airline}</p>
                <p style="color: #fff; margin: 5px 0;"><i class="fas fa-calendar"></i> ${formatFlightDate(flight.date)} at ${flight.time}</p>
                <p style="color: #fff; margin: 5px 0;"><i class="fas fa-chair"></i> ${flight.seats} seats available</p>
                <p style="color: var(--gold); margin: 5px 0; font-weight: bold;"><i class="fas fa-dollar-sign"></i> $${flight.price} per person</p>
            </div>
        `;
    }

    const summaryFlight = document.getElementById('summaryFlight');
    const summaryAirline = document.getElementById('summaryAirline');
    const summaryDate = document.getElementById('summaryDate');
    const summaryTime = document.getElementById('summaryTime');

    if (summaryFlight) summaryFlight.textContent = `${flight.departure} → ${flight.arrival}`;
    if (summaryAirline) summaryAirline.textContent = flight.airline;
    if (summaryDate) summaryDate.textContent = formatFlightDate(flight.date);
    if (summaryTime) summaryTime.textContent = flight.time;

    const travelClass = document.getElementById('travelClass');
    const numPassengers = document.getElementById('numPassengers');
    const luggageOption = document.getElementById('luggageOption');

    if (travelClass) travelClass.value = '';
    if (numPassengers) numPassengers.value = 1;
    if (luggageOption) luggageOption.value = '';

    const bookingError = document.getElementById('bookingError');
    const bookingSuccess = document.getElementById('bookingSuccess');
    if (bookingError) bookingError.classList.remove('active');
    if (bookingSuccess) bookingSuccess.classList.remove('active');

    const submitBtn = document.getElementById('bookNowBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
    }

    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('active');
    updateFlightBookingSummary();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('active');
    const bookingError = document.getElementById('bookingError');
    const bookingSuccess = document.getElementById('bookingSuccess');
    if (bookingError) bookingError.classList.remove('active');
    if (bookingSuccess) bookingSuccess.classList.remove('active');
    selectedFlight = null;
}

function getTravelClassPrice(travelClass) {
    switch (travelClass) {
        case 'economy': return 0;
        case 'business': return 200;
        case 'first': return 500;
        default: return 0;
    }
}

function getLuggagePrice(luggageOption) {
    switch (luggageOption) {
        case 'carry-on': return 0;
        case 'checked-1': return 35;
        case 'checked-2': return 60;
        default: return 0;
    }
}

function formatLuggageOption(luggageOption) {
    switch (luggageOption) {
        case 'carry-on': return 'Carry-on Only';
        case 'checked-1': return '1 Checked Bag (+$35)';
        case 'checked-2': return '2 Checked Bags (+$60)';
        default: return '-';
    }
}

function updateFlightBookingSummary() {
    const travelClassEl = document.getElementById('travelClass');
    const numPassengersEl = document.getElementById('numPassengers');
    const luggageOptionEl = document.getElementById('luggageOption');

    if (!travelClassEl || !numPassengersEl || !luggageOptionEl) return;

    const travelClass = travelClassEl.value;
    const numPassengers = parseInt(numPassengersEl.value) || 1;
    const luggageOption = luggageOptionEl.value;

    const summaryClass = document.getElementById('summaryClass');
    const summaryPassengers = document.getElementById('summaryPassengers');
    const summaryLuggage = document.getElementById('summaryLuggage');
    const summaryPricePerPerson = document.getElementById('summaryPricePerPerson');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryClass) summaryClass.textContent = travelClass
        ? travelClass.charAt(0).toUpperCase() + travelClass.slice(1) : '-';
    if (summaryPassengers) summaryPassengers.textContent = numPassengers;
    if (summaryLuggage) summaryLuggage.textContent = formatLuggageOption(luggageOption);

    if (selectedFlight && travelClass && luggageOption) {
        const basePrice = selectedFlight.price;
        const classExtra = getTravelClassPrice(travelClass);
        const luggageExtra = getLuggagePrice(luggageOption);
        const pricePerPerson = basePrice + classExtra + luggageExtra;
        const total = pricePerPerson * numPassengers;

        if (summaryPricePerPerson) summaryPricePerPerson.textContent = pricePerPerson;
        if (summaryTotal) summaryTotal.textContent = total;
    } else {
        if (summaryPricePerPerson) summaryPricePerPerson.textContent = selectedFlight ? selectedFlight.price : '0';
        if (summaryTotal) summaryTotal.textContent = '0';
    }
}

function showFlightBookingError(message) {
    const errorEl = document.getElementById('bookingError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('active');
        setTimeout(() => { errorEl.classList.remove('active'); }, 5000);
    }
}

function showFlightBookingSuccess(message) {
    const successEl = document.getElementById('bookingSuccess');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('active');
    }
}

function setupFlightBookingForm() {
    const form = document.getElementById('flightBookingForm');
    if (!form) return;

    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeBookingModal();
        });
    }

    const travelClass = document.getElementById('travelClass');
    const numPassengers = document.getElementById('numPassengers');
    const luggageOption = document.getElementById('luggageOption');

    if (travelClass) travelClass.addEventListener('change', updateFlightBookingSummary);
    if (numPassengers) numPassengers.addEventListener('input', updateFlightBookingSummary);
    if (luggageOption) luggageOption.addEventListener('change', updateFlightBookingSummary);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const travelClassVal = document.getElementById('travelClass').value;
        const numPassengersVal = parseInt(document.getElementById('numPassengers').value);
        const luggageOptionVal = document.getElementById('luggageOption').value;
        const token = localStorage.getItem('token');

        if (!selectedFlight) { showFlightBookingError('No flight selected.'); return; }
        if (!travelClassVal) { showFlightBookingError('Please select a travel class.'); return; }
        if (!luggageOptionVal) { showFlightBookingError('Please select a luggage option.'); return; }
        if (numPassengersVal > selectedFlight.seats) {
            showFlightBookingError(`Only ${selectedFlight.seats} seats available.`);
            return;
        }

        const basePrice = selectedFlight.price;
        const classExtra = getTravelClassPrice(travelClassVal);
        const luggageExtra = getLuggagePrice(luggageOptionVal);
        const pricePerPerson = basePrice + classExtra + luggageExtra;
        const totalPrice = pricePerPerson * numPassengersVal;

        const submitBtn = document.getElementById('bookNowBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        document.getElementById('bookingError').classList.remove('active');
        document.getElementById('bookingSuccess').classList.remove('active');

        try {
            const response = await fetch(`${API_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingType: 'flight',
                    itemName: `${selectedFlight.departure} → ${selectedFlight.arrival} - ${selectedFlight.airline}`,
                    pricePerUnit: pricePerPerson,
                    quantity: numPassengersVal,
                    totalPrice: totalPrice,
                    eventDate: selectedFlight.date,
                    itemDetails: {
                        flightId: selectedFlight._id,
                        departure: selectedFlight.departure,
                        arrival: selectedFlight.arrival,
                        airline: selectedFlight.airline,
                        date: selectedFlight.date,
                        time: selectedFlight.time,
                        travelClass: travelClassVal,
                        numPassengers: numPassengersVal,
                        luggageOption: luggageOptionVal,
                        pricePerPerson: pricePerPerson
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                const bookingRef = data.booking.bookingReference;
                showFlightBookingSuccess(`✅ Booking confirmed! Reference: ${bookingRef}`);
                setTimeout(() => {
                    alert(`🎉 Flight Booking Confirmed!\n\nReference: ${bookingRef}\nFlight: ${selectedFlight.departure} → ${selectedFlight.arrival}\nAirline: ${selectedFlight.airline}\nDate: ${formatFlightDate(selectedFlight.date)}\nTime: ${selectedFlight.time}\nClass: ${travelClassVal}\nPassengers: ${numPassengersVal}\nTotal: $${totalPrice}\n\nView in My Account.`);
                    closeBookingModal();
                    loadTravelFlights();
                }, 2000);
            } else {
                showFlightBookingError(data.message || 'Booking failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
            }
        } catch (error) {
            console.error('Booking error:', error);
            showFlightBookingError('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
        }
    });
}

// ===================================
// HOTELS
// ===================================
async function loadHotels() {
    try {
        const response = await fetch(`${API_URL}/api/hotels`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Hotels loaded:', data.hotels.length);
            displayHotels(data.hotels);
        }
    } catch (error) {
        console.error('❌ Error loading hotels:', error);
    }
}

function displayHotels(hotels) {
    const hotelsContainer = document.getElementById('hotelsContainer');
    if (!hotelsContainer) return;

    if (hotels.length === 0) {
        hotelsContainer.innerHTML = '<p>No hotels available at the moment.</p>';
        return;
    }

    hotelsContainer.innerHTML = hotels.map(hotel => `
        <div class="hotel-card">
            <div class="hotel-info">
                <h3>${hotel.name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${hotel.city}</p>
                <p><i class="fas fa-star"></i> ${hotel.rating} stars</p>
                <p><i class="fas fa-route"></i> ${hotel.distance_to_stadium} from stadium</p>
            </div>
            <div class="hotel-price">
                <p class="price">$${hotel.price_per_night}/night</p>
                <p class="rooms">${hotel.rooms} rooms available</p>
            </div>
            <button class="btn btn-gold" onclick="bookHotel('${hotel._id}')">Book Hotel</button>
        </div>
    `).join('');
}

// ===================================
// BOOKING FUNCTIONS
// ===================================
async function bookFlight(flightId) {
    if (!isLoggedIn()) {
        alert('Please login to book a flight.');
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `travel.html?flight=${flightId}`;
}

async function bookHotel(hotelId) {
    if (!isLoggedIn()) {
        alert('Please login to book a hotel.');
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `hotel.html?hotel=${hotelId}`;
}

// ===================================
// COUNTDOWN SYSTEM
// ===================================
let worldCupTargetDate = null;
let nextMatchTargetDate = null;

async function loadWorldCupConfig() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        const data = await response.json();
        
        if (data.success) {
            worldCupTargetDate = new Date(data.worldCupStartDate);
            console.log('✅ World Cup config loaded');
        }
    } catch (error) {
        console.error('❌ Error loading world cup config:', error);
        worldCupTargetDate = new Date('2026-06-11T19:00:00Z');
    }
}

async function loadNextMatch() {
    try {
        const response = await fetch(`${API_URL}/api/next-match`);
        const data = await response.json();

        if (data.message) {
            const teamsEl = document.getElementById('nextMatchTeams');
            const stadiumEl = document.getElementById('nextMatchStadium');
            const dateEl = document.getElementById('nextMatchDate');

            if (teamsEl) teamsEl.textContent = 'No upcoming matches';
            if (stadiumEl) stadiumEl.textContent = '';
            if (dateEl) dateEl.textContent = '';
            return;
        }

        if (data.success && data.match) {
            nextMatchTargetDate = new Date(data.match.datetime);

            const teamsEl = document.getElementById('nextMatchTeams');
            const stadiumEl = document.getElementById('nextMatchStadium');
            const dateEl = document.getElementById('nextMatchDate');

            if (teamsEl) teamsEl.textContent = `${data.match.team1} vs ${data.match.team2}`;
            if (stadiumEl) stadiumEl.textContent = data.match.stadium;
            if (dateEl) dateEl.textContent = `${data.match.date} at ${data.match.time} UTC`;
        }
    } catch (error) {
        console.error('❌ Error loading next match:', error);
    }
}

function updateCountdown(targetDate, prefix) {
    if (!targetDate) return;

    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    const daysEl = document.getElementById(`${prefix}-days`);
    const hoursEl = document.getElementById(`${prefix}-hours`);
    const minutesEl = document.getElementById(`${prefix}-minutes`);
    const secondsEl = document.getElementById(`${prefix}-seconds`);

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    if (distance <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
}

function startCountdowns() {
    setInterval(() => {
        updateCountdown(worldCupTargetDate, 'wc');
        updateCountdown(nextMatchTargetDate, 'match');
    }, 1000);
}

// ===================================
// FAQ ACCORDION
// ===================================
function setupFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-accordion');

    faqItems.forEach(item => {
        const button = item.querySelector('.faq-question');

        if (button) {
            button.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        }
    });
}

// ===================================
// LIVE CHAT WIDGET
// ===================================
function toggleLiveChat() {
    const chatBox = document.getElementById('liveChatBox');
    if (!chatBox) return;
    chatBox.classList.toggle('active');
}

function appendChatMessage(type, text) {
    const chatBody = document.getElementById('liveChatBody');
    if (!chatBody) return;

    const message = document.createElement('div');
    message.className = type === 'user' ? 'user-message' : 'chat-response';
    message.innerHTML = `<p>${text}</p>`;
    chatBody.appendChild(message);

    chatBody.scrollTop = chatBody.scrollHeight;
}

function sendQuickChat(topic) {
    const responses = {
        tickets: {
            user: 'Tickets',
            bot: 'You can book tickets by visiting the Tickets page, selecting your match, choosing a category, and completing your booking process.'
        },
        travel: {
            user: 'Travel',
            bot: 'Travel options are available on the Travel page. You can explore available flights and prepare your World Cup trip from there.'
        },
        hotels: {
            user: 'Hotels',
            bot: 'Hotel options are available on the Hotel page. You can compare accommodations and choose a stay near your preferred stadium or host city.'
        },
        payments: {
            user: 'Payments',
            bot: 'Payment information is available on the Payments page. We accept credit cards and cryptocurrency payments.'
        },
        agent: {
            user: 'Chat with Live Agent',
            bot: 'For immediate assistance, contact us via WhatsApp at +1 (615) 414-5082 or email at worldcupbookinghub@gmail.com'
        }
    };

    if (!responses[topic]) return;

    appendChatMessage('user', responses[topic].user);

    setTimeout(() => {
        appendChatMessage('bot', responses[topic].bot);
    }, 500);
}

// ===================================
// CONTACT FORM - CONNECTED TO BACKEND
// ===================================
async function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const subject = document.getElementById('contactSubject')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        if (!name || !email || !message) {
            alert('Please fill in all required fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await response.json();

            if (data.success) {
                alert('Message sent successfully! We will respond within 24 hours.');
                contactForm.reset();
            } else {
                alert(data.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            alert('Network error. Please try again or contact us via WhatsApp.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        }
    });
}

// ===================================
// ACCOUNT PAGE - LOAD USER DATA
// ===================================
async function loadAccountData() {
    const accountContainer = document.getElementById('accountData');
    if (!accountContainer) return;

    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getUser();
    const token = getToken();

    if (!user.isEmailVerified) {
        window.location.href = 'verify-email.html';
        return;
    }

    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.innerHTML = `
            <h3>Welcome, ${user.name}!</h3>
            <p><i class="fas fa-envelope"></i> ${user.email}</p>
            <p><i class="fab fa-whatsapp"></i> ${user.whatsapp || 'Not provided'}</p>
            <p><i class="fas fa-globe"></i> ${user.country || 'Not provided'}</p>
            <p><i class="fas fa-user-tag"></i> ${user.role || 'User'}</p>
        `;
    }

    try {
        const response = await fetch(`${API_URL}/api/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        const bookingsContainer = document.getElementById('userBookings');
        if (bookingsContainer && data.success) {
            if (data.bookings.length === 0) {
                bookingsContainer.innerHTML = '<p>You have no bookings yet.</p>';
            } else {
                bookingsContainer.innerHTML = data.bookings.map(booking => `
                    <div class="booking-item">
                        <h4>${booking.itemName}</h4>
                        <p>Type: ${booking.bookingType}</p>
                        <p>Reference: ${booking.bookingReference}</p>
                        <p>Status: <span class="status-${booking.status}">${booking.status}</span></p>
                        <p>Total: $${booking.totalPrice}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// ===================================
// ANIMATION ON SCROLL
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.booking-card, .package-item, .match-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// ===================================
// INITIALIZE EVERYTHING ON PAGE LOAD
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏆 FIFA World Cup 2026 - Initializing...');

    // Initialize language system FIRST
    if (typeof initLanguageSystem === 'function') {
        initLanguageSystem();
    }

    // Update navbar based on login status
    updateNavbar();

    // Re-apply translations after navbar update (navbar innerHTML changed)
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }

    // Load data from backend
    await loadMatches();
    await loadFlights();
    await loadHotels();

    // Setup flight booking form (if on travel page)
    setupFlightBookingForm();

    // Load countdown data
    await loadWorldCupConfig();
    await loadNextMatch();
    startCountdowns();

    // Setup forms
    setupLoginValidation();
    setupRegisterValidation();
    setupEmailVerification();
    setupForgotPasswordForm();
    setupContactForm();
    setupFaqAccordion();

    // Load account data if on account page
    loadAccountData();

    console.log('✅ FIFA World Cup 2026 - Ready!');
});

// ===================================
// CONTACT BUTTON HANDLER
// ===================================
const contactButton = document.querySelector('.support-section .btn-primary');
if (contactButton) {
    contactButton.addEventListener('click', () => {
        window.location.href = 'support.html';
    });
}

console.log('✅ World Cup Booking Site - Script Loaded Successfully!');