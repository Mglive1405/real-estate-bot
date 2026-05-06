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

  if (prefs.area && property.area === prefs.area) score += 15;
  if (prefs.rooms && property.rooms === prefs.rooms) score += 12;
  if (prefs.bathrooms && property.bathrooms === prefs.bathrooms) score += 8;
  if (prefs.propertyType && property.type === prefs.propertyType) score += 10;
  if (prefs.furnished) {
    if (prefs.furnished === 'furnished' && property.furnished) score += 6;
    if (prefs.furnished === 'unfurnished' && !property.furnished) score += 6;
  }

  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) score += 12;
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) score += 12;
    else if (prefs.budget === 'high' && property.price >= 600000) score += 12;
  }

  if (prefs.intent === 'investment' && property.price >= 600000) score += 5;
  if (prefs.intent === 'buy' && property.price <= 600000) score += 3;

  if (prefs.preferences && Array.isArray(prefs.preferences)) {
    for (const pref of prefs.preferences) {
      if (pref === 'family_friendly' && property.rooms >= 3) score += 4;
      if (pref === 'elevator' && property.amenities.includes('elevator')) score += 3;
      if (pref === 'parking' && property.parking) score += 3;
      if (pref === 'sea_view' && property.view === 'sea') score += 4;
      if (pref === 'pool' && property.amenities.includes('pool')) score += 3;
      if (pref === 'security' && property.amenities.includes('security')) score += 2;
    }
  }

  if (prefs.budget === 'low' && property.price < 300000) score += 2;
  if (prefs.budget === 'high' && property.price >= 900000) score += 2;

  return score;
}

function findBestMatch(prefs) {
  const properties = loadProperties();
  let bestProperty = null;
  let bestScore = -1;
  let reason = '';

  for (const property of properties) {
    const score = scoreProperty(property, prefs);
    if (score > bestScore) {
      bestScore = score;
      bestProperty = property;
    }
  }

  if (!bestProperty) {
    bestProperty = properties[0];
    reason = 'لا يوجد تطابق دقيق، هذا خيار مناسب.';
  } else {
    const reasons = [];
    if (prefs.area && bestProperty.area === prefs.area) reasons.push('في المنطقة اللي طلبتها');
    if (prefs.rooms && bestProperty.rooms === prefs.rooms) reasons.push('عدد الغرف مطابق لطلبك');
    if (prefs.budget) {
      if (prefs.budget === 'low' && bestProperty.price < 400000) reasons.push('سعر مناسب لميزانيتك');
      else if (prefs.budget === 'medium' && bestProperty.price >= 400000 && bestProperty.price < 600000) reasons.push('سعر متوسط مناسب');
      else if (prefs.budget === 'high' && bestProperty.price >= 600000) reasons.push('خيار فاخر لميزانيتك');
    }
    reason = reasons.length > 0 ? reasons.join(' و') + '.' : 'خيار مناسب بناءً على تفضيلاتك.';
  }

  return { property: bestProperty, score: bestScore, reason };
}

module.exports = {
  loadProperties,
  scoreProperty,
  findBestMatch
};