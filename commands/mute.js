const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute (timeout) a user. Default duration is 10 minutes if not supplied.')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Number of minutes to timeout').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      return interaction.reply({ content: 'You need Moderate Members permission.', flags: 64 });
    }
    const user = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes') || 10;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user (permissions/hierarchy).', flags: 64 });
    try {
      await member.timeout(minutes * 60 * 1000, reason);
      await interaction.reply({ content: `Muted ${user.tag} for ${minutes} minute(s). Reason: ${reason}` });
    } catch (err) {
      console.error('mute error', err);
      await interaction.reply({ content: 'Failed to mute user. Check my permissions and role hierarchy.', flags: 64 });
    }
  }
};
