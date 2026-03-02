const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-makewinner')
    .setDescription('Manually make someone a winner (Admin only)')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true))
    .addUserOption(o => o.setName('winner').setDescription('User to make winner').setRequired(true)),
  
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageGuild')) {
      return interaction.reply({ content: 'You need Manage Server permission to use this.', flags: 64 });
    }

    const messageId = interaction.options.getString('message_id');
    const winner = interaction.options.getUser('winner');

    try {
      const message = await interaction.channel.messages.fetch(messageId);
      const embed = message.embeds[0];
      
      const resultEmbed = createEmbed({
        title: '🎉 Giveaway Ended!',
        description: `**Prize:** ${embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown'}\n**Winner:** <@${winner.id}>`,
        footer: 'Congratulations!'
      });

      await message.edit({ embeds: [resultEmbed] });
      
      // Send DM to winner
      try {
        const prizeText = embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown';
        await winner.send({ embeds: [createEmbed({ title: '🎉 You Won!', description: `Congratulations! You won **${prizeText}** in the giveaway!` })] });
      } catch (err) {
        console.error(`Could not DM winner ${winner.id}:`, err);
      }
      
      await interaction.reply({ content: `Winner set to <@${winner.id}>!`, flags: 64 });
    } catch (error) {
      console.error('Giveaway makewinner error:', error);
      await interaction.reply({ content: 'Could not find or update that giveaway.', flags: 64 });
    }
  }
};

