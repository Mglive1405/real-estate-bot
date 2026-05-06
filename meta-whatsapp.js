const express = require('express');
const axios = require('axios');
const { processMessage, createSessionState } = require('./logic');

const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = 'my_verify_token';

const userSessions = {};
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

    console.log('[INCOMING MESSAGE] Entry:', JSON.stringify(entry, null, 2).substring(0, 500));
    console.log('[INCOMING MESSAGE] Type:', messages?.type || 'N/A');
    console.log('[INCOMING MESSAGE] From:', messages?.from || 'N/A');
    console.log('[INCOMING MESSAGE] Text:', messages?.text?.body?.substring(0, 100) || 'N/A');

    if (statusUpdate) {
      console.log('[INCOMING MESSAGE] Status update ignored:', statusUpdate.status);
      return res.sendStatus(200);
    }

    if (!messages || messages.type !== 'text') {
      console.log('[INCOMING MESSAGE] Skipping non-text or missing message');
      return res.sendStatus(200);
    }

    const from = messages.from;
    const text = messages.text?.body;

    if (!from || !text) {
      console.log('[INCOMING MESSAGE] Missing sender or body');
      return res.sendStatus(200);
    }

    if (!userSessions[from]) {
      userSessions[from] = createSessionState();
      console.log('[SESSION] New session created for', from);
    }

    const session = userSessions[from];
    console.log('[SESSION] Loaded session for', from, 'state:', session.state, 'lang:', session.lang);

    let result;
    try {
      result = processMessage(text, session);
      console.log('[PARSED PREFS]', JSON.stringify(result.newState.prefs));
      console.log('[MATCH RESULTS]', result.newState.lastResults?.length || 0);
      if (result.newState.selectedProperty) {
        console.log('[SELECTED PROPERTY]', result.newState.selectedProperty.id);
      }
    } catch (error) {
      console.error('[ERROR] processMessage crashed:', error.stack || error);
      result = {
        reply: '⚠️ صار خطأ بسيط، حاول مرة ثانية',
        newState: session
      };
    }

    const replyText = formatReply(result.reply);
    userSessions[from] = { ...result.newState, lastInteraction: Date.now() };

    console.log('[OUTGOING REPLY] To:', from, 'Reply:', replyText);

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error('[ERROR] Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID environment variables.');
      return res.sendStatus(500);
    }

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

    console.log('[API] Reply sent successfully to', from);
    return res.sendStatus(200);
  } catch (error) {
    console.error('[ERROR] Webhook processing failed:', error?.response?.data || error.stack || error);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Meta WhatsApp bot running on port ${PORT}`);
});
