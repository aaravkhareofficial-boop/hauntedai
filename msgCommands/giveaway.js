const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'giveaway',
  description: 'Start a giveaway (Admin only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You need Manage Server permission to use this.');
    }

    if (args.length < 2) {
      return message.reply('Usage: `giveaway <duration_seconds> <prize> [winners]`\nExample: `giveaway 60 "Discord Nitro" 2`');
    }

    const duration = parseInt(args[0]);
    if (isNaN(duration) || duration <= 0) {
      return message.reply('Duration must be a positive number in seconds.');
    }

    const prize = args.slice(1).join(' ');
    if (!prize) {
      return message.reply('Please specify a prize.');
    }

    const winners = 1;

    const embed = createEmbed({
      title: '🎁 GIVEAWAY 🎁',
      description: `Prize: **${prize}**\nWinners: **${winners}**`,
      fields: [
        { name: 'Duration', value: `${duration} seconds`, inline: true },
        { name: 'Ends in', value: `<t:${Math.floor((Date.now() + duration * 1000) / 1000)}:R>`, inline: true }
      ],
      footer: 'React with 🎉 to enter!'
    });

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react('🎉');

    setTimeout(async () => {
      try {
        const reaction = msg.reactions.cache.get('🎉');
        if (!reaction) {
          await msg.edit({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No participants found!' })] });
          return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(u => !u.bot).map(u => u);

        if (participants.length === 0) {
          await msg.edit({ embeds: [createEmbed({ title: '❌ Giveaway Ended', description: 'No valid participants found!' })] });
          return;
        }

        const winner = participants[Math.floor(Math.random() * participants.length)];
        const resultEmbed = createEmbed({
          title: '🎉 Giveaway Ended!',
          description: `**Prize:** ${prize}\n**Winner:** <@${winner.id}>`,
          footer: 'Congratulations!'
        });

        await msg.edit({ embeds: [resultEmbed] });
        
        // Send DM to winner
        try {
          await winner.send({ embeds: [createEmbed({ title: '🎉 You Won!', description: `Congratulations! You won **${prize}** in the giveaway!` })] });
        } catch (err) {
          console.error(`Could not DM winner ${winner.id}:`, err);
        }
      } catch (error) {
        console.error('Giveaway error:', error);
      }
    }, duration * 1000);
  }
};

