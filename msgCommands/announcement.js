const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'announcement',
  description: 'Send an announcement to the server (Admin only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You need Manage Server permission to use this.');
    }

    if (args.length < 2) {
      return message.reply('Usage: `announcement <title> | <message> [color]`\nExample: `announcement Server Update | New features added! FF5733`');
    }

    const input = args.join(' ');
    const [titleAndMessage, color] = input.split('|').map(s => s.trim());
    const [title, ...messageParts] = titleAndMessage.split(' ');
    const fullMessage = messageParts.join(' ');

    if (!title || !fullMessage) {
      return message.reply('Usage: `announcement <title> | <message> [color]`');
    }

    const embedColor = color && /^[0-9A-F]{6}$/i.test(color) ? parseInt('0x' + color, 16) : 0x0099FF;

    const embed = createEmbed({
      title,
      description: fullMessage,
      color: embedColor,
      footer: `Announced by ${message.author.username}`
    });

    await message.channel.send({ embeds: [embed] });
  }
};

