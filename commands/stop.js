const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and leave voice channel'),
  
  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', flags: 64 });
    }

    try {
      const player = interaction.client.player;
      const queue = player.queues.get(interaction.guildId);
      
      if (!queue || !queue.playing) {
        return interaction.reply({ content: '❌ No music is currently playing.', flags: 64 });
      }

      queue.delete();
      const embed = createEmbed({
        title: '⏹️ Music Stopped',
        description: 'The music player has stopped.'
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Stop error:', error);
      await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
    }
  }
};

