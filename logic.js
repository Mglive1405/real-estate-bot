// logic.js - Main smart logic for the real estate bot

const parser = require('./parser');
const matcher = require('./matcher');

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
    area: parser.detectArea(message)
  };
}

/**
 * Update user preferences with new extracted info
 * @param {Object} currentPrefs - Current preferences
 * @param {Object} newPrefs - New extracted preferences
 * @returns {Object} Updated preferences
 */
function updatePreferences(currentPrefs, newPrefs) {
  const updated = { ...currentPrefs };
  if (newPrefs.intent) updated.intent = newPrefs.intent;
  if (newPrefs.budget) updated.budget = newPrefs.budget;
  if (newPrefs.rooms) updated.rooms = newPrefs.rooms;
  if (newPrefs.area) updated.area = newPrefs.area;
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
  return `ممتاز 👍 خلني أرشح لك خيار مميز يناسب طلبك:

📍 ${prop.area}
🏠 شقة - ${prop.rooms} غرف
💰 السعر: ${prop.price.toLocaleString()} د.ك
📐 المساحة: ${prop.size} م²

${prop.description}

هذا الخيار مناسب لك لأنه:
- ${match.reason}

هل حاب أرسل لك خيارات أكثر أو تفاصيل إضافية؟`;
}

function generateResponse(nextState, prefs, match = null) {
  if (match) {
    return recommendationReply(match);
  }

  switch (nextState) {
    case 'asked_type':
      return `ممتاز 👍 هل تبحث عن شقة سكن أم استثمار؟`;
    case 'asked_budget':
      return `ممتاز 👍 كم ميزانيتك التقريبية؟`;
    case 'asked_rooms':
      return `تمام 👌 كم عدد الغرف اللي تفضلها؟`;
    case 'asked_area':
      return `تمام 👌 هل تفضل منطقة معينة في الكويت؟`;
    default:
      return `ممكن توضح أكثر؟ مثلاً عدد الغرف أو المنطقة أو الميزانية اللي تفضلها؟`;
  }
}

/**
 * Process user message and return bot response
 * @param {string} message - User message
 * @param {Object} conversationState - {state, prefs}
 * @returns {Object} {reply, newState: {state, prefs}}
 */
function processMessage(message, conversationState) {
  const { prefs } = conversationState;
  const extracted = analyzeMessage(message);
  const updatedPrefs = updatePreferences(prefs, extracted);

  const hasUsefulInfo = extracted.intent || extracted.budget || extracted.rooms || extracted.area;
  if (!hasUsefulInfo) {
    const reply = `ممكن توضح أكثر؟ مثلاً عدد الغرف أو المنطقة أو الميزانية اللي تفضلها؟`;
    return { reply, newState: conversationState };
  }

  if (isReadyForRecommendation(updatedPrefs)) {
    const match = matcher.findBestMatch(updatedPrefs);
    const reply = generateResponse('recommended', updatedPrefs, match);
    return {
      reply,
      newState: { state: 'recommended', prefs: updatedPrefs }
    };
  }

  const nextState = determineNextQuestion(updatedPrefs);
  const reply = generateResponse(nextState, updatedPrefs);

  return {
    reply,
    newState: { state: nextState, prefs: updatedPrefs }
  };
}

// Test examples
if (require.main === module) {
  console.log('Testing logic.js');

  let state = { state: 'start', prefs: {} };

  const testMessages = [
    'أبغى شقة للبيع',
    'سكن',
    'ميزانيتي 500 ألف',
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
  processMessage
};