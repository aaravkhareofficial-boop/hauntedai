const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock this channel (deny SEND_MESSAGES for @everyone)')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for locking').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageChannels')) return interaction.reply({ content: 'You need Manage Channels permission.', flags: 64 });
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: `🔒 Channel locked. Reason: ${reason}` });
    } catch (err) {
      console.error('lock error', err);
      await interaction.reply({ content: 'Failed to lock the channel. Make sure I have Manage Channels permission.', flags: 64 });
    }
  }
};

