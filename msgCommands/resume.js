const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'resume',
  description: 'Resume the paused song',
  async execute(message, args) {
    if (!message.member.voice.channel) {
      return message.reply('❌ You must be in a voice channel!');
    }

    try {
      const player = message.client.player;
      const queue = player.queues.get(message.guildId);
      
      if (!queue) {
        return message.reply('❌ No music queue found.');
      }

      queue.node.resume();
      const embed = createEmbed({
        title: '▶️ Music Resumed',
        description: 'The song has been resumed.'
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Resume error:', error);
      message.reply('❌ An error occurred.');
    }
  }
};

