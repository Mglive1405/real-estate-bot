// parser.js - Arabic and English message parsing helpers

const arabicDigitsMap = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function normalizeText(text) {
  const normalizedNumbers = String(text || '').replace(/[٠-٩]/g, digit => arabicDigitsMap[digit] || digit);
  return normalizedNumbers
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/السالميه/g, 'السالمية')
    .replace(/الفروانيه/g, 'الفروانية')
    .replace(/الحولي/g, 'حولي')
    .replace(/midan hawally/g, 'ميدان حولي')
    .replace(/hawally/g, 'حولي')
    .replace(/farwaniya/g, 'الفروانية')
    .replace(/khaldiya/g, 'الخالدية')
    .replace(/dasma/g, 'الدسمة')
    .replace(/salmiya/g, 'السالمية')
    .replace(/riqaei/g, 'الرقعي')
    .replace(/ricai/g, 'الرقعي')
    .toLowerCase();
}

function detectLanguage(text) {
  const normalized = normalizeText(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasEnglish = /[A-Za-z]/.test(text);
  
  // If no language markers found (only numbers), return null
  if (!hasArabic && !hasEnglish) return null;
  
  if (hasArabic && !hasEnglish) return 'ar';
  if (hasEnglish && !hasArabic) return 'en';
  const englishKeywords = ['buy', 'rent', 'luxury', 'cheap', 'family', 'room', 'apartment', 'villa', 'studio', 'office'];
  if (englishKeywords.some(word => normalized.includes(word))) return 'en';
  return hasArabic ? 'ar' : 'en';
}

function detectIntent(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('للبيع') || normalized.includes('تملك') || normalized.includes('شراء') || normalized.includes('buy')) {
    return 'buy';
  }
  if (normalized.includes('استثمار') || normalized.includes('investment')) {
    return 'investment';
  }
  if (normalized.includes('شقة') || normalized.includes('سكن') || normalized.includes('apartment') || normalized.includes('home')) {
    return 'general';
  }
  return null;
}

function detectIntentDetail(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('سكن') || normalized.includes('سكني') || normalized.includes('comfort') || normalized.includes('home')) {
    return 'comfort';
  }
  if (normalized.includes('استثمار') || normalized.includes('investment')) {
    return 'investment';
  }
  if (normalized.includes('تأجير') || normalized.includes('ايجار') || normalized.includes('rent')) {
    return 'rent';
  }
  return null;
}

function detectBudget(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('رخيص') || normalized.includes('منخفض') || normalized.includes('cheap') || normalized.includes('low')) {
    return 'low';
  }
  if (normalized.includes('مناسب') || normalized.includes('متوسط') || normalized.includes('medium') || normalized.includes('affordable')) {
    return 'medium';
  }
  if (normalized.includes('فاخر') || normalized.includes('عالي') || normalized.includes('luxury') || normalized.includes('expensive') || normalized.includes('high')) {
    return 'high';
  }

  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    const value = Math.round(parseFloat(kMatch[1]) * 1000);
    if (value < 400000) return 'low';
    if (value < 600000) return 'medium';
    return 'high';
  }

  const numMatch = normalized.match(/(\d+[\d,]*)/);
  if (numMatch) {
    const value = parseInt(numMatch[1].replace(/,/g, ''), 10);
    if (value < 400000) return 'low';
    if (value < 600000) return 'medium';
    return 'high';
  }
  return null;
}

function detectRooms(text) {
  const normalized = normalizeText(text);
  const roomMatch = normalized.match(/(\d+)\s*(?:غرف?|beds?)/);
  if (roomMatch) return parseInt(roomMatch[1], 10);
  if (normalized.includes('غرفتين') || normalized.includes('two bedrooms') || normalized.includes('2 bedrooms')) return 2;
  if (normalized.includes('ثلاث غرف') || normalized.includes('three bedrooms') || normalized.includes('3 bedrooms')) return 3;
  if (normalized.includes('أربع غرف') || normalized.includes('four bedrooms') || normalized.includes('4 bedrooms')) return 4;
  if (normalized.includes('studio') || normalized.includes('ستوديو') || normalized.includes('استوديو')) return 1;
  return null;
}

function detectBathrooms(text) {
  const normalized = normalizeText(text);
  const bathMatch = normalized.match(/(\d+)\s*(?:حمام|bath)/);
  if (bathMatch) return parseInt(bathMatch[1], 10);
  if (normalized.includes('حمامين') || normalized.includes('2 baths') || normalized.includes('two baths')) return 2;
  return null;
}

function detectArea(text) {
  const normalized = normalizeText(text);
  const areaMap = {
    'السالمية': 'السالمية', 'salmiya': 'السالمية',
    'حولي': 'حولي', 'hawally': 'حولي',
    'الفروانية': 'الفروانية', 'farwaniya': 'الفروانية',
    'الدسمة': 'الدسمة', 'dasma': 'الدسمة',
    'الخالدية': 'الخالدية', 'khaldiya': 'الخالدية',
    'الرقعي': 'الرقعي', 'riqaei': 'الرقعي', 'ricai': 'الرقعي',
    'ميدان حولي': 'ميدان حولي', 'midan hawally': 'ميدان حولي'
  };
  for (const key of Object.keys(areaMap)) {
    if (normalized.includes(key)) return areaMap[key];
  }
  return null;
}

