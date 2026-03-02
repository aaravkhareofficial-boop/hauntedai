const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
  
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

      queue.node.pause();
      const embed = createEmbed({
        title: '⏸️ Music Paused',
        description: 'The current song has been paused.'
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Pause error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
      }
    }
  }
};

