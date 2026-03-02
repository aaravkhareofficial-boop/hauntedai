module.exports = {
  name: 'nuke',
  description: 'Nuke a channel (delete and recreate with same permissions)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageChannels')) {
      return message.reply('You need Manage Channels permission to use this command.');
    }
    
    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.join(' ') || 'No reason provided';
    
    try {
      const permissions = channel.permissionOverwrites.cache.map(perm => ({
        id: perm.id,
        type: perm.type,
        allow: perm.allow.bitfield,
        deny: perm.deny.bitfield
      }));
      
      const channelData = {
        type: channel.type,
        topic: channel.topic,
        nsfw: channel.nsfw,
        rateLimitPerUser: channel.rateLimitPerUser,
        parent: channel.parentId,
        permissionOverwrites: permissions
      };
      
      await channel.delete(`Nuked by ${message.author.tag}. Reason: ${reason}`);
      
      const newChannel = await message.guild.channels.create({
        name: channel.name,
        ...channelData
      });
      
      await newChannel.send(`💣 Channel nuked by ${message.author.tag}. Reason: ${reason}`);
    } catch (e) {
      console.error('nuke error', e);
      await message.reply('Failed to nuke channel. Check my permissions and try again.');
    }
  }
};