function detectPropertyType(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('فيلا') || normalized.includes('villa') || normalized.includes('doubles')) return 'villa';
  if (normalized.includes('شقة') || normalized.includes('apartment') || normalized.includes('flat')) return 'apartment';
  if (normalized.includes('ستوديو') || normalized.includes('studio')) return 'studio';
  if (normalized.includes('مكتب') || normalized.includes('office')) return 'office';
  if (normalized.includes('أرض') || normalized.includes('ارض') || normalized.includes('land')) return 'land';
  return null;
}

function detectFurnished(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('مفروش') || normalized.includes('furnished')) return 'furnished';
  if (normalized.includes('غير مفروش') || normalized.includes('بدون مفروشات') || normalized.includes('unfurnished')) return 'unfurnished';
  return null;
}

function detectSaleVsRent(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('للبيع') || normalized.includes('تملك') || normalized.includes('شراء') || normalized.includes('buy')) return 'buy';
  if (normalized.includes('للإيجار') || normalized.includes('إيجار') || normalized.includes('استأجر') || normalized.includes('rent')) return 'rent';
  return null;
}

function detectPreferences(text) {
  const normalized = normalizeText(text);
  const prefs = [];
  if (normalized.includes('أسانسير') || normalized.includes('اسانسير') || normalized.includes('elevator')) prefs.push('elevator');
  if (normalized.includes('موقف') || normalized.includes('جراج') || normalized.includes('parking')) prefs.push('parking');
  if (normalized.includes('بحري') || normalized.includes('إطلالة بحرية') || normalized.includes('sea view')) prefs.push('sea_view');
  if (normalized.includes('خدمات') || normalized.includes('خدمة') || normalized.includes('near services') || normalized.includes('nearby')) prefs.push('near_services');
  if (normalized.includes('مجمع') || normalized.includes('compound')) prefs.push('compound');
  if (normalized.includes('تكييف') || normalized.includes('air conditioning') || normalized.includes('ac')) prefs.push('ac');
  if (normalized.includes('غرفة خادمة') || normalized.includes('maid room')) prefs.push('maid_room');
  if (normalized.includes('حديقة') || normalized.includes('garden')) prefs.push('garden');
  if (normalized.includes('للعائلات') || normalized.includes('عائلي') || normalized.includes('family')) prefs.push('family_friendly');
  if (normalized.includes('عزاب') || normalized.includes('الشباب') || normalized.includes('bachelor')) prefs.push('bachelor');
  if (normalized.includes('مسبح') || normalized.includes('pool')) prefs.push('pool');
  if (normalized.includes('أمن') || normalized.includes('security')) prefs.push('security');
  return [...new Set(prefs)];
}

function detectContactMethod(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('واتساب') || normalized.includes('واتس') || normalized.includes('whatsapp')) return 'whatsapp';
  if (normalized.includes('اتصال') || normalized.includes('call') || normalized.includes('phone')) return 'call';
  return null;
}

function detectSelectionOrdinal(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('الأول') || normalized.includes('اول') || normalized.includes('first')) return 1;
  if (normalized.includes('الثاني') || normalized.includes('ثاني') || normalized.includes('second')) return 2;
  if (normalized.includes('الثالث') || normalized.includes('ثالث') || normalized.includes('third')) return 3;
  if (normalized.includes('الرابع') || normalized.includes('رابع') || normalized.includes('fourth')) return 4;
  if (normalized.includes('الخامس') || normalized.includes('خامس') || normalized.includes('fifth')) return 5;
  return null;
}

function detectNumericCommand(text) {
  const normalized = normalizeText(text);
  const digitMatch = normalized.match(/\b([1-6])\b/);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  return null;
}

function detectSelectionIndex(text) {
  const ordinal = detectSelectionOrdinal(text);
  if (ordinal) return ordinal;
  const numeric = detectNumericCommand(text);
  if (!numeric) return null;
  const normalized = normalizeText(text);
  if (/\b(first|second|third|fourth|fifth|property|رقم|الأول|الثاني|الثالث|الرابع|الخامس)\b/.test(normalized)) {
    return numeric;
  }
  return null;
}

function detectFollowUpAction(text) {
  const normalized = normalizeText(text);
  if (/(تفاصيل|details|first|first property|الأول|اول)/.test(normalized)) return 'details';
  if (/(أرخص|cheaper|cheapest)/.test(normalized)) return 'cheaper';
  if (/(أفخم|luxury|fancier)/.test(normalized)) return 'luxury';
  if (/(منطقة ثانية|another area|same specs elsewhere|غير المنطقة)/.test(normalized)) return 'another_area';
  if (/(واتساب|واتس|whatsapp|اتصال|call|phone|تواصل)/.test(normalized)) return 'contact';
  if (/(نعم تواصل|yes contact|contact me|connect me)/.test(normalized)) return 'confirm_contact';
  return null;
}

function detectName(text) {
  const normalized = String(text || '').trim();
  const match = normalized.match(/(?:يا\s+|ya\s+|hi\s+|hello\s+|hey\s+)([A-Za-z][A-Za-z]+)/i);
  return match ? match[1] : null;
}

module.exports = {
  normalizeText,
  detectLanguage,
  detectIntent,
  detectIntentDetail,
  detectBudget,
  detectRooms,
  detectBathrooms,
  detectArea,
  detectPropertyType,
  detectFurnished,
  detectSaleVsRent,
  detectPreferences,
  detectContactMethod,
  detectSelectionOrdinal,
  detectNumericCommand,
  detectSelectionIndex,
  detectFollowUpAction,
  detectName
};
