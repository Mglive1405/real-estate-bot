// demo.js - Local testing demo for the real estate bot

const { execSync } = require('child_process');
const logic = require('./logic');

if (process.platform === 'win32') {
  try {
    execSync('chcp 65001 >nul');
  } catch (_err) {
    // ignore
  }
}

try {
  process.stdout.setEncoding('utf8');
  process.stdin.setEncoding('utf8');
} catch (_err) {
  // ignore
}

console.log('=== Real Estate Bot Demo ===\n');

function runConversation(title, messages) {
  console.log(title);
  let session = logic.createSessionState('ar');

  for (const msg of messages) {
    console.log(`User: \u200F${msg}`);
    const result = logic.processMessage(msg, session);
    console.log(`Bot: \u200F${result.reply.replace(/\n/g, '\n    ')}`);
    session = result.newState;
    console.log('---');
  }
  console.log('\n');
}

runConversation('Conversation 1: Smart memory + multi-property results', [
  'أبغى شقة رخيصة',
  '3 غرف في السالمية',
  'الأول',
  'واتساب'
]);

runConversation('Conversation 2: Enough info early', [
  'أبغى شقة 3 غرف في السالمية بحدود 500 ألف'
]);

runConversation('Conversation 3: Follow-up flow and contact', [
  'I want a villa for investment',
  'cheaper',
  'details',
  'whatsapp'
]);

runConversation('Conversation 4: Fallback handling', [
  'مرحبا',
  'أبغى شقة'
]);

console.log('Demo completed.');
