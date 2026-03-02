const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user (requires Ban Members permission)')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addIntegerOption(opt => opt.setName('days').setDescription('Delete message days (0-7)').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('BanMembers')) return interaction.reply({ content: 'You need Ban Members permission.', flags: 64 });
    const user = interaction.options.getUser('user');
    const days = interaction.options.getInteger('days') || 0;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      await interaction.guild.members.ban(user.id, { days, reason });
      await interaction.reply({ content: `Banned ${user.tag}. Reason: ${reason}` });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to ban user. Check my permissions and role hierarchy.', flags: 64 });
    }
  }
};

