const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Nuke a channel (delete and recreate with same permissions)')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to nuke').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for nuke').setRequired(false)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageChannels')) {
      return interaction.reply({ content: 'You need Manage Channels permission.', flags: 64 });
    }
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
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
      
      await interaction.deferReply();
      await channel.delete(`Nuked by ${interaction.user.tag}. Reason: ${reason}`);
      
      const newChannel = await interaction.guild.channels.create({
        name: channel.name,
        ...channelData
      });
      
      await interaction.editReply({ content: `💣 Channel nuked! New channel created: ${newChannel}` });
    } catch (err) {
      console.error('nuke error', err);
      await interaction.editReply({ content: 'Failed to nuke channel. Check my permissions and try again.', flags: 64 });
    }
  }
};
