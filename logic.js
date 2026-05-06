// logic.js - Main smart logic for the real estate bot

const parser = require('./parser');
const matcher = require('./matcher');

const MENU_CHOICES = {
  asked_use_case: {
    1: { intentDetail: 'comfort' },
    2: { intentDetail: 'investment' },
    3: { intentDetail: 'rent' }
  },
  asked_type: {
    1: { propertyType: 'apartment' },
    2: { propertyType: 'villa' },
    3: { propertyType: 'studio' },
    4: { propertyType: 'office' }
  },
  asked_budget: {
    1: { budget: 'low' },
    2: { budget: 'medium' },
    3: { budget: 'high' }
  },
  asked_rooms: {
    1: { rooms: 1 },
    2: { rooms: 2 },
    3: { rooms: 3 },
    4: { rooms: 4 }
  },
  asked_area: {
    1: { area: 'السالمية' },
    2: { area: 'حولي' },
    3: { area: 'الفروانية' },
    4: { area: 'الخالدية' },
    5: { area: 'الدسمة' },
    6: { area: undefined }
  }
};

const PHRASES = {
  fallback: {
    ar: '⚠️ صار خطأ بسيط، حاول مرة ثانية',
    en: '⚠️ Small error happened, please try again.'
  },
  asked_use_case: {
    ar: 'تمام 👌 هل تبحث عن:\n1️⃣ سكن\n2️⃣ استثمار\n3️⃣ تأجير',
    en: 'Nice 👍 Are you looking for:\n1️⃣ comfort\n2️⃣ investment\n3️⃣ rent'
  },
  noMatch: {
    ar: '🤔 ما حصلت نتائج دقيقة، لكن عندي خيارات قريبة ممكن تعجبك. جرب تعديل الميزانية أو المنطقة.',
    en: '🤔 I could not find an exact match, but I have close options. Try changing budget or area.'
  },
  asked_type: {
    ar: 'حلو 👍 ما نوع العقار اللي تبحث عنه؟\n1️⃣ شقة\n2️⃣ فيلا\n3️⃣ ستوديو\n4️⃣ مكتب تجاري',
    en: 'Nice 👍 What type of property are you looking for?\n1️⃣ apartment\n2️⃣ villa\n3️⃣ studio\n4️⃣ office'
  },
  asked_budget: {
    ar: 'تمام 👌 ما ميزانيتك التقريبية؟\n1️⃣ رخيص (أقل من 400 ألف)\n2️⃣ متوسط (400-600 ألف)\n3️⃣ فاخر (أكثر من 600 ألف)',
    en: 'Great 👌 What is your approximate budget?\n1️⃣ low (under 400k)\n2️⃣ medium (400-600k)\n3️⃣ high (above 600k)'
  },
  asked_rooms: {
    ar: 'اختيار موفق 🔥 كم عدد الغرف؟\n1️⃣ غرفة واحدة\n2️⃣ غرفتين\n3️⃣ 3 غرف\n4️⃣ 4 غرف أو أكثر',
    en: 'Good choice 🔥 How many rooms?\n1️⃣ 1 room\n2️⃣ 2 rooms\n3️⃣ 3 rooms\n4️⃣ 4+ rooms'
  },
  asked_area: {
    ar: 'تمام 👌 أي منطقة بالكويت تفضل؟\n1️⃣ السالمية\n2️⃣ حولي\n3️⃣ الفروانية\n4️⃣ الخالدية\n5️⃣ الدسمة\n6️⃣ أي منطقة',
    en: 'Great 👌 Which area do you prefer?\n1️⃣ Salmiya\n2️⃣ Hawally\n3️⃣ Farwaniya\n4️⃣ Khaldiya\n5️⃣ Dasma\n6️⃣ Any area'
  },
  asking_contact_method: {
    ar: 'تمام 👌 تفضل تواصل عبر واتساب أو اتصال؟',
    en: 'Great 👌 Would you like WhatsApp or a phone call?'
  },
  contact_confirmed: {
    ar: 'تمام 👌 بخلي الوسيط يتواصل معك مباشرة\n📞 +965 9976 9966',
    en: 'Great 👌 The agent will contact you directly.\n📞 +965 9976 9966'
  },
  followUpPrompt: {
    ar: 'خبرني أي خيار لفت انتباهك أكثر؟ 👀',
    en: 'Which one caught your attention? 👀'
  },
  nextFilter: {
    ar: 'تحب أفلتر لك أكثر؟ مثلاً حسب السعر أو المساحة 👌',
    en: 'Would you like me to filter more by price or size? 👌'
  }
};

