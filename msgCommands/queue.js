const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'queue',
  description: 'View the current music queue',
  async execute(message, args) {
    try {
      const player = message.client.player;
      const queue = player.queues.get(message.guildId);
      
      if (!queue || queue.tracks.length === 0) {
        return message.reply('❌ No songs in queue.');
      }

      const trackList = queue.tracks.slice(0, 10).map((track, i) => `${i + 1}. **${track.title}** - ${(track.duration / 1000).toFixed(0)}s`).join('\n');
      
      const embed = createEmbed({
        title: '🎵 Music Queue',
        description: trackList,
        fields: [
          { name: 'Total Tracks', value: `${queue.tracks.length}`, inline: true },
          { name: 'Now Playing', value: queue.current ? queue.current.title : 'Nothing', inline: true }
        ]
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Queue error:', error);
      message.reply('❌ An error occurred.');
    }
  }
};

