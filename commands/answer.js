const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const SESSIONS = path.join(__dirname, '..', 'data', 'math_sessions.json');
const DAILY = path.join(__dirname, '..', 'data', 'daily_questions.json');
const econ = require('../lib/economy');

function loadJson(p) { if (!fs.existsSync(p)) return {}; try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return {}; } }
function saveJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('answer').setDescription('Submit an answer to your last math or daily question').addStringOption(opt => opt.setName('answer').setDescription('Your answer').setRequired(true)),
  async execute(interaction) {
    try {
      const userAns = (interaction.options.getString('answer') || '').trim();
      if (!userAns) return interaction.reply({ content: 'Usage: /answer <your answer>', flags: 64 });

      // check math session first
      const sessions = loadJson(SESSIONS);
      const s = sessions[interaction.user.id];
      if (s && Date.now() <= s.expires) {
        const correct = String(s.answer).toLowerCase().trim();
        if (correct === userAns.toLowerCase().trim()) {
          delete sessions[interaction.user.id];
          saveJson(SESSIONS, sessions);
          econ.addBalance(interaction.user.id, 25);
          return interaction.reply({ content: `${interaction.user.tag} Correct! You earned 25 ${econ.CURRENCY}.`, ephemeral: false });
        } else {
          return interaction.reply({ content: `${interaction.user.tag} Incorrect. Try again or request a new problem with /math`, ephemeral: false });
        }
      }

      // check daily question for this guild
      const guildId = interaction.guild.id;
      const daily = loadJson(DAILY);
      const dq = daily[guildId];
      if (dq && dq.date === new Date().toISOString().slice(0,10)) {
        const correct = String(dq.answer).toLowerCase().trim();
        if (correct === userAns.toLowerCase().trim()) {
          if (!dq.winners) dq.winners = [];
          if (dq.winners.includes(interaction.user.id)) return interaction.reply({ content: 'You already answered correctly today.', flags: 64 });
          dq.winners.push(interaction.user.id);
          econ.addBalance(interaction.user.id, 100);
          saveJson(DAILY, daily);
          return interaction.reply({ content: `${interaction.user.tag} Correct! You earned 100 ${econ.CURRENCY}.`, ephemeral: false });
        } else {
          return interaction.reply({ content: 'Incorrect answer for today\'s question.', ephemeral: false });
        }
      }

      return interaction.reply({ content: 'No active question found (use /math or /dailyq to request one).', flags: 64 });
    } catch (e) {
      console.error('answer command error', e);
      try { await interaction.reply({ content: 'Could not process your answer right now.', flags: 64 }); } catch(_){}
    }
  }
};