function createSessionState(lang = 'ar') {
  return {
    prefs: {},
    lastResults: [],
    selectedProperty: null,
    state: 'start',
    lang,
    history: [],
    lastInteraction: Date.now()
  };
}

function getLang(message, currentLang) {
  const detected = parser.detectLanguage(message);
  // If no language detected (e.g., numbers-only), keep current language
  if (detected === null) return currentLang || 'ar';
  return detected || currentLang || 'ar';
}

function getRandomLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function getOpening(lang) {
  const options = {
    ar: [
      'تمام 👌 لقيت لك خيارات قوية',
      'حلو 👍 هذه أفضل الخيارات',
      'صراحة عندي لك خيارات ممتازة'
    ],
    en: [
      'Nice 👌 I found strong matches',
      'These are great options for your request',
      'I think you’ll like these properties'
    ]
  };
  return getRandomLine(options[lang] || options.ar);
}

function translateAmenity(item, lang) {
  if (lang === 'ar') {
    const translations = {
      elevator: 'مصعد',
      parking: 'موقف',
      security: 'أمن',
      pool: 'مسبح',
      garden: 'حديقة',
      gym: 'نادي رياضي',
      mall: 'مول',
      supermarket: 'سوبرماركت',
      schools: 'مدارس',
      mosque: 'مسجد',
      services: 'خدمات',
      hospital: 'مستشفى',
      'near services': 'بقرب الخدمات',
      'maid room': 'غرفة خادمة',
      'sea view': 'إطلالة بحرية',
      compound: 'مجمع سكني'
    };
    return translations[item] || item;
  }
  return item;
}

function formatList(items, lang) {
  if (!items || items.length === 0) return lang === 'ar' ? 'لا يوجد' : 'None';
  const translated = items.map(item => translateAmenity(item, lang));
  return translated.join(' • ');
}

function formatBooleanLabel(value, lang) {
  if (lang === 'ar') return value ? 'نعم' : 'لا';
  return value ? 'Yes' : 'No';
}

function formatPropertyType(type, lang) {
  const mapping = {
    apartment: { ar: 'شقة', en: 'Apartment' },
    villa: { ar: 'فيلا', en: 'Villa' },
    studio: { ar: 'ستوديو', en: 'Studio' },
    office: { ar: 'مكتب', en: 'Office' },
    land: { ar: 'أرض', en: 'Land' }
  };
  return (mapping[type] || mapping.apartment)[lang] || type;
}

function formatKitchenLabel(kind, lang) {
  if (!kind) return lang === 'ar' ? 'متوفر' : 'Available';
  if (lang === 'ar') return kind === 'closed' ? 'مغلق' : 'مفتوح';
  return kind === 'closed' ? 'Closed' : 'Open';
}

function formatPrice(price, lang) {
  if (lang === 'ar') return `${price.toLocaleString('ar-KW')} د.ك`;
  return `${price.toLocaleString('en-US')} KWD`;
}

function formatPropertySummary(match, index, lang) {
  const prop = match.property;
  if (lang === 'ar') {
    return `\n━━━━━━━━━━━━━━━\n🔹 ${index}. ${formatPropertyType(prop.type, lang)} | ${prop.rooms} غرف | ${formatPrice(prop.price, lang)}\n📍 ${prop.area}\n✨ ${match.reason}`;
  }
  return `\n━━━━━━━━━━━━━━━\n🔹 ${index}. ${formatPropertyType(prop.type, lang)} | ${prop.rooms} rooms | ${formatPrice(prop.price, lang)}\n📍 ${prop.area}\n✨ ${match.reason}`;
}

