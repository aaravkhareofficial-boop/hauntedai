const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone (for fun)')
    .addUserOption(o => o.setName('user').setDescription('User to slap').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    await interaction.reply({ content: `${interaction.user.tag} slaps ${target.tag} 🤚` });
  }
};

