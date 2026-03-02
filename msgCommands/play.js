const { createEmbed } = require('../lib/embed');

module.exports = {
  name: 'play',
  description: 'Play a song or add to queue',
  async execute(message, args) {
    if (!args.length) {
      return message.reply('Usage: `play <song name or URL>`');
    }

    if (!message.member.voice.channel) {
      return message.reply('❌ You must be in a voice channel to use this command!');
    }

    const query = args.join(' ');

    try {
      const player = message.client.player;
      const queue = player.queues.get(message.guildId);
      
      const results = await player.search(query, { requestedBy: message.author });
      
      if (!results.tracks.length) {
        return message.reply('❌ No songs found matching your query.');
      }

      if (!queue) {
        const newQueue = player.queues.create(message.guildId, {
          metadata: message.channel
        });
        await newQueue.connect(message.member.voice.channel);
        await newQueue.addTrack(results.tracks[0]);
        
        const embed = createEmbed({
          title: '🎵 Now Playing',
          description: `**${results.tracks[0].title}**`,
          fields: [
            { name: 'Duration', value: `${(results.tracks[0].duration / 1000).toFixed(0)}s`, inline: true },
            { name: 'Requested by', value: message.author.username, inline: true }
          ]
        });
        
        return message.reply({ embeds: [embed] });
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
        
        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Play error:', error);
      message.reply('❌ An error occurred while trying to play the song.');
    }
  }
};

