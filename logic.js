// logic.js - Main smart logic for the real estate bot

const parser = require('./parser');
const matcher = require('./matcher');

/**
 * Detect if message is a numeric command (1-5)
 */
function detectNumericCommand(message) {
  const trimmed = message.trim();
  if (trimmed === '1' || trimmed === '2' || trimmed === '3' || trimmed === '4' || trimmed === '5') {
    return parseInt(trimmed);
  }
  return null;
}

/**
 * Get top N properties matching preferences
 */
function findTopMatches(prefs, limit = 3) {
  const matcher_results = [];
  const allProps = matcher.loadProperties();
  
  for (const prop of allProps) {
    const score = matcher.scoreProperty(prop, prefs);
    if (score >= 0) {
      matcher_results.push({ property: prop, score, reason: generateMatchReason(prop, prefs) });
    }
  }
  
  return matcher_results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Generate reason why property matches user
 */
function generateMatchReason(property, prefs) {
  const reasons = [];
  if (prefs.area && property.area === prefs.area) {
    reasons.push('في المنطقة اللي طلبتها');
  }
  if (prefs.rooms && property.rooms === prefs.rooms) {
    reasons.push('عدد الغرف مطابق');
  }
  if (prefs.budget) {
    if (prefs.budget === 'low' && property.price < 400000) reasons.push('سعر مناسب');
    else if (prefs.budget === 'medium' && property.price >= 400000 && property.price < 600000) reasons.push('سعر متوسط');
    else if (prefs.budget === 'high' && property.price >= 600000) reasons.push('خيار فاخر');
  }
  return reasons.length > 0 ? reasons.join(' و') + '.' : 'خيار مناسب لتفضيلاتك';
}

/**
 * Format a single property in premium style
 */
function formatPropertyCard(prop) {
  return `🏠 النوع: ${prop.rooms > 0 ? prop.rooms + ' غرفة' : 'استثماري'}
📍 الموقع: ${prop.area}
💰 السعر: ${prop.price.toLocaleString('ar-KW')} د.ك
📐 المساحة: ${prop.size} م²

⭐ المميزات:
${prop.description}`;
}

/**
 * Format multiple properties result
 */
function formatMultipleResults(matches) {
  if (matches.length === 0) {
    return `🤔 لم أجد نتائج مطابقة تماماً، لكن لدي خيارات قريبة
جرب تعديل الميزانية أو المنطقة`;
  }

  let response = `✨ عندي لك ${matches.length} خيار ممتاز يناسب طلبك 👌\n\n`;
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    response += `━━━━━━━━━━━━━━━━━━━
${i + 1}. ${formatPropertyCard(match.property)}
✅ ${match.reason}
`;
  }
  
  response += `━━━━━━━━━━━━━━━━━━━
اختر ما يناسبك 👇

1️⃣ تفاصيل الأول
2️⃣ أرخص
3️⃣ أفخم
4️⃣ نفس المواصفات بمنطقة ثانية
5️⃣ تواصل مع الوكيل`;
  
  return response;
}

/**
 * Analyze user message and extract preferences
 * @param {string} message - User message
 * @returns {Object} Extracted preferences
 */
function analyzeMessage(message) {
  return {
    intent: parser.detectIntent(message),
    budget: parser.detectBudget(message),
    rooms: parser.detectRooms(message),
    area: parser.detectArea(message),
    propertyType: parser.detectPropertyType(message),
    furnished: parser.detectFurnished(message),
    saleVsRent: parser.detectSaleVsRent(message),
    preferences: parser.detectPreferences(message)
  };
}

/**
 * Update user preferences with new extracted info (with memory)
 * @param {Object} currentPrefs - Current preferences (never lose data)
 * @param {Object} newPrefs - New extracted preferences
 * @returns {Object} Updated preferences
 */
function updatePreferences(currentPrefs, newPrefs) {
  const updated = { ...currentPrefs };
  // Only update if new value exists, never clear existing data
  if (newPrefs.intent) updated.intent = newPrefs.intent;
  if (newPrefs.budget) updated.budget = newPrefs.budget;
  if (newPrefs.rooms) updated.rooms = newPrefs.rooms;
  if (newPrefs.area) updated.area = newPrefs.area;
  if (newPrefs.propertyType) updated.propertyType = newPrefs.propertyType;
  if (newPrefs.furnished) updated.furnished = newPrefs.furnished;
  if (newPrefs.saleVsRent) updated.saleVsRent = newPrefs.saleVsRent;
  if (newPrefs.preferences && newPrefs.preferences.length > 0) {
    updated.preferences = [...(updated.preferences || []), ...newPrefs.preferences];
    updated.preferences = [...new Set(updated.preferences)]; // Remove duplicates
  }
  return updated;
}

/**
 * Check if preferences are complete enough for recommendation
 * @param {Object} prefs - User preferences
 * @returns {boolean} True if ready
 */
function isReadyForRecommendation(prefs) {
  const usefulPrefs = [prefs.budget, prefs.rooms, prefs.area].filter(p => p != null);
  return usefulPrefs.length >= 2;
}

function determineNextQuestion(prefs) {
  if (!prefs.intent) {
    return 'asked_type';
  }
  if (!prefs.rooms) {
    return 'asked_rooms';
  }
  if (!prefs.area) {
    return 'asked_area';
  }
  if (!prefs.budget) {
    return 'asked_budget';
  }
  return 'asked_budget';
}

