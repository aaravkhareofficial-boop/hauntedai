const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'dm',
  description: 'Send a DM to a user',
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply('Usage: `dm <@user> <message>`\nExample: `dm @John Hello there!`');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to DM.');
    }

    if (user.id === message.author.id) {
      return message.reply('You cannot DM yourself!');
    }

    if (user.bot) {
      return message.reply('You cannot DM bots!');
    }

    const messageText = args.slice(1).join(' ');

    try {
      const embed = createEmbed({
        title: '📨 You got a message!',
        description: messageText,
        footer: `From: ${message.author.username}`,
        fields: [
          { name: 'Server', value: message.guild?.name || 'Unknown', inline: true }
        ]
      });

      await user.send({ embeds: [embed] });
      await message.reply(`✅ DM sent to ${user.username}!`);
    } catch (error) {
      console.error('DM error:', error);
      message.reply(`❌ Could not send DM to ${user.username}. They may have DMs disabled.`);
    }
  }
};

