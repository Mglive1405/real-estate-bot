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
    console.log("FULL BODY:", JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages?.[0];
    const from = messages?.from;
    const text = messages?.text?.body;

    if (!from || !text) {
      return res.sendStatus(200);
    }

    if (!userStates[from]) {
      userStates[from] = { state: 'start', prefs: {} };
    }

    const currentState = userStates[from];
    const result = processMessage(text, currentState);
    const replyText = formatReply(result.reply);
    userStates[from] = result.newState;

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error('Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID environment variables.');
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

    return res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error?.response?.data || error.message || error);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Meta WhatsApp bot running on port ${PORT}`);
});
