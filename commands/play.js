const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add to queue')
    .addStringOption(o => o.setName('query').setDescription('Song name or YouTube URL').setRequired(true)),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');

    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ You must be in a voice channel to use this command!', flags: 64 });
    }

    // Reply immediately to avoid timeout
    await interaction.reply({ content: '🎵 Searching for music...' });

    try {
      const player = interaction.client.player;
      const queue = player.queues.get(interaction.guildId);
      
      const results = await player.search(query, { requestedBy: interaction.user });
      
      if (!results.tracks.length) {
        return interaction.editReply({ content: '❌ No songs found matching your query.' });
      }

      if (!queue) {
        const newQueue = player.queues.create(interaction.guildId, {
          metadata: interaction.channel
        });
        await newQueue.connect(interaction.member.voice.channel);
        await newQueue.addTrack(results.tracks[0]);
        
        const embed = createEmbed({
          title: '🎵 Now Playing',
          description: `**${results.tracks[0].title}**`,
          fields: [
            { name: 'Duration', value: `${(results.tracks[0].duration / 1000).toFixed(0)}s`, inline: true },
            { name: 'Requested by', value: interaction.user.username, inline: true }
          ]
        });
        
        return interaction.editReply({ embeds: [embed] });
      } else {
        await queue.addTrack(results.tracks[0]);
        const embed = createEmbed({
          title: '🎵 Added to Queue',
          description: `**${results.tracks[0].title}**`,
          fields: [
            { name: 'Position', value: `${queue.tracks.length}`, inline: true },
            { name: 'Duration', value: `${(results.tracks[0].duration / 1000).toFixed(0)}s`, inline: true }
          ]
        });
        
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Play error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred while trying to play the song.' });
      } else {
        await interaction.reply({ content: '❌ An error occurred while trying to play the song.', flags: 64 });
      }
    }
  }
};