function formatPropertyDetails(prop, lang) {
  if (lang === 'ar') {
    return `📋 تفاصيل العقار\n\n🏠 النوع: ${formatPropertyType(prop.type, lang)}\n📍 المنطقة: ${prop.area}\n💰 السعر: ${formatPrice(prop.price, lang)}\n\n📐 المساحة: ${prop.size} م² | 🛏️ ${prop.rooms} غرف | 🛁 ${prop.bathrooms} حمامات\n\n🍽️ المطبخ: ${formatKitchenLabel(prop.kitchen, lang)} | 🛋️ غرف المعيشة: ${prop.livingRooms}\n🏢 الطابق: ${prop.floor} | 🛋️ مفروش: ${formatBooleanLabel(prop.furnished, lang)} | 🚗 موقف: ${formatBooleanLabel(prop.parking, lang)}\n\n✨ المرافق: ${formatList(prop.amenities, lang)}\n📍 بالقرب من: ${formatList(prop.nearby, lang)}\n\n📝 الوصف: ${prop.description_ar || prop.description_en || prop.shortTag || ''}`;
  }
  return `📋 Property details\n\n🏠 Type: ${formatPropertyType(prop.type, lang)}\n📍 Area: ${prop.area}\n💰 Price: ${formatPrice(prop.price, lang)}\n\n📐 Size: ${prop.size} m² | 🛏️ ${prop.rooms} rooms | 🛁 ${prop.bathrooms} baths\n\n🍽️ Kitchen: ${formatKitchenLabel(prop.kitchen, lang)} | 🛋️ Living rooms: ${prop.livingRooms}\n🏢 Floor: ${prop.floor} | 🛋️ Furnished: ${formatBooleanLabel(prop.furnished, lang)} | 🚗 Parking: ${formatBooleanLabel(prop.parking, lang)}\n\n✨ Amenities: ${formatList(prop.amenities, lang)}\n📍 Nearby: ${formatList(prop.nearby, lang)}\n\n📝 Description: ${prop.description_ar || prop.description_en || prop.shortTag || ''}`;
}

function formatMatchesResponse(matches, lang) {
  if (!matches || matches.length === 0) {
    return PHRASES.noMatch[lang];
  }

  const header = `${getOpening(lang)}`;
  const cards = matches.map((match, idx) => formatPropertySummary(match, idx + 1, lang)).join('');
  const menu = lang === 'ar'
    ? '\n━━━━━━━━━━━━━━━\n' +
      `${PHRASES.followUpPrompt[lang]}\n` +
      '1️⃣ تفاصيل الأول\n' +
      '2️⃣ خيارات أرخص\n' +
      '3️⃣ خيارات فاخرة\n' +
      '4️⃣ نفس المواصفات في منطقة ثانية\n' +
      '5️⃣ تواصل مع الوكيل'
    : '\n━━━━━━━━━━━━━━━\n' +
      `${PHRASES.followUpPrompt[lang]}\n` +
      '1️⃣ Details for the first\n' +
      '2️⃣ Cheaper options\n' +
      '3️⃣ Luxury options\n' +
      '4️⃣ Same specs in another area\n' +
      '5️⃣ Contact the agent';

  return `${header}${cards}${menu}`;
}

function formatSelectionReply(match, lang) {
  const prop = match.property;
  if (lang === 'ar') {
    return `خيار ممتاز، هذه التفاصيل:\n\n${formatPropertyDetails(prop, lang)}\n\n✅ سبب الترشيح: ${match.reason}\n\nإذا حاب تواصل مع الوكيل اكتب: واتساب أو اتصال`;
  }
  return `Great choice, here are the details:\n\n${formatPropertyDetails(prop, lang)}\n\n✅ Recommendation reason: ${match.reason}\n\nIf you want the agent to contact you, reply with WhatsApp or call.`;
}

