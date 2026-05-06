// matcher.js - Property matching logic

const fs = require('fs');
const path = require('path');

/**
 * Load and parse properties from data.txt
 * @returns {Array} Array of property objects
 */
function loadProperties() {
  const dataPath = path.join(__dirname, 'data.txt');
  const content = fs.readFileSync(dataPath, 'utf8');
  const blocks = content.split('---').map(block => block.trim()).filter(block => block);

  const properties = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    const property = {};

    for (const line of lines) {
      if (line.startsWith('📍')) {
        const areaMatch = line.match(/الكويت - (.+)/);
        if (areaMatch) property.area = areaMatch[1].trim();
      } else if (line.startsWith('🏠')) {
        const roomsMatch = line.match(/(\d+) غرف/);
        if (roomsMatch) property.rooms = parseInt(roomsMatch[1]);
      } else if (line.startsWith('💰')) {
        const priceMatch = line.match(/([\d,]+) دينار/);
        if (priceMatch) property.price = parseInt(priceMatch[1].replace(/,/g, ''));
      } else if (line.startsWith('📐')) {
        const sizeMatch = line.match(/(\d+) متر/);
        if (sizeMatch) property.size = parseInt(sizeMatch[1]);
      } else if (line.startsWith('الوصف:')) {
        property.description = line.replace('الوصف:', '').trim();
      }
    }

    if (property.area && property.rooms && property.price && property.size && property.description) {
      properties.push(property);
    }
  }

  return properties;
}

/**
 * Score a property based on user preferences
 * @param {Object} property - Property object
 * @param {Object} prefs - User preferences {intent, budget, rooms, area}
 * @returns {number} Score
 */
function scoreProperty(property, prefs) {
  let score = 0;

  // Area match: strong
  if (prefs.area && property.area === prefs.area) {
    score += 10;
  }

  // Rooms match: strong
  if (prefs.rooms && property.rooms === prefs.rooms) {
    score += 10;
  }

  // Budget fit: strong
  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) score += 10;
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) score += 10;
    else if (prefs.budget === 'high' && property.price >= 600000) score += 10;
  }

  // Intent match: medium (for investment, prefer higher price)
  if (prefs.intent === 'investment' && property.price > 500000) {
    score += 5;
  } else if (prefs.intent === 'buy' && property.price <= 500000) {
    score += 5;
  }

  return score;
}

/**
 * Find the best matching property
 * @param {Object} prefs - User preferences
 * @returns {Object} {property, score, reason}
 */
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
    bestProperty = properties[0]; // fallback
    reason = 'لا يوجد تطابق دقيق، هذا خيار مناسب.';
  } else {
    // Build human reason
    const reasons = [];
    if (prefs.area && bestProperty.area === prefs.area) {
      reasons.push('في المنطقة اللي طلبتها');
    }
    if (prefs.rooms && bestProperty.rooms === prefs.rooms) {
      reasons.push('عدد الغرف مطابق لطلبك');
    }
    if (prefs.budget) {
      if (prefs.budget === 'low' && bestProperty.price < 400000) {
        reasons.push('سعر مناسب لميزانيتك');
      } else if (prefs.budget === 'medium' && bestProperty.price >= 400000 && bestProperty.price < 600000) {
        reasons.push('سعر متوسط مناسب');
      } else if (prefs.budget === 'high' && bestProperty.price >= 600000) {
        reasons.push('خيار فاخر لميزانيتك');
      }
    }
    if (reasons.length > 0) {
      reason = reasons.join(' و') + '.';
    } else {
      reason = 'خيار مناسب بناءً على تفضيلاتك.';
    }
  }

  return { property: bestProperty, score: bestScore, reason };
}

module.exports = {
  loadProperties,
  scoreProperty,
  findBestMatch
};