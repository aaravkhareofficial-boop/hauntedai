const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip to the next song in queue'),
  
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

      const skipped = queue.node.skip();
      const embed = createEmbed({
        title: '⏭️ Song Skipped',
        description: `${skipped ? 'Skipped to the next song.' : 'Already at the last song in queue.'}`
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Skip error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
      }
    }
  }
};

