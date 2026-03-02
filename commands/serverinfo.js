const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about this server'),
  async execute(interaction) {
    const g = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(`${g.name}`)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: String(g.memberCount), inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }
};

