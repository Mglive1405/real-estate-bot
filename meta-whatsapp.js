const express = require('express');
const axios = require('axios');
const { processMessage } = require('./logic');

const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = 'my_verify_token';

const userStates = {};
const app = express();
app.use(express.json());

function formatReply(text) {
  let reply = String(text || '').trim();
  reply = reply.replace(/\r\n/g, '\n');
  reply = reply.replace(/\n{2,}/g, '\n\n');
  reply = reply.replace(/\s+\n/g, '\n');
  reply = reply.replace(/\n\s+/g, '\n');
  return reply.trim();
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages?.[0];
    const statusUpdate = value?.statuses?.[0];

    console.log('[WEBHOOK] Entry:', JSON.stringify(entry, null, 2).substring(0, 500));
    console.log('[WEBHOOK] Message type:', messages?.type || 'N/A');
    console.log('[WEBHOOK] From:', messages?.from || 'N/A');
    console.log('[WEBHOOK] Text body:', messages?.text?.body?.substring(0, 100) || 'N/A');

    if (statusUpdate) {
      console.log('[WEBHOOK] Status update (ignored):', statusUpdate.status);
      return res.sendStatus(200);
    }

    if (!messages || messages.type !== 'text') {
      console.log('[WEBHOOK] Skipping non-text or missing message');
      return res.sendStatus(200);
    }

    const from = messages.from;
    const text = messages.text?.body;

    if (!from || !text) {
      console.log('[WEBHOOK] Missing from or text');
      return res.sendStatus(200);
    }

    console.log('[WEBHOOK] Processing message from:', from, 'Text:', text);

    if (!userStates[from]) {
      userStates[from] = { state: 'start', prefs: {}, lastResults: [] };
    }

    const currentState = userStates[from];
    const result = processMessage(text, currentState);
    const replyText = formatReply(result.reply);
    userStates[from] = result.newState;

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error('Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID environment variables.');
      return res.sendStatus(500);
    }

    console.log('[API] Sending reply to:', from);
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: {
          body: replyText
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[API] Reply sent successfully');
    return res.sendStatus(200);
  } catch (error) {
    console.error('[ERROR] Webhook processing failed:', error?.response?.data || error.message || error);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Meta WhatsApp bot running on port ${PORT}`);
});
