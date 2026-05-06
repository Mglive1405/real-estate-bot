// parser.js - Arabic message parsing helpers

/**
 * Normalize Arabic text by removing diacritics and normalizing variations
 * @param {string} text - The input Arabic text
 * @returns {string} Normalized text
 */
const arabicDigitsMap = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function normalizeArabicText(text) {
  const normalizedNumbers = text.replace(/[٠-٩]/g, digit => arabicDigitsMap[digit] || digit);
  return normalizedNumbers
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/السالميه/g, 'السالمية')
    .replace(/الفروانيه/g, 'الفروانية')
    .replace(/الحولي/g, 'حولي')
    .toLowerCase();
}

/**
 * Detect intent from text
 * @param {string} text - The input text
 * @returns {string|null} 'buy', 'investment', 'general', or null
 */
function detectIntent(text) {
  const normalized = normalizeArabicText(text);
  if (normalized.includes('للبيع') || normalized.includes('تملك') || normalized.includes('شراء')) {
    return 'buy';
  }
  if (normalized.includes('استثمار')) {
    return 'investment';
  }
  if (normalized.includes('شقة') || normalized.includes('سكن')) {
    return 'general';
  }
  return null;
}

/**
 * Detect budget level from text
 * @param {string} text - The input text
 * @returns {string|null} 'low', 'medium', 'high', or null
 */
function detectBudget(text) {
  const normalized = normalizeArabicText(text);
  if (normalized.includes('رخيص') || normalized.includes('منخفض')) {
    return 'low';
  }
  if (normalized.includes('مناسب') || normalized.includes('متوسط')) {
    return 'medium';
  }
  if (normalized.includes('فاخر') || normalized.includes('عالي')) {
    return 'high';
  }

  const numMatch = normalized.match(/(\d+)/);
  if (numMatch) {
    const value = parseInt(numMatch[1], 10);
    if (value < 400) return 'low';
    if (value < 600) return 'medium';
    return 'high';
  }
  return null;
}

/**
 * Detect number of rooms from text
 * @param {string} text - The input text
 * @returns {number|null} Number of rooms or null
 */
function detectRooms(text) {
  const normalized = normalizeArabicText(text);
  const roomMatch = normalized.match(/(\d+)\s*غرف?/);
  if (roomMatch) {
    return parseInt(roomMatch[1], 10);
  }
  if (normalized.includes('غرفتين') || normalized.includes('2 غرف')) return 2;
  if (normalized.includes('ثلاث غرف') || normalized.includes('3 غرف')) return 3;
  if (normalized.includes('أربع غرف') || normalized.includes('4 غرف')) return 4;
  return null;
}

/**
 * Detect preferred area from text
 * @param {string} text - The input text
 * @returns {string|null} Area name or null
 */
function detectArea(text) {
  const normalized = normalizeArabicText(text);
  const areas = ['السالمية', 'حولي', 'الفروانية', 'الدسمة', 'الخالدية', 'الرقعي', 'ميدان حولي'];
  for (const area of areas) {
    if (normalized.includes(area)) {
      return area;
    }
  }
  return null;
}

/**
 * Detect property type from text
 * @param {string} text - The input text
 * @returns {string|null} Property type: 'apartment', 'villa', 'studio', 'office', 'land', or null
 */
function detectPropertyType(text) {
  const normalized = normalizeArabicText(text);
  if (normalized.includes('فيلا') || normalized.includes('دوبلكس')) return 'villa';
  if (normalized.includes('شقة')) return 'apartment';
  if (normalized.includes('ستوديو') || normalized.includes('استوديو')) return 'studio';
  if (normalized.includes('مكتب') || normalized.includes('تجاري')) return 'office';
  if (normalized.includes('أرض') || normalized.includes('ارض')) return 'land';
  return null;
}

/**
 * Detect furnished status from text
 * @param {string} text - The input text
 * @returns {string|null} 'furnished', 'unfurnished', or null
 */
function detectFurnished(text) {
  const normalized = normalizeArabicText(text);
  if (normalized.includes('مفروش') || normalized.includes('مفروشة')) return 'furnished';
  if (normalized.includes('غير مفروش') || normalized.includes('بدون مفروشات')) return 'unfurnished';
  return null;
}

/**
 * Detect if looking for rent vs buy from text
 * @param {string} text - The input text
 * @returns {string|null} 'buy', 'rent', or null
 */
function detectSaleVsRent(text) {
  const normalized = normalizeArabicText(text);
  if (normalized.includes('للبيع') || normalized.includes('تملك') || normalized.includes('شراء')) {
    return 'buy';
  }
  if (normalized.includes('للإيجار') || normalized.includes('إيجار') || normalized.includes('استأجر')) {
    return 'rent';
  }
  return null;
}

/**
 * Detect special preferences from text
 * @param {string} text - The input text
 * @returns {Array<string>} Array of preferences found
 */
function detectPreferences(text) {
  const normalized = normalizeArabicText(text);
  const prefs = [];
  
  if (normalized.includes('أسانسير') || normalized.includes('اسانسير')) prefs.push('elevator');
  if (normalized.includes('موقف') || normalized.includes('جراج')) prefs.push('parking');
  if (normalized.includes('بحري') || normalized.includes('إطلالة بحرية')) prefs.push('sea_view');
  if (normalized.includes('خدمات') || normalized.includes('خدمة')) prefs.push('near_services');
  if (normalized.includes('مجمع')) prefs.push('compound');
  if (normalized.includes('تكييف')) prefs.push('ac');
  if (normalized.includes('غرفة خادمة')) prefs.push('maid_room');
  if (normalized.includes('حديقة')) prefs.push('garden');
  if (normalized.includes('للعائلات') || normalized.includes('عائلي')) prefs.push('family_friendly');
  if (normalized.includes('عزاب') || normalized.includes('الشباب')) prefs.push('bachelor');
  
  return prefs;
}

module.exports = {
  normalizeArabicText,
  detectIntent,
  detectBudget,
  detectRooms,
  detectArea,
  detectPropertyType,
  detectFurnished,
  detectSaleVsRent,
  detectPreferences
};