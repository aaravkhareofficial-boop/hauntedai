const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Send a virtual hug')
    .addUserOption(o => o.setName('user').setDescription('User to hug').setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    await interaction.reply({ content: `${interaction.user.tag} gives ${target.tag} a hug 🤗` });
  }
};

