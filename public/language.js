// ===================================
// FIFA WORLD CUP 2026 - LANGUAGE SYSTEM
// Auto-detect & Switch Languages
// ===================================

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'ar', 'zh', 'ja'];
const DEFAULT_LANGUAGE = 'en';
const RTL_LANGUAGES = ['ar'];

const LANGUAGE_NAMES = {
    en: { name: 'English', flag: '🇬🇧', native: 'English' },
    es: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    fr: { name: 'French', flag: '🇫🇷', native: 'Français' },
    pt: { name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
    de: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    ar: { name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    zh: { name: 'Chinese', flag: '🇨🇳', native: '中文' },
    ja: { name: 'Japanese', flag: '🇯🇵', native: '日本語' },
};

// ===================================
// DETECT LANGUAGE
// Priority: saved → browser → country → default
// ===================================
function detectLanguage() {
    // 1. Check saved preference
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
    }

    // 2. Check browser language
    const browserLang = navigator.language || navigator.userLanguage || '';
    const browserCode = browserToLang[browserLang] || browserToLang[browserLang.split('-')[0]];
    if (browserCode && SUPPORTED_LANGUAGES.includes(browserCode)) {
        return browserCode;
    }

    // 3. Check user's registered country
    try {
        const user = localStorage.getItem('user');
        if (user) {
            const parsed = JSON.parse(user);
            if (parsed.country && countryToLanguage[parsed.country]) {
                const countryLang = countryToLanguage[parsed.country];
                if (SUPPORTED_LANGUAGES.includes(countryLang)) {
                    return countryLang;
                }
            }
        }
    } catch (e) {}

    // 4. Default to English
    return DEFAULT_LANGUAGE;
}

// ===================================
// GET TRANSLATION
// ===================================
function t(key) {
    const lang = getCurrentLanguage();
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Fallback to English
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

// ===================================
// GET CURRENT LANGUAGE
// ===================================
function getCurrentLanguage() {
    return localStorage.getItem('preferredLanguage') || DEFAULT_LANGUAGE;
}

// ===================================
// SET LANGUAGE
// ===================================
function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;

    localStorage.setItem('preferredLanguage', lang);

    // Handle RTL languages
    if (RTL_LANGUAGES.includes(lang)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', lang);
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }

    // Apply translations
    applyTranslations();

    // Update language selector UI
    updateLanguageSelectorUI(lang);
}

// ===================================
// APPLY TRANSLATIONS TO PAGE
// ===================================
function applyTranslations() {
    const lang = getCurrentLanguage();

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            } else {
                el.value = translation;
            }
        } else if (el.tagName === 'SELECT') {
            // Don't replace select content
        } else {
            el.textContent = translation;
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Translate titles/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
}

// ===================================
// BUILD LANGUAGE SELECTOR HTML
// ===================================
function buildLanguageSelector() {
    const currentLang = getCurrentLanguage();
    const currentInfo = LANGUAGE_NAMES[currentLang];

    return `
        <div class="language-selector" id="languageSelector">
            <button class="lang-toggle" id="langToggle" onclick="toggleLanguageDropdown()" aria-label="Select Language">
                <span class="lang-flag">${currentInfo.flag}</span>
                <span class="lang-code">${currentLang.toUpperCase()}</span>
                <i class="fas fa-chevron-down lang-arrow"></i>
            </button>
            <div class="lang-dropdown" id="langDropdown">
                ${SUPPORTED_LANGUAGES.map(lang => `
                    <button class="lang-option ${lang === currentLang ? 'active' : ''}" 
                            onclick="selectLanguage('${lang}')">
                        <span class="lang-flag">${LANGUAGE_NAMES[lang].flag}</span>
                        <span class="lang-native">${LANGUAGE_NAMES[lang].native}</span>
                        ${lang === currentLang ? '<i class="fas fa-check lang-check"></i>' : ''}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ===================================
// TOGGLE LANGUAGE DROPDOWN
// ===================================
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('langDropdown');
    const toggle = document.getElementById('langToggle');
    if (!dropdown) return;

    dropdown.classList.toggle('active');
    toggle.classList.toggle('active');
}

// ===================================
// SELECT LANGUAGE
// ===================================
function selectLanguage(lang) {
    setLanguage(lang);

    // Close dropdown
    const dropdown = document.getElementById('langDropdown');
    const toggle = document.getElementById('langToggle');
    if (dropdown) dropdown.classList.remove('active');
    if (toggle) toggle.classList.remove('active');
}

// ===================================
// UPDATE LANGUAGE SELECTOR UI
// ===================================
function updateLanguageSelectorUI(lang) {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    const info = LANGUAGE_NAMES[lang];
    const flagEl = langToggle.querySelector('.lang-flag');
    const codeEl = langToggle.querySelector('.lang-code');

    if (flagEl) flagEl.textContent = info.flag;
    if (codeEl) codeEl.textContent = lang.toUpperCase();

    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(btn => {
        const btnLang = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        btn.classList.toggle('active', btnLang === lang);
        const check = btn.querySelector('.lang-check');
        if (btnLang === lang && !check) {
            btn.innerHTML += '<i class="fas fa-check lang-check"></i>';
        } else if (btnLang !== lang && check) {
            check.remove();
        }
    });
}

// ===================================
// INJECT LANGUAGE SELECTOR INTO NAVBAR
// ===================================
function injectLanguageSelector() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    // Check if already injected
    if (document.getElementById('languageSelector')) return;

    const selectorHTML = buildLanguageSelector();
    navAuth.insertAdjacentHTML('beforebegin', selectorHTML);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const selector = document.getElementById('languageSelector');
        if (selector && !selector.contains(e.target)) {
            const dropdown = document.getElementById('langDropdown');
            const toggle = document.getElementById('langToggle');
            if (dropdown) dropdown.classList.remove('active');
            if (toggle) toggle.classList.remove('active');
        }
    });
}

// ===================================
// INITIALIZE LANGUAGE SYSTEM
// ===================================
function initLanguageSystem() {
    // Detect and set language
    const detectedLang = detectLanguage();
    setLanguage(detectedLang);

    // Inject selector into navbar
    injectLanguageSelector();

    console.log(`🌍 Language set to: ${detectedLang}`);
}