function updatePreferences(currentPrefs, newPrefs) {
  const updated = { ...currentPrefs };
  if (newPrefs.intent) updated.intent = newPrefs.intent;
  if (newPrefs.intentDetail) updated.intentDetail = newPrefs.intentDetail;
  if (newPrefs.budget) updated.budget = newPrefs.budget;
  if (newPrefs.rooms) updated.rooms = newPrefs.rooms;
  if (newPrefs.bathrooms) updated.bathrooms = newPrefs.bathrooms;
  if (newPrefs.area !== undefined) updated.area = newPrefs.area;
  if (newPrefs.propertyType) updated.propertyType = newPrefs.propertyType;
  if (newPrefs.furnished) updated.furnished = newPrefs.furnished;
  if (newPrefs.saleVsRent) updated.saleVsRent = newPrefs.saleVsRent;
  if (newPrefs.preferences && newPrefs.preferences.length > 0) {
    updated.preferences = [...new Set([...(updated.preferences || []), ...newPrefs.preferences])];
  }
  if (newPrefs.contactMethod) updated.contactMethod = newPrefs.contactMethod;
  return updated;
}

function isReadyForRecommendation(prefs) {
  const useful = [prefs.budget, prefs.rooms, prefs.area, prefs.intentDetail].filter(v => v != null);
  return useful.length >= 2;
}

function determineNextQuestion(prefs) {
  if (!prefs.intentDetail) return 'asked_use_case';
  if (!prefs.propertyType) return 'asked_type';
  if (!prefs.rooms) return 'asked_rooms';
  if (!prefs.area) return 'asked_area';
  if (!prefs.budget) return 'asked_budget';
  return 'asked_budget';
}

function applyMenuChoice(message, session) {
  const choice = parser.detectNumericCommand(message);
  if (!choice) return null;
  
  // After recommendations shown, numeric input is for follow-up actions, not menu choices
  if (session.state === 'recommended') return null;
  
  if (!session.state || !MENU_CHOICES[session.state]) return null;
  const mapped = MENU_CHOICES[session.state][choice];
  if (!mapped) return null;
  return { newPrefs: mapped, nextState: determineNextQuestion({ ...session.prefs, ...mapped }) };
}

function buildContactResponse(contactMethod, lang) {
  if (contactMethod) {
    if (lang === 'ar') {
      return 'تمام 👌 بخلي الوسيط يتواصل معك مباشرة\n📞 +965 9976 9966';
    }
    return 'Great 👌 The agent will contact you directly.\n📞 +965 9976 9966';
  }
  if (lang === 'ar') {
    return 'تمام 👌 تفضل تواصل عبر واتساب أو اتصال؟';
  }
  return 'Great 👌 Would you like WhatsApp or a phone call?';
}

