const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to lookup').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild ? interaction.guild.members.cache.get(user.id) : null;
    const embed = new EmbedBuilder()
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot', value: String(user.bot), inline: true }
      )
      .setTimestamp();
    if (member) {
      embed.addFields({ name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true });
      if (member.roles && member.roles.cache.size > 1) {
        const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).slice(0, 10).join(' ');
        embed.addFields({ name: 'Roles', value: roles || 'None', inline: false });
      }
    }
    await interaction.reply({ embeds: [embed] });
  }
};

