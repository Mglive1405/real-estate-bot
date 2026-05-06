// demo.js - Local testing demo for the real estate bot

const { execSync } = require('child_process');
const logic = require('./logic');

// On Windows terminals, switch to UTF-8 for proper Arabic display
if (process.platform === 'win32') {
  try {
    execSync('chcp 65001 >nul');
  } catch (_err) {
    // If changing the code page fails, continue anyway
  }
};
try {
  process.stdout.setEncoding('utf8');
  process.stdin.setEncoding('utf8');
} catch (_err) {
  // Some environments do not allow changing encoding
}

console.log('=== Real Estate Bot Demo ===\n');

// Simulate a conversation with partial input
console.log('Conversation 1: Smart memory + multi-property results\n');
let state1 = { state: 'start', prefs: {}, lastResults: [] };
const conv1 = [
  'أبغى شقة رخيصة',
  '3 غرف في السالمية'
];

for (const msg of conv1) {
  console.log(`User: \u200F${msg}`);
  const result = logic.processMessage(msg, state1);
  console.log(`Bot: \u200F${result.reply.replace(/\n/g, '\n    ')}`);
  state1 = result.newState;
  console.log('---');
}

console.log('\nConversation 2: Enough info early\n');
let state2 = { state: 'start', prefs: {}, lastResults: [] };
const conv2 = [
  'أبغى شقة 3 غرف في السالمية بحدود 500 ألف'
];

for (const msg of conv2) {
  console.log(`User: \u200F${msg}`);
  const result = logic.processMessage(msg, state2);
  console.log(`Bot: \u200F${result.reply.replace(/\n/g, '\n    ')}`);
  state2 = result.newState;
  console.log('---');
}

console.log('\nConversation 3: Fallback handling\n');
let state3 = { state: 'start', prefs: {}, lastResults: [] };
const conv3 = [
  'مرحبا',
  'أبغى شقة'
];

for (const msg of conv3) {
  console.log(`User: \u200F${msg}`);
  const result = logic.processMessage(msg, state3);
  console.log(`Bot: \u200F${result.reply.replace(/\n/g, '\n    ')}`);
  state3 = result.newState;
  console.log('---');
}

console.log('Demo completed.');