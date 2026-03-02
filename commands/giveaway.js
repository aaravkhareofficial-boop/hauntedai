const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway (Admin only)')
    .addStringOption(o => o.setName('prize').setDescription('Prize to give away').setRequired(true))
    .addIntegerOption(o => o.setName('duration').setDescription('Duration in seconds').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(false))
    .addRoleOption(o => o.setName('requirement').setDescription('Role requirement to enter').setRequired(false)),
  
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageGuild')) {
      return interaction.reply({ content: 'You need Manage Server permission to use this.', flags: 64 });
    }

    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration');
    const winners = interaction.options.getInteger('winners') || 1;
    const requirement = interaction.options.getRole('requirement');

    const embed = createEmbed({
      title: '🎁 GIVEAWAY 🎁',
      description: `Prize: **${prize}**\nWinners: **${winners}**`,
      fields: [
        { name: 'Duration', value: `${duration} seconds`, inline: true },
        { name: 'Ends in', value: `<t:${Math.floor((Date.now() + duration * 1000) / 1000)}:R>`, inline: true },
        ...(requirement ? [{ name: 'Requirement', value: `<@&${requirement.id}>`, inline: true }] : [])
      ],
      footer: 'React with 🎉 to enter!'
    });

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('🎉');

    setTimeout(async () => {
      const reaction = msg.reactions.cache.get('🎉');
      if (!reaction) {
        await interaction.editReply({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No participants found!' })] });
        return;
      }

      const users = await reaction.users.fetch();
      const participants = users.filter(u => !u.bot).map(u => u);

      if (participants.length === 0) {
        await interaction.editReply({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No valid participants found!' })] });
        return;
      }

      let selectedWinners = [];
      const winnerCount = Math.min(winners, participants.length);
      const indices = new Set();
      
      while (indices.size < winnerCount) {
        indices.add(Math.floor(Math.random() * participants.length));
      }

      for (const idx of indices) {
        selectedWinners.push(participants[idx]);
      }

      const winnerMentions = selectedWinners.map(u => `<@${u.id}>`).join(', ');
      const resultEmbed = createEmbed({
        title: '🎉 Giveaway Ended!',
        description: `**Prize:** ${prize}\n**Winner(s):** ${winnerMentions}`,
        footer: `Congratulations!`
      });

      await interaction.editReply({ embeds: [resultEmbed] });
      
      // Send DM to winners
      for (const winner of selectedWinners) {
        try {
          await winner.send({ embeds: [createEmbed({ title: '🎉 You Won!', description: `Congratulations! You won **${prize}** in the giveaway!` })] });
        } catch (err) {
          console.error(`Could not DM winner ${winner.id}:`, err);
        }
      }
    }, duration * 1000);
  }
};

