const { SlashCommandBuilder } = require('@discordjs/builders');
const ai = require('../lib/ai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Chat with the AI bot')
    .addStringOption(opt => opt.setName('message').setDescription('Your message').setRequired(true)),
  async execute(interaction) {
    try {
      const q = interaction.options.getString('message').trim();
      if (!q) return interaction.reply({ content: 'Usage: /ai <message>', flags: 64 });
      await interaction.deferReply();
      const reply = await ai.generateReply(interaction.user.id, q);
      await interaction.editReply({ content: reply });
    } catch (e) {
      console.error('ai command error', e);
      try { await interaction.reply({ content: 'AI service is unavailable right now.', flags: 64 }); } catch(_){}
    }
  }
};

