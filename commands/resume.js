const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
  
  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', flags: 64 });
    }

    try {
      const player = interaction.client.player;
      const queue = player.queues.get(interaction.guildId);
      
      if (!queue) {
        return interaction.reply({ content: '❌ No music queue found.', flags: 64 });
      }

      queue.node.resume();
      const embed = createEmbed({
        title: '▶️ Music Resumed',
        description: 'The song has been resumed.'
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Resume error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.', flags: 64 });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: 64 });
      }
    }
  }
};

