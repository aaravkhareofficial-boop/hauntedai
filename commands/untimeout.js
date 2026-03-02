const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove timeout from a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to untimeout').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ModerateMembers')) {
      return interaction.reply({ content: 'You need Moderate Members permission.', flags: 64 });
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!member.moderatable) return interaction.reply({ content: 'I cannot remove timeout from this user (permissions/hierarchy).', flags: 64 });
    try {
      await member.timeout(null, reason);
      await interaction.reply({ content: `Removed timeout for ${user.tag}. Reason: ${reason}` });
    } catch (err) {
      console.error('untimeout error', err);
      await interaction.reply({ content: 'Failed to remove timeout. Check my permissions and role hierarchy.', flags: 64 });
    }
  }
};
