const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'nowplaying',
  description: 'Show the currently playing song',
  async execute(message, args) {
    try {
      const player = message.client.player;
      const queue = player.queues.get(message.guildId);
      
      if (!queue || !queue.current) {
        return message.reply('❌ No song is currently playing.');
      }

      const progress = queue.node.createProgressBar();
      const embed = createEmbed({
        title: '🎵 Now Playing',
        description: `**${queue.current.title}**`,
        fields: [
          { name: 'Artist', value: queue.current.author || 'Unknown', inline: true },
          { name: 'Duration', value: `${(queue.current.duration / 1000).toFixed(0)}s`, inline: true },
          { name: 'Progress', value: progress, inline: false }
        ]
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Now playing error:', error);
      message.reply('❌ An error occurred.');
    }
  }
};

