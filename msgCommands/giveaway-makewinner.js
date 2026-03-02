const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'giveaway-makewinner',
  description: 'Manually make someone a winner (Admin only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You need Manage Server permission to use this.');
    }

    if (args.length < 2) {
      return message.reply('Usage: `giveaway-makewinner <message_id> <@user>`\nExample: `giveaway-makewinner 1234567890 @John`');
    }

    const messageId = args[0];
    const userMention = message.mentions.users.first();

    if (!userMention) {
      return message.reply('Please mention a user to make winner.');
    }

    try {
      const giveawayMsg = await message.channel.messages.fetch(messageId);
      const embed = giveawayMsg.embeds[0];
      
      const resultEmbed = createEmbed({
        title: '🎉 Giveaway Ended!',
        description: `**Prize:** ${embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown'}\n**Winner:** <@${userMention.id}>`,
        footer: 'Congratulations!'
      });

      await giveawayMsg.edit({ embeds: [resultEmbed] });
      
      // Send DM to winner
      try {
        const prizeText = embed?.data?.description?.split('\n')[0]?.replace('Prize: **', '').replace('**', '') || 'Unknown';
        await userMention.send({ embeds: [createEmbed({ title: '🎉 You Won!', description: `Congratulations! You won **${prizeText}** in the giveaway!` })] });
      } catch (dmErr) {
        console.error(`Could not DM winner ${userMention.id}:`, dmErr);
      }
      
      await message.reply(`Winner set to <@${userMention.id}>!`);
    } catch (error) {
      console.error('Giveaway makewinner error:', error);
      message.reply('Could not find or update that giveaway.');
    }
  }
};

