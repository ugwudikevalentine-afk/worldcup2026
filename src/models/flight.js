import mongoose from 'mongoose';

// ===================================
// CITY TO COUNTRY MAPPING
// Auto-detect country from departure city
// ===================================
const cityToCountry = {
    // Africa
    'lagos': 'Nigeria', 'abuja': 'Nigeria', 'port harcourt': 'Nigeria', 'kano': 'Nigeria',
    'accra': 'Ghana', 'kumasi': 'Ghana',
    'nairobi': 'Kenya', 'mombasa': 'Kenya',
    'cairo': 'Egypt', 'alexandria': 'Egypt',
    'johannesburg': 'South Africa', 'cape town': 'South Africa', 'durban': 'South Africa',
    'casablanca': 'Morocco', 'rabat': 'Morocco', 'marrakech': 'Morocco',
    'algiers': 'Algeria', 'oran': 'Algeria',
    'tunis': 'Tunisia',
    'dakar': 'Senegal',
    'addis ababa': 'Ethiopia',
    'dar es salaam': 'Tanzania',
    'kampala': 'Uganda',
    'luanda': 'Angola',
    'douala': 'Cameroon', 'yaounde': 'Cameroon',
    'kinshasa': 'DR Congo',
    'maputo': 'Mozambique',
    'lusaka': 'Zambia',
    'harare': 'Zimbabwe',
    'windhoek': 'Namibia',
    'gaborone': 'Botswana',
    'antananarivo': 'Madagascar',
    'abidjan': 'Ivory Coast',
    'lome': 'Togo',
    'cotonou': 'Benin',
    'bamako': 'Mali',
    'conakry': 'Guinea',
    'freetown': 'Sierra Leone',
    'monrovia': 'Liberia',
    'niamey': 'Niger',
    'ouagadougou': 'Burkina Faso',
    'nouakchott': 'Mauritania',
    'khartoum': 'Sudan',
    'mogadishu': 'Somalia',
    'djibouti': 'Djibouti',
    'asmara': 'Eritrea',
    'banjul': 'Gambia',
    'praia': 'Cape Verde',
    'malabo': 'Equatorial Guinea',
    'libreville': 'Gabon',
    'brazzaville': 'Republic of Congo',
    'bangui': 'Central African Republic',
    'ndjamena': 'Chad',
    'juba': 'South Sudan',
    'kigali': 'Rwanda',
    'bujumbura': 'Burundi',
    'lilongwe': 'Malawi',
    'port louis': 'Mauritius',
    'victoria': 'Seychelles',

    // North America
    'new york': 'United States', 'los angeles': 'United States', 'miami': 'United States',
    'houston': 'United States', 'dallas': 'United States', 'chicago': 'United States',
    'atlanta': 'United States', 'seattle': 'United States', 'san francisco': 'United States',
    'boston': 'United States', 'philadelphia': 'United States', 'washington dc': 'United States',
    'denver': 'United States', 'phoenix': 'United States', 'las vegas': 'United States',
    'orlando': 'United States', 'minneapolis': 'United States', 'detroit': 'United States',
    'toronto': 'Canada', 'vancouver': 'Canada', 'montreal': 'Canada',
    'calgary': 'Canada', 'ottawa': 'Canada', 'edmonton': 'Canada', 'winnipeg': 'Canada',
    'mexico city': 'Mexico', 'guadalajara': 'Mexico', 'monterrey': 'Mexico',
    'cancun': 'Mexico', 'tijuana': 'Mexico', 'puebla': 'Mexico',

    // South America
    'sao paulo': 'Brazil', 'rio de janeiro': 'Brazil', 'brasilia': 'Brazil',
    'buenos aires': 'Argentina', 'cordoba': 'Argentina', 'rosario': 'Argentina',
    'bogota': 'Colombia', 'medellin': 'Colombia', 'cali': 'Colombia',
    'lima': 'Peru', 'cusco': 'Peru',
    'santiago': 'Chile', 'valparaiso': 'Chile',
    'quito': 'Ecuador', 'guayaquil': 'Ecuador',
    'caracas': 'Venezuela',
    'montevideo': 'Uruguay',
    'asuncion': 'Paraguay',
    'la paz': 'Bolivia', 'santa cruz': 'Bolivia',

    // Europe
    'london': 'England', 'manchester': 'England', 'birmingham': 'England', 'liverpool': 'England',
    'paris': 'France', 'lyon': 'France', 'marseille': 'France', 'nice': 'France',
    'madrid': 'Spain', 'barcelona': 'Spain', 'seville': 'Spain', 'valencia': 'Spain',
    'berlin': 'Germany', 'munich': 'Germany', 'frankfurt': 'Germany', 'hamburg': 'Germany',
    'rome': 'Italy', 'milan': 'Italy', 'naples': 'Italy', 'turin': 'Italy',
    'amsterdam': 'Netherlands', 'rotterdam': 'Netherlands',
    'lisbon': 'Portugal', 'porto': 'Portugal',
    'brussels': 'Belgium', 'antwerp': 'Belgium',
    'zurich': 'Switzerland', 'geneva': 'Switzerland',
    'vienna': 'Austria', 'salzburg': 'Austria',
    'warsaw': 'Poland', 'krakow': 'Poland',
    'prague': 'Czech Republic',
    'budapest': 'Hungary',
    'bucharest': 'Romania',
    'athens': 'Greece', 'thessaloniki': 'Greece',
    'istanbul': 'Turkey', 'ankara': 'Turkey', 'izmir': 'Turkey',
    'moscow': 'Russia', 'st petersburg': 'Russia',
    'kyiv': 'Ukraine',
    'stockholm': 'Sweden', 'gothenburg': 'Sweden',
    'oslo': 'Norway', 'bergen': 'Norway',
    'copenhagen': 'Denmark',
    'helsinki': 'Finland',
    'dublin': 'Ireland', 'cork': 'Ireland',
    'edinburgh': 'Scotland', 'glasgow': 'Scotland',
    'cardiff': 'Wales',
    'zagreb': 'Croatia', 'split': 'Croatia',
    'belgrade': 'Serbia',
    'sofia': 'Bulgaria',
    'tirana': 'Albania',
    'ljubljana': 'Slovenia',
    'bratislava': 'Slovakia',
    'tallinn': 'Estonia',
    'riga': 'Latvia',
    'vilnius': 'Lithuania',
    'tbilisi': 'Georgia',
    'yerevan': 'Armenia',
    'baku': 'Azerbaijan',

    // Asia
    'tokyo': 'Japan', 'osaka': 'Japan', 'yokohama': 'Japan',
    'seoul': 'South Korea', 'busan': 'South Korea',
    'beijing': 'China', 'shanghai': 'China', 'guangzhou': 'China', 'shenzhen': 'China',
    'mumbai': 'India', 'delhi': 'India', 'bangalore': 'India', 'kolkata': 'India',
    'chennai': 'India', 'hyderabad': 'India',
    'bangkok': 'Thailand', 'phuket': 'Thailand', 'chiang mai': 'Thailand',
    'kuala lumpur': 'Malaysia', 'penang': 'Malaysia',
    'singapore': 'Singapore',
    'jakarta': 'Indonesia', 'bali': 'Indonesia', 'surabaya': 'Indonesia',
    'manila': 'Philippines', 'cebu': 'Philippines',
    'hanoi': 'Vietnam', 'ho chi minh city': 'Vietnam',
    'taipei': 'Taiwan',
    'hong kong': 'Hong Kong',
    'dubai': 'United Arab Emirates', 'abu dhabi': 'United Arab Emirates',
    'doha': 'Qatar',
    'riyadh': 'Saudi Arabia', 'jeddah': 'Saudi Arabia',
    'kuwait city': 'Kuwait',
    'manama': 'Bahrain',
    'muscat': 'Oman',
    'tehran': 'Iran',
    'baghdad': 'Iraq',
    'amman': 'Jordan',
    'beirut': 'Lebanon',
    'tel aviv': 'Israel',
    'karachi': 'Pakistan', 'lahore': 'Pakistan', 'islamabad': 'Pakistan',
    'dhaka': 'Bangladesh',
    'colombo': 'Sri Lanka',
    'kathmandu': 'Nepal',
    'yangon': 'Myanmar',
    'phnom penh': 'Cambodia',
    'ulaanbaatar': 'Mongolia',
    'tashkent': 'Uzbekistan',
    'almaty': 'Kazakhstan',

    // Oceania
    'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia',
    'perth': 'Australia', 'adelaide': 'Australia',
    'auckland': 'New Zealand', 'wellington': 'New Zealand', 'christchurch': 'New Zealand',

    // Caribbean & Central America
    'kingston': 'Jamaica', 'montego bay': 'Jamaica',
    'nassau': 'Bahamas',
    'port of spain': 'Trinidad and Tobago',
    'bridgetown': 'Barbados',
    'havana': 'Cuba',
    'santo domingo': 'Dominican Republic',
    'panama city': 'Panama',
    'san jose': 'Costa Rica',
    'guatemala city': 'Guatemala'
};

