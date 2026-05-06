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
  const areas = ['السالمية', 'حولي', 'الفروانية'];
  for (const area of areas) {
    if (normalized.includes(area)) {
      return area;
    }
  }
  return null;
}

module.exports = {
  normalizeArabicText,
  detectIntent,
  detectBudget,
  detectRooms,
  detectArea
};