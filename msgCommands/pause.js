const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'pause',
  description: 'Pause the current song',
  async execute(message, args) {
    if (!message.member.voice.channel) {
      return message.reply('❌ You must be in a voice channel!');
    }

    try {
      const player = message.client.player;
      const queue = player.queues.get(message.guildId);
      
      if (!queue || !queue.playing) {
        return message.reply('❌ No music is currently playing.');
      }

      queue.node.pause();
      const embed = createEmbed({
        title: '⏸️ Music Paused',
        description: 'The current song has been paused.'
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Pause error:', error);
      message.reply('❌ An error occurred.');
    }
  }
};

