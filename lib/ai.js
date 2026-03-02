const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch');

const SESSIONS = path.join(__dirname, '..', 'data', 'ai_sessions.json');

function load() {
  if (!fs.existsSync(SESSIONS)) return {};
  try { return JSON.parse(fs.readFileSync(SESSIONS, 'utf8')); } catch (e) { return {}; }
}
function save(obj) { fs.writeFileSync(SESSIONS, JSON.stringify(obj, null, 2)); }

function getSession(userId) {
  const data = load();
  if (!data[userId]) data[userId] = { persona: null, messages: [] };
  return data[userId];
}
function setSession(userId, sess) {
  const data = load(); data[userId] = sess; save(data);
}
function clearSession(userId) {
  const data = load(); delete data[userId]; save(data);
}

async function generateReply(userId, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const sess = getSession(userId);

  // Build conversation messages, keep last N messages
  const maxLen = parseInt(process.env.AI_HISTORY_LIMIT) || 8;
  const history = (sess.messages || []).slice(-maxLen).map(m => m);
  history.push({ role: 'user', content: userMessage });

  if (!apiKey) {
    // Fallback simple echo / small transformation
    const reply = `I don't have an API key configured, but you said: "${userMessage}"`; 
    // Save assistant reply to session
    sess.messages = (sess.messages || []).concat([{ role: 'user', content: userMessage }, { role: 'assistant', content: reply }]).slice(-100);
    setSession(userId, sess);
    return reply;
  }

  // Build payload for OpenAI Chat Completions
  const messages = [];
  if (sess.persona) messages.push({ role: 'system', content: sess.persona });
  for (const m of history) {
    messages.push({ role: m.role, content: m.content });
  }

  const body = { model, messages, max_tokens: 500, temperature: 0.7 };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`API error: ${res.status} ${t}`);
    }
    const data = await res.json();
    const r = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const reply = (r || 'Sorry, I could not generate a response.').trim();

    // Save conversation
    sess.messages = (sess.messages || []).concat([{ role: 'user', content: userMessage }, { role: 'assistant', content: reply }]).slice(-100);
    setSession(userId, sess);

    return reply;
  } catch (e) {
    console.error('AI generate error', e);
    // fallback
    const reply = `Error generating AI reply: ${e.message}`;
    sess.messages = (sess.messages || []).concat([{ role: 'user', content: userMessage }, { role: 'assistant', content: reply }]).slice(-100);
    setSession(userId, sess);
    return reply;
  }
}

module.exports = { getSession, setSession, clearSession, generateReply };

