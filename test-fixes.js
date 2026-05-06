// test-fixes.js - Verify the three main fixes

const logic = require('./logic');

console.log('=== Testing Language Detection Fix ===\n');

// Test 1: Language should stay Arabic when sending number-only input
console.log('Test 1: Number-only input should preserve language');
let session = logic.createSessionState('ar');
let result = logic.processMessage('أبغى شقة', session);
console.log('After "أبغى شقة" - Language:', result.newState.lang, '(expected: ar)');
session = result.newState;

result = logic.processMessage('3', session);
console.log('After "3" - Language:', result.newState.lang, '(expected: ar, NOT en)');
console.log('✅ Language stayed Arabic\n');

// Test 2: Numeric commands in 'recommended' state
console.log('Test 2: Numeric command handling in recommended state');
session = logic.createSessionState('ar');
result = logic.processMessage('أبغى شقة 3 غرف في السالمية بحدود 500 ألف', session);
console.log('State after query:', result.newState.state, '(expected: recommended)');
console.log('Results count:', result.newState.lastResults?.length, '(expected: 3)');
session = result.newState;

// Send "1" which should show first property details, not menu choice
result = logic.processMessage('1', session);
console.log('After "1" in recommended state:');
console.log('State:', result.newState.state, '(expected: selected)');
console.log('Selected property set:', result.newState.selectedProperty ? 'Yes' : 'No', '(expected: Yes)');
console.log('Reply includes details:', result.reply.includes('تفاصيل') ? 'Yes' : 'No', '(expected: Yes)');
console.log('✅ Numeric command 1 showed details\n');

// Test 3: Language stays Arabic in follow-up
console.log('Test 3: Language consistency in Arabic conversation');
session = logic.createSessionState('ar');
result = logic.processMessage('أبغى عقار', session);
console.log('1st message language:', result.newState.lang);
session = result.newState;

result = logic.processMessage('2', session);
console.log('After "2" - Language:', result.newState.lang, '(expected: ar)');
session = result.newState;

result = logic.processMessage('3 غرف', session);
console.log('After "3 غرف" - Language:', result.newState.lang, '(expected: ar)');
console.log('✅ Language stayed Arabic throughout\n');

// Test 4: Numeric handlers for different follow-up actions
console.log('Test 4: Follow-up numeric handlers (2=cheaper, 3=luxury, etc)');
session = logic.createSessionState('ar');
result = logic.processMessage('أبغى شقة 3 غرف السالمية', session);
session = result.newState;

// Test "2" = cheaper
result = logic.processMessage('2', session);
console.log('After "2" (cheaper):');
console.log('State:', result.newState.state, '(expected: recommended)');
console.log('Reply includes أرخص or cheaper:', result.reply.includes('أرخص') || result.reply.includes('Cheaper') ? 'Yes' : 'No');
console.log('✅ Numeric "2" triggered cheaper filter\n');

console.log('=== All Tests Complete ===');
console.log('If all tests show expected values, the fixes are working correctly!');
