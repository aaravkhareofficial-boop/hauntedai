const { SlashCommandBuilder } = require('@discordjs/builders');
const { searchGif } = require('../lib/gif');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Pat another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to pat').setRequired(false)),
  async execute(interaction) {
    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const url = await searchGif('pat');
      await interaction.reply({ content: `${interaction.user.tag} pats ${target.tag}.`, files: [url] });
    } catch (e) {
      console.error('pat command error', e);
      try { await interaction.reply({ content: 'Could not perform that action right now.', flags: 64 }); } catch(_){}
    }
  }
};

