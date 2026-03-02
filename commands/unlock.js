const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock this channel (restore SEND_MESSAGES for @everyone)')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unlocking').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageChannels')) return interaction.reply({ content: 'You need Manage Channels permission.', flags: 64 });
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply({ content: `🔓 Channel unlocked. Reason: ${reason}` });
    } catch (err) {
      console.error('unlock error', err);
      await interaction.reply({ content: 'Failed to unlock the channel. Make sure I have Manage Channels permission.', flags: 64 });
    }
  }
};