function processMessage(message, session) {
  try {
    const text = String(message || '').trim();
    const lang = getLang(text, session.lang);
    session.lang = lang;
    session.lastInteraction = Date.now();

    if (parser.isGreeting(text)) {
      if (lang === 'ar') {
        const reply = 'وعليكم السلام 👋\n\nهلا بك! ممكن أساعدك تلقى عقار مناسب.\nبس قلّي نوع العقار، الميزانية، والمنطقة اللي تبيها.';
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      }
      const reply = 'Hello! 👋\n\nI can help you find the right property.\nTell me the type, budget, and preferred area.';
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    const followUpAction = parser.detectFollowUpAction(text);
    const selectionIndex = parser.detectSelectionIndex(text);
    const contactMethod = parser.detectContactMethod(text);
    const numericCommand = parser.detectNumericCommand(text);
    const extracted = {
      intent: parser.detectIntent(text),
      intentDetail: parser.detectIntentDetail(text),
      budget: parser.detectBudget(text),
      rooms: parser.detectRooms(text),
      bathrooms: parser.detectBathrooms(text),
      area: parser.detectArea(text),
      propertyType: parser.detectPropertyType(text),
      furnished: parser.detectFurnished(text),
      saleVsRent: parser.detectSaleVsRent(text),
      preferences: parser.detectPreferences(text),
      contactMethod,
      selectionIndex,
      followUpAction,
      numericCommand
    };

    // Handle numeric commands in 'recommended' state as follow-up actions
    if (session.state === 'recommended' && numericCommand) {
      if (numericCommand === 1) {
        if (session.lastResults && session.lastResults.length > 0) {
          const match = session.lastResults[0];
          session.selectedProperty = match.property;
          const reply = formatSelectionReply(match, lang);
          session.history.push({ incoming: text, outgoing: reply });
          return { reply, newState: { ...session, state: 'selected' } };
        }
      } else if (numericCommand === 2) {
        session.lastResults = matcher.findTopMatches({ ...session.prefs, budget: 'low' }, 3, lang);
        session.state = 'recommended';
        session.selectedProperty = null;
        const reply = formatMatchesResponse(session.lastResults, lang);
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      } else if (numericCommand === 3) {
        session.lastResults = matcher.findTopMatches({ ...session.prefs, budget: 'high' }, 3, lang);
        session.state = 'recommended';
        session.selectedProperty = null;
        const reply = formatMatchesResponse(session.lastResults, lang);
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      } else if (numericCommand === 4) {
        const currentAreas = session.lastResults ? session.lastResults.map(r => r.property.area) : [];
        session.lastResults = matcher.findTopMatchesByArea({ ...session.prefs, area: undefined, excludeAreas: currentAreas }, 3, lang);
        session.state = 'recommended';
        session.selectedProperty = null;
        const reply = formatMatchesResponse(session.lastResults, lang);
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      } else if (numericCommand === 5) {
        if (contactMethod) {
          session.prefs.contactMethod = contactMethod;
          session.state = 'contact_confirmed';
          const reply = buildContactResponse(contactMethod, lang);
          session.history.push({ incoming: text, outgoing: reply });
          return { reply, newState: session };
        }
        session.state = 'asking_contact_method';
        const reply = buildContactResponse(null, lang);
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      }
    }

    const menuChoice = applyMenuChoice(text, session);
    if (menuChoice) {
      session.prefs = updatePreferences(session.prefs, menuChoice.newPrefs);
      session.state = menuChoice.nextState;
      const ready = isReadyForRecommendation(session.prefs);
      if (ready) {
        session.lastResults = matcher.findTopMatches(session.prefs, 3, lang);
        session.state = 'recommended';
        const reply = formatMatchesResponse(session.lastResults, lang);
        session.history.push({ incoming: text, outgoing: reply });
        session.selectedProperty = null;
        return { reply, newState: session };
      }
      const reply = PHRASES[session.state][lang];
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (session.state === 'asking_contact_method' && contactMethod) {
      session.prefs.contactMethod = contactMethod;
      session.state = 'contact_confirmed';
      const reply = buildContactResponse(contactMethod, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (selectionIndex && session.lastResults && session.lastResults.length > 0) {
      const index = Math.min(Math.max(selectionIndex, 1), session.lastResults.length);
      const match = session.lastResults[index - 1];
      session.selectedProperty = match.property;
      const reply = formatSelectionReply(match, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: { ...session, state: 'selected' } };
    }

    if (followUpAction === 'details' && session.lastResults && session.lastResults.length > 0) {
      const match = session.selectedProperty
        ? session.lastResults.find(item => item.property.id === session.selectedProperty.id) || session.lastResults[0]
        : session.lastResults[0];
      session.selectedProperty = match.property;
      const reply = formatSelectionReply(match, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: { ...session, state: 'selected' } };
    }

    if (followUpAction === 'cheaper' && session.lastResults && session.lastResults.length > 0) {
      session.lastResults = matcher.findTopMatches({ ...session.prefs, budget: 'low' }, 3, lang);
      session.state = 'recommended';
      session.selectedProperty = null;
      const reply = formatMatchesResponse(session.lastResults, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (followUpAction === 'luxury' && session.lastResults && session.lastResults.length > 0) {
      session.lastResults = matcher.findTopMatches({ ...session.prefs, budget: 'high' }, 3, lang);
      session.state = 'recommended';
      session.selectedProperty = null;
      const reply = formatMatchesResponse(session.lastResults, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (followUpAction === 'another_area' && session.lastResults && session.lastResults.length > 0) {
      const currentAreas = session.lastResults.map(r => r.property.area);
      session.lastResults = matcher.findTopMatchesByArea({ ...session.prefs, area: undefined, excludeAreas: currentAreas }, 3, lang);
      session.state = 'recommended';
      session.selectedProperty = null;
      const reply = formatMatchesResponse(session.lastResults, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (followUpAction === 'contact') {
      if (contactMethod) {
        session.prefs.contactMethod = contactMethod;
        session.state = 'contact_confirmed';
        const reply = buildContactResponse(contactMethod, lang);
        session.history.push({ incoming: text, outgoing: reply });
        return { reply, newState: session };
      }
      session.state = 'asking_contact_method';
      const reply = buildContactResponse(null, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    if (contactMethod && session.lastResults && session.lastResults.length > 0) {
      session.prefs.contactMethod = contactMethod;
      session.state = 'contact_confirmed';
      const reply = buildContactResponse(contactMethod, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    session.prefs = updatePreferences(session.prefs, extracted);

    const usefulFields = [session.prefs.budget, session.prefs.rooms, session.prefs.area, session.prefs.intentDetail].filter(v => v != null).length;
    if (usefulFields >= 2) {
      session.lastResults = matcher.findTopMatches(session.prefs, 3, lang);
      session.state = 'recommended';
      session.selectedProperty = null;
      const reply = formatMatchesResponse(session.lastResults, lang);
      session.history.push({ incoming: text, outgoing: reply });
      return { reply, newState: session };
    }

    session.state = determineNextQuestion(session.prefs);
    const reply = PHRASES[session.state][lang] || PHRASES.askType[lang];
    session.history.push({ incoming: text, outgoing: reply });
    return { reply, newState: session };
  } catch (error) {
    console.error('[ERROR] processMessage:', error.stack || error);
    const lang = session.lang || 'ar';
    const reply = PHRASES.fallback[lang];
    return { reply, newState: session };
  }
}

if (require.main === module) {
  console.log('Testing logic.js');
  const demoSession = createSessionState('ar');
  const messages = [
    'أبغى شقة رخيصة',
    '3 غرف في السالمية',
    'الأول',
    'واتساب'
  ];
  let current = demoSession;
  for (const msg of messages) {
    console.log('User:', msg);
    const result = processMessage(msg, current);
    console.log('Bot:', result.reply);
    current = result.newState;
    console.log('---');
  }
}

module.exports = {
  createSessionState,
  processMessage,
  analyzeMessage: (message) => ({
    intent: parser.detectIntent(message),
    intentDetail: parser.detectIntentDetail(message),
    budget: parser.detectBudget(message),
    rooms: parser.detectRooms(message),
    bathrooms: parser.detectBathrooms(message),
    area: parser.detectArea(message),
    propertyType: parser.detectPropertyType(message),
    furnished: parser.detectFurnished(message),
    saleVsRent: parser.detectSaleVsRent(message),
    preferences: parser.detectPreferences(message),
    contactMethod: parser.detectContactMethod(message),
    selectionIndex: parser.detectSelectionIndex(message),
    followUpAction: parser.detectFollowUpAction(message),
    numericCommand: parser.detectNumericCommand(message)
  }),
  updatePreferences,
  isReadyForRecommendation
};
