const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user (requires Kick Members permission)')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('KickMembers')) return interaction.reply({ content: 'You need Kick Members permission.', flags: 64 });
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user (permissions/hierarchy).', flags: 64 });
    await member.kick(reason);
    await interaction.reply({ content: `Kicked ${user.tag}. Reason: ${reason}` });
  }
};

