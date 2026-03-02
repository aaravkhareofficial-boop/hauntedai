const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Bot repeats your message (Admin only)')
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageGuild')) return interaction.reply({ content: 'You need Manage Server permission to use this.', flags: 64 });
    const msg = interaction.options.getString('message');
    await interaction.reply({ content: msg });
  }
};

