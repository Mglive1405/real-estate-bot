const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const logic = require('./logic');

const userStates = {};

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'real-estate-bot' }),
  puppeteer: { headless: true }
});

function formatReply(reply) {
  let text = String(reply || '').trim();
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{2,}/g, '\n\n');
  text = text.replace(/\s+\n/g, '\n');
  text = text.replace(/\n\s+/g, '\n');

  // Ensure property lines are clean and separated
  text = text.replace(/📍/g, '\n📍');
  text = text.replace(/🏠/g, '\n🏠');
  text = text.replace(/💰/g, '\n💰');
  text = text.replace(/📐/g, '\n📐');

  // Keep formatting tight and premium
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\n- /g, '\n- ');

  return text.trim();
}

client.on('qr', qr => {
  console.log('امسح رمز QR التالي في واتساب لتسجيل الدخول:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp جاهز. المساعد العقاري يعمل الآن.');
});

client.on('authenticated', () => {
  console.log('تم التسجيل بنجاح باستخدام LocalAuth.');
});

client.on('auth_failure', msg => {
  console.error('فشل في تسجيل الدخول:', msg);
});

client.on('disconnected', reason => {
  console.log('انقطع الاتصال:', reason);
});

client.on('message', async msg => {
  try {
    if (msg.from.endsWith('@g.us')) {
      return; // ignore group chats
    }

    const userId = msg.from;
    const text = msg.body || '';

    if (!userStates[userId]) {
      userStates[userId] = { state: 'start', prefs: {} };
    }

    const currentState = userStates[userId];
    const result = logic.processMessage(text, currentState);
    const response = formatReply(result.reply);

    userStates[userId] = result.newState;
    await msg.reply(response);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

client.initialize();