function recommendationReply(match) {
  const prop = match.property;
  
  return `✨ عندي لك خيار ممتاز يناسب طلبك 👌

━━━━━━━━━━━━━━

${formatPropertyCard(prop)}

✅ لماذا يناسبك:
${match.reason}

🔥 هذا العرض مطلوب حالياً

━━━━━━━━━━━━━━
اختر التالي 👇

1️⃣ تفاصيل أكثر
2️⃣ أرخص
3️⃣ أفخم
4️⃣ نفس المواصفات بمنطقة ثانية
5️⃣ تواصل مع الوكيل`;
}

function generateResponse(nextState, prefs, match = null) {
  if (match) {
    return recommendationReply(match);
  }

  switch (nextState) {
    case 'asked_type':
      return `حلو 👍 ما نوع العقار اللي تبحث عنه؟

1️⃣ شقة
2️⃣ فيلا
3️⃣ ستوديو
4️⃣ مكتب تجاري`;
    case 'asked_budget':
      return `تمام 👌 ما ميزانيتك التقريبية؟

💰 اكتب المبلغ أو اختر:
1️⃣ رخيص (أقل من 400 ألف)
2️⃣ متوسط (400-600 ألف)
3️⃣ فاخر (أكثر من 600 ألف)`;
    case 'asked_rooms':
      return `اختيار موفق 🔥 كم عدد الغرف؟

1️⃣ غرفة واحدة
2️⃣ غرفتين
3️⃣ 3 غرف
4️⃣ 4 غرف أو أكثر`;
    case 'asked_area':
      return `تمام 👌 أي منطقة بالكويت تفضل؟

1️⃣ السالمية
2️⃣ حولي
3️⃣ الفروانية
4️⃣ الخالدية
5️⃣ الدسمة
6️⃣ أي منطقة`;
    default:
      return `👋 أهلًا وسهلًا في مساعدك العقاري!

🏠 نساعدك تلقي الشقة أو الفيلا المناسبة بالكويت.

كيف أقدر أساعدك؟ اكتب مثلاً:
• "شقة 3 غرف بـ 500 ألف"
• "فيلا فخمة في السالمية"
• "أرني رخيص الأسعار"`;
  }
}

/**
 * Process user message and return bot response
 * @param {string} message - User message
 * @param {Object} conversationState - {state, prefs, lastResults}
 * @returns {Object} {reply, newState: {state, prefs, lastResults}}
 */
function processMessage(message, conversationState) {
  const { prefs, lastResults } = conversationState;
  const numericCmd = detectNumericCommand(message);

  // Handle numeric commands
  if (numericCmd && lastResults && lastResults.length > 0) {
    switch (numericCmd) {
      case 1:
        const detailedReply = `📋 التفاصيل الكاملة:\n\n${formatPropertyCard(lastResults[0].property)}\n\n🤝 للتواصل مع الوكيل:\nاكتب: "نعم تواصل"`;
        return { reply: detailedReply, newState: conversationState };
      case 2:
        const cheaper = findTopMatches({ ...prefs, budget: 'low' }, 3);
        return { reply: formatMultipleResults(cheaper), newState: { ...conversationState, lastResults: cheaper } };
      case 3:
        const luxury = findTopMatches({ ...prefs, budget: 'high' }, 3);
        return { reply: formatMultipleResults(luxury), newState: { ...conversationState, lastResults: luxury } };
      case 4:
        const otherArea = findTopMatches({ ...prefs, area: undefined }, 3);
        return { reply: formatMultipleResults(otherArea), newState: { ...conversationState, lastResults: otherArea } };
      case 5:
        return { reply: `📱 تواصل معنا على: +965-XXXX-XXXX\n\nأو أرسل لنا كل تفاصيلك لنساعدك بشكل أفضل`, newState: conversationState };
    }
  }

  // Regular message processing
  const extracted = analyzeMessage(message);
  const updatedPrefs = updatePreferences(prefs, extracted);

  const hasUsefulInfo = extracted.intent || extracted.budget || extracted.rooms || extracted.area || extracted.propertyType;
  if (!hasUsefulInfo) {
    const reply = `ما فهمت طلبك بالكامل 🤔\nتقدر توضح أكثر؟\nمثال: "شقة 3 غرف في السالمية بميزانية 500 ألف"`;
    return { reply, newState: conversationState };
  }

  // If we have enough info, recommend
  const countUsefulFields = [updatedPrefs.budget, updatedPrefs.rooms, updatedPrefs.area].filter(p => p != null).length;
  if (countUsefulFields >= 2) {
    const matches = findTopMatches(updatedPrefs, 3);
    const reply = formatMultipleResults(matches);
    return {
      reply,
      newState: { state: 'recommended', prefs: updatedPrefs, lastResults: matches }
    };
  }

  // Ask for next missing info
  const nextState = determineNextQuestion(updatedPrefs);
  const reply = generateResponse(nextState, updatedPrefs);

  return {
    reply,
    newState: { state: nextState, prefs: updatedPrefs, lastResults: [] }
  };
}

// Test examples
if (require.main === module) {
  console.log('Testing logic.js');

  let state = { state: 'start', prefs: {}, lastResults: [] };

  const testMessages = [
    'أبغى شقة رخيصة',
    '3 غرف',
    'في السالمية'
  ];

  for (const msg of testMessages) {
    console.log(`User: ${msg}`);
    const result = processMessage(msg, state);
    console.log(`Bot: ${result.reply}`);
    state = result.newState;
    console.log('---');
  }
}

module.exports = {
  analyzeMessage,
  updatePreferences,
  isReadyForRecommendation,
  generateResponse,
  processMessage,
  findTopMatches,
  formatPropertyCard,
  formatMultipleResults,
  detectNumericCommand
};