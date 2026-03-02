const { SlashCommandBuilder } = require('@discordjs/builders');
const ai = require('../lib/ai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpersona')
    .setDescription('Set a system persona for your AI chat (private to your user)')
    .addStringOption(opt => opt.setName('persona').setDescription('Persona text').setRequired(true)),
  async execute(interaction) {
    try {
      const persona = interaction.options.getString('persona');
      const sess = ai.getSession(interaction.user.id) || {};
      sess.persona = persona;
      ai.setSession(interaction.user.id, sess);
      await interaction.reply({ content: 'Persona updated for your AI session.', flags: 64 });
    } catch (e) {
      console.error('setpersona error', e);
      try { await interaction.reply({ content: 'Could not update persona right now.', flags: 64 }); } catch(_){}
    }
  }
};

