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

function getRandomReason(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function generateMatchReason(property, prefs, lang = 'ar') {
  const reasons = [];

  if (lang === 'ar') {
    if (prefs.area && property.area === prefs.area) {
      reasons.push(getRandomReason(['موقع ممتاز وقريب من الخدمات', 'منطقة مرغوبة ومريحة', 'إطلالة وموقع جيد']));
    }
    if (prefs.rooms && property.rooms === prefs.rooms) {
      reasons.push(getRandomReason(['عدد الغرف مناسب تماماً', 'مساحة ممتازة لعائلتك', 'تصميم عملي بعدد غرف مناسب']));
    }
    if (prefs.budget) {
      if (prefs.budget === 'low' && property.price < 400000) reasons.push(getRandomReason(['سعر ممتاز بالنسبة للميزانية', 'فرصة قيمة وسعر مناسب', 'صفقة جذابة في هذا النطاق']));
      else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) reasons.push(getRandomReason(['قيمة جيدة مقابل السعر', 'خيار متوازن ومريح', 'سعر مناسب مع جودة عالية']));
      else if (prefs.budget === 'high' && property.price >= 600000) reasons.push(getRandomReason(['خيار فاخر ومتميز', 'تجربة سكن راقية', 'استثمار قوي في موقع ممتاز']));
    }
    if (prefs.intentDetail === 'comfort' && property.rooms >= 3) {
      reasons.push(getRandomReason(['مناسب للعائلة ويعطي راحة أكبر', 'مساحة مريحة للعائلة', 'مناسب لحياة يومية هادئة']));
    }
    if (prefs.intentDetail === 'investment' && property.price >= 500000) {
      reasons.push(getRandomReason(['استثمار جيد وبطلب مرتفع', 'فرصة استثمارية قوية', 'عقار يمكن أن يعطيك عائد ممتاز']));
    }
    if (prefs.intentDetail === 'rent' && (property.nearby.includes('supermarket') || property.nearby.includes('schools'))) {
      reasons.push(getRandomReason(['قريب من الخدمات ومطلوب للإيجار', 'منطقة إيجار مرغوبة للعائلات', 'موقع مناسب للإيجار بشكل قوي']));
    }
    if (property.amenities.includes('parking')) {
      reasons.push('موقف خاص متاح');
    }
    if (property.amenities.includes('security')) {
      reasons.push('أمن وحماية متوفران');
    }
    if (reasons.length === 0) {
      return getRandomReason(['خيار ممتاز يناسب تفضيلاتك', 'من أفضل الخيارات المتاحة الآن', 'عقار قوي بناءً على طلبك']);
    }
    return reasons.slice(0, 2).join(' و ');
  }

  if (prefs.area && property.area === prefs.area) {
    reasons.push(getRandomReason(['Great location near services', 'Popular area with good demand', 'Easy access to neighborhood amenities']));
  }
  if (prefs.rooms && property.rooms === prefs.rooms) {
    reasons.push(getRandomReason(['Ideal room layout', 'Perfect number of rooms', 'Great space for your needs']));
  }
  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) reasons.push(getRandomReason(['Excellent budget fit', 'Very good value', 'Strong budget-friendly choice']));
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) reasons.push(getRandomReason(['Balanced price and quality', 'Great mid-range option', 'Strong value proposition']));
    else if (prefs.budget === 'high' && property.price >= 600000) reasons.push(getRandomReason(['Premium and luxurious', 'Top-tier choice', 'High-end value']));
  }
  if (prefs.intentDetail === 'comfort' && property.rooms >= 3) {
    reasons.push(getRandomReason(['Great family fit', 'Comfortable living space', 'Ideal for daily comfort']));
  }
  if (prefs.intentDetail === 'investment' && property.price >= 500000) {
    reasons.push(getRandomReason(['Strong investment', 'Great return potential', 'Good opportunity']));
  }
  if (prefs.intentDetail === 'rent' && (property.nearby.includes('supermarket') || property.nearby.includes('schools'))) {
    reasons.push(getRandomReason(['High rental demand', 'Great rental location', 'Family-friendly rental area']));
  }
  if (property.amenities.includes('parking')) {
    reasons.push('Private parking');
  }
  if (property.amenities.includes('security')) {
    reasons.push('24/7 security');
  }
  if (reasons.length === 0) {
    return getRandomReason(['Excellent option', 'Great choice', 'Smart pick']);
  }
  return reasons.slice(0, 2).join(' and ');
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

function findTopMatchesByArea(prefs, limit = 3, lang = 'ar') {
  const properties = loadProperties();
  const excludeAreas = prefs.excludeAreas || [];
  const filtered = properties.filter(p => !excludeAreas.includes(p.area));
  const results = filtered.map(property => {
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
  findTopMatches,
  findTopMatchesByArea
};
