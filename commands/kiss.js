const { SlashCommandBuilder } = require('@discordjs/builders');
const { searchGif } = require('../lib/gif');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Kiss another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to kiss').setRequired(false)),
  async execute(interaction) {
    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const url = await searchGif('kiss');
      await interaction.reply({ content: `${interaction.user.tag} kisses ${target.tag}!`, files: [url] });
    } catch (e) {
      console.error('kiss command error', e);
      try { await interaction.reply({ content: 'Could not perform that action right now.', flags: 64 }); } catch(_){}
    }
  }
};

