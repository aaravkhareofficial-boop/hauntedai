module.exports = {
  name: 'lock',
  description: 'Lock this channel (requires Manage Channels permission)',
  async execute(message, args) {
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? message.author.id === ownerId : message.author.username.toLowerCase().includes('shiven');
    if (!message.member.permissions.has('ManageChannels') && !isOwner) {
      return message.reply('You need Manage Channels permission to use this command.');
    }

    const reason = args.join(' ') || 'No reason provided';

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      await message.channel.send(`🔒 Channel locked. Reason: ${reason}`);
    } catch (err) {
      console.error('lock error', err);
      await message.reply('Failed to lock the channel. Make sure I have Manage Channels permission.');
    }
  }
};
