const fs = require('fs');
const path = require('path');
const DAILY = path.join(__dirname, '..', 'data', 'daily_questions.json');
const { addBalance } = require('../lib/economy');

function loadJson(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return {}; }
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function genDailyQuestion() {
  // Simple pool of 10th-grade questions (algebra/geometry/number ops). Keep answers simple strings.
  const pool = [
    { q: 'Solve for x: 3x - 7 = 11', a: '6' },
    { q: 'What is the area of a rectangle with length 12 and width 8?', a: '96' },
    { q: 'Simplify: 2(x + 3) - x', a: 'x + 6' },
    { q: 'Solve for x: x^2 - 5x + 6 = 0 (give roots separated by comma)', a: '2,3' },
    { q: 'What is the value of 15% of 200?', a: '30' },
    { q: 'If a line has slope 2 and passes through (1,3), what is y when x = 4?', a: '9' },
    { q: 'Find the hypotenuse of a right triangle with sides 3 and 4.', a: '5' },
    { q: 'Simplify: (x^2 * x^3)', a: 'x^5' },
    { q: 'What is the greatest common divisor (GCD) of 24 and 36?', a: '12' },
    { q: 'Solve for x: 2(x - 1) = 3x + 4', a: '-6' }
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  name: 'dailyq',
  description: 'Get today\'s 10th-grade math question for this server. Answer with !answer <your answer>',
  async execute(message) {
    const guildId = message.guild.id;
    const daily = loadJson(DAILY);
    const today = new Date().toISOString().slice(0,10);
    if (daily[guildId] && daily[guildId].date === today) {
      const q = daily[guildId];
      return message.channel.send(`Today's question: ${q.q}`);
    }

    const { q, a } = genDailyQuestion();
    daily[guildId] = { date: today, q, answer: a, winners: [] };
    saveJson(DAILY, daily);
    return message.channel.send(`New daily question: ${q}\nAnswer with **!answer <your answer>**. First correct answer gets 100 crystals (others also rewarded). Good luck!`);
  }
};
