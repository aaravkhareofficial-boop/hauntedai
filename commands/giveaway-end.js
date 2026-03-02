const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('End an active giveaway early (Admin only)')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)),
  
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageGuild')) {
      return interaction.reply({ content: 'You need Manage Server permission to use this.', flags: 64 });
    }

    const messageId = interaction.options.getString('message_id');

    try {
      const message = await interaction.channel.messages.fetch(messageId);
      const reaction = message.reactions.cache.get('🎉');

      if (!reaction) {
        return interaction.reply({ content: 'No giveaway found with that message ID or no reactions.', flags: 64 });
      }

      const users = await reaction.users.fetch();
      const participants = users.filter(u => !u.bot).map(u => u);

      if (participants.length === 0) {
        await message.edit({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No valid participants found!' })] });
        return interaction.reply({ content: 'No valid participants found.', flags: 64 });
      }

      const winner = participants[Math.floor(Math.random() * participants.length)];
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
      
      await interaction.reply({ content: `Giveaway ended! Winner: <@${winner.id}>`, flags: 64 });
    } catch (error) {
      console.error('Giveaway end error:', error);
      await interaction.reply({ content: 'Could not find or end that giveaway.', flags: 64 });
    }
  }
};

