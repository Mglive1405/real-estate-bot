// matcher.js - Property matching logic

const fs = require('fs');
const path = require('path');

function loadProperties() {
  const dataPath = path.join(__dirname, 'data.txt');
  const content = fs.readFileSync(dataPath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Unable to parse data.txt as JSON. Please ensure data.txt is a valid JSON array.');
  }
}

function scoreProperty(property, prefs) {
  let score = 0;
  if (!prefs) return score;

  if (prefs.area && property.area === prefs.area) score += 20;
  if (prefs.rooms && property.rooms === prefs.rooms) score += 15;
  if (prefs.bathrooms && property.bathrooms === prefs.bathrooms) score += 8;
  if (prefs.propertyType && property.type === prefs.propertyType) score += 12;

  if (prefs.furnished) {
    if (prefs.furnished === 'furnished' && property.furnished) score += 8;
    if (prefs.furnished === 'unfurnished' && !property.furnished) score += 8;
  }

  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) score += 14;
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) score += 14;
    else if (prefs.budget === 'high' && property.price >= 600000) score += 14;
  }

  if (prefs.intentDetail === 'comfort') {
    if (property.rooms >= 3) score += 7;
    if (property.amenities.includes('parking')) score += 4;
    if (property.amenities.includes('security')) score += 3;
  }

  if (prefs.intentDetail === 'investment') {
    if (property.price >= 500000 && property.price < 1200000) score += 6;
    if (property.view === 'city' || property.view === 'sea') score += 4;
    if (property.amenities.includes('security')) score += 3;
  }

  if (prefs.intentDetail === 'rent') {
    if (property.nearby.includes('supermarket') || property.nearby.includes('schools')) score += 5;
    if (property.area === 'السالمية' || property.area === 'حولي') score += 4;
  }

  if (prefs.intent === 'investment' && property.price >= 600000) score += 5;
  if (prefs.intent === 'buy' && property.price <= 600000) score += 3;
  if (prefs.saleVsRent === 'rent') score += property.area ? 2 : 0;

  if (prefs.preferences && Array.isArray(prefs.preferences)) {
    for (const pref of prefs.preferences) {
      if (pref === 'family_friendly' && property.rooms >= 3) score += 5;
      if (pref === 'elevator' && property.amenities.includes('elevator')) score += 4;
      if (pref === 'parking' && property.parking) score += 4;
      if (pref === 'sea_view' && property.view === 'sea') score += 5;
      if (pref === 'pool' && property.amenities.includes('pool')) score += 4;
      if (pref === 'security' && property.amenities.includes('security')) score += 3;
    }
  }

  if (prefs.budget === 'low' && property.price < 300000) score += 3;
  if (prefs.budget === 'high' && property.price >= 900000) score += 3;

  return score;
}

function generateMatchReason(property, prefs, lang = 'ar') {
  const reasons = [];
  const hasReason = (textAr, textEn) => (lang === 'ar' ? textAr : textEn);

  if (prefs.area && property.area === prefs.area) {
    reasons.push(hasReason('موقع قوي', 'Strong location'));
  }
  if (prefs.rooms && property.rooms === prefs.rooms) {
    reasons.push(hasReason('عدد الغرف مناسب', 'Room count fits')); 
  }
  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) reasons.push(hasReason('سعر مناسب للميزانية', 'Great budget fit'));
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) reasons.push(hasReason('خيار متوازن', 'Balanced price'));
    else if (prefs.budget === 'high' && property.price >= 600000) reasons.push(hasReason('خيار فاخر', 'Premium choice'));
  }
  if (prefs.intentDetail === 'comfort' && property.rooms >= 3) {
    reasons.push(hasReason('هذا خيار ممتاز للعائلة', 'Excellent choice for family'));
  }
  if (prefs.intentDetail === 'investment' && property.price >= 500000) {
    reasons.push(hasReason('استثمار ممتاز بعائد قوي', 'Great investment potential'));
  }
  if (prefs.intentDetail === 'rent' && (property.nearby.includes('supermarket') || property.nearby.includes('schools'))) {
    reasons.push(hasReason('موقع مطلوب للإيجار', 'High demand rental area'));
  }

  if (property.amenities.includes('parking')) {
    reasons.push(hasReason('موقف متاح', 'Parking available'));
  }
  if (property.amenities.includes('security')) {
    reasons.push(hasReason('أمن وخدمات', 'Security and services'));
  }

  if (reasons.length === 0) {
    return hasReason('خيار ممتاز يناسب تفضيلاتك', 'Excellent option for your needs');
  }
  return reasons.slice(0, 3).join(' و');
}

function findTopMatches(prefs, limit = 3, lang = 'ar') {
  const properties = loadProperties();
  const results = properties.map(property => {
    const score = scoreProperty(property, prefs);
    const reason = generateMatchReason(property, prefs, lang);
    return { property, score, reason };
  });

  return results
    .filter(result => result.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  loadProperties,
  scoreProperty,
  generateMatchReason,
  findTopMatches
};
