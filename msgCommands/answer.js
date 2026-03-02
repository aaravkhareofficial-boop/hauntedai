const fs = require('fs');
const path = require('path');
const SESSIONS = path.join(__dirname, '..', 'data', 'math_sessions.json');
const DAILY = path.join(__dirname, '..', 'data', 'daily_questions.json');
const econ = require('../lib/economy');

function loadJson(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return {}; }
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

module.exports = {
  name: 'answer',
  description: 'Submit an answer to your last math or daily question: !answer <your answer>',
  async execute(message, args) {
    const userAns = args.join(' ').trim();
    if (!userAns) return message.reply('Usage: !answer <your answer>');

    // check math session first
    const sessions = loadJson(SESSIONS);
    const s = sessions[message.author.id];
    if (s && Date.now() <= s.expires) {
      // simple comparison (case-insensitive, trim)
      const correct = String(s.answer).toLowerCase().trim();
      if (correct === userAns.toLowerCase().trim()) {
        delete sessions[message.author.id];
        saveJson(SESSIONS, sessions);
        // reward small amount
        econ.addBalance(message.author.id, 25);
        return message.channel.send(`${message.author.tag} Correct! You earned 25 ${econ.CURRENCY}.`);
      } else {
        return message.channel.send(`${message.author.tag} Incorrect. Try again or request a new problem with !math`);
      }
    }

    // check daily question for this guild
    const guildId = message.guild.id;
    const daily = loadJson(DAILY);
    const dq = daily[guildId];
    if (dq && dq.date === new Date().toISOString().slice(0,10)) {
      const correct = String(dq.answer).toLowerCase().trim();
      if (correct === userAns.toLowerCase().trim()) {
        // prevent multiple winners
        if (!dq.winners) dq.winners = [];
        if (dq.winners.includes(message.author.id)) return message.channel.send('You already answered correctly today.');
        dq.winners.push(message.author.id);
        // reward more
        econ.addBalance(message.author.id, 100);
        saveJson(DAILY, daily);
        return message.channel.send(`${message.author.tag} Correct! You earned 100 ${econ.CURRENCY}.`);
      } else {
        return message.channel.send('Incorrect answer for today\'s question.');
      }
    }

    return message.reply('No active question found (make sure you requested one with !math or !dailyq).');
  }
};
