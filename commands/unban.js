const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .addStringOption(opt => opt.setName('userid').setDescription('ID of the user to unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('BanMembers')) {
      return interaction.reply({ content: 'You need Ban Members permission.', flags: 64 });
    }
    const id = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      const bans = await interaction.guild.bans.fetch();
      const banInfo = bans.get(id);
      if (!banInfo) return interaction.reply({ content: 'That user is not banned.', flags: 64 });
      await interaction.guild.members.unban(id, reason);
      await interaction.reply({ content: `Unbanned <@${id}>. Reason: ${reason}` });
    } catch (err) {
      console.error('unban error', err);
      await interaction.reply({ content: 'Failed to unban user. Make sure the ID is correct and I have permission.', flags: 64 });
    }
  }
};
