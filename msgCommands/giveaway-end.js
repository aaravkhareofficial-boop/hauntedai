const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'giveaway-end',
  description: 'End an active giveaway early (Admin only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You need Manage Server permission to use this.');
    }

    if (args.length < 1) {
      return message.reply('Usage: `giveaway-end <message_id>`');
    }

    const messageId = args[0];

    try {
      const giveawayMsg = await message.channel.messages.fetch(messageId);
      const reaction = giveawayMsg.reactions.cache.get('🎉');

      if (!reaction) {
        return message.reply('No giveaway found with that message ID or no reactions.');
      }

      const users = await reaction.users.fetch();
      const participants = users.filter(u => !u.bot).map(u => u);

      if (participants.length === 0) {
        await giveawayMsg.edit({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No valid participants found!' })] });
        return message.reply('No valid participants found.');
      }

      const winner = participants[Math.floor(Math.random() * participants.length)];
      const embed = giveawayMsg.embeds[0];
      
      const resultEmbed = createEmbed({
        title: '🎉 Giveaway Ended!',
        description: `**Prize:** ${embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown'}\n**Winner:** <@${winner.id}>`,
        footer: 'Congratulations!'
      });

      await giveawayMsg.edit({ embeds: [resultEmbed] });
      
      // Send DM to winner
      try {
        const prizeText = embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown';
        await winner.send({ embeds: [createEmbed({ title: '🎉 You Won!', description: `Congratulations! You won **${prizeText}** in the giveaway!` })] });
      } catch (dmErr) {
        console.error(`Could not DM winner ${winner.id}:`, dmErr);
      }
      
      await message.reply(`Giveaway ended! Winner: <@${winner.id}>`);
    } catch (error) {
      console.error('Giveaway end error:', error);
      message.reply('Could not find or end that giveaway.');
    }
  }
};

