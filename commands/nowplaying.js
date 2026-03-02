const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),
  
  async execute(interaction) {
    try {
      const player = interaction.client.player;
      const queue = player.queues.get(interaction.guildId);
      
      if (!queue || !queue.current) {
        return interaction.reply({ content: '❌ No song is currently playing.', flags: 64 });
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

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Now playing error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
      }
    }
  }
};

