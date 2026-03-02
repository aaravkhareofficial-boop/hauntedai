const { SlashCommandBuilder } = require('@discordjs/builders');
const ai = require('../lib/ai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetai')
    .setDescription('Reset your AI conversation history and persona'),
  async execute(interaction) {
    try {
      ai.clearSession(interaction.user.id);
      await interaction.reply({ content: 'Your AI session has been reset.', flags: 64 });
    } catch (e) {
      console.error('resetai error', e);
      try { await interaction.reply({ content: 'Could not reset your session right now.', flags: 64 }); } catch(_){}
    }
  }
};