// Function to get country from city
export function getCountryFromCity(city) {
    if (!city) return null;
    const normalized = city.toLowerCase().trim();
    return cityToCountry[normalized] || null;
}

// Get all cities for a country
export function getCitiesForCountry(country) {
    if (!country) return [];
    const cities = [];
    for (const [city, ctry] of Object.entries(cityToCountry)) {
        if (ctry.toLowerCase() === country.toLowerCase()) {
            cities.push(city);
        }
    }
    return cities;
}

const flightSchema = new mongoose.Schema({
    airline: {
        type: String,
        required: [true, 'Airline is required'],
        trim: true
    },
    flightNumber: {
        type: String,
        trim: true
    },
    departure: {
        type: String,
        required: [true, 'Departure city is required'],
        trim: true
    },
    departureCountry: {
        type: String,
        trim: true
    },
    arrival: {
        type: String,
        required: [true, 'Arrival city is required'],
        trim: true
    },
    arrivalCountry: {
        type: String,
        trim: true
    },
    date: {
        type: String,
        required: [true, 'Flight date is required']
    },
    time: {
        type: String,
        required: [true, 'Flight time is required']
    },
    duration: {
        type: String,
        default: '2h 30m'
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    seats: {
        type: Number,
        default: 100,
        min: 0
    },
    class: {
        type: String,
        enum: ['economy', 'business', 'first'],
        default: 'economy'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Auto-detect country from city before saving
flightSchema.pre('save', function(next) {
    if (this.isModified('departure')) {
        this.departureCountry = getCountryFromCity(this.departure) || this.departureCountry;
    }
    if (this.isModified('arrival')) {
        this.arrivalCountry = getCountryFromCity(this.arrival) || this.arrivalCountry;
    }
    next();
});

// Index for faster queries
flightSchema.index({ departure: 1, arrival: 1, date: 1 });
flightSchema.index({ departureCountry: 1 });
flightSchema.index({ isActive: 1 });

const Flight = mongoose.model('Flight', flightSchema);

export default Flight;