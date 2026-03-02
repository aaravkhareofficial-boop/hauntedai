const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue'),
  
  async execute(interaction) {
    try {
      const player = interaction.client.player;
      const queue = player.queues.get(interaction.guildId);
      
      if (!queue || queue.tracks.length === 0) {
        return interaction.reply({ content: '❌ No songs in queue.', flags: 64 });
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

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Queue error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
      }
    }
  }
};

