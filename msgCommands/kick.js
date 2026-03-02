module.exports = {
  name: 'kick',
  description: 'Kick a user (requires Kick Members permission)',
  async execute(message, args) {
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? message.author.id === ownerId : message.author.username.toLowerCase().includes('shiven');
    if (!message.member.permissions.has('KickMembers') && !isOwner) {
      return message.reply('You need Kick Members permission to use this command.');
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(()=>null) : null);
    if (!target) return message.reply('Please mention a user to kick or provide their ID.');

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const member = await message.guild.members.fetch(target.id).catch(()=>null);
      if (!member) return message.reply('User not found in this server.');
      if (!member.kickable && !isOwner) return message.reply('I cannot kick this user (permissions/hierarchy).');
      await member.kick(reason);
      await message.channel.send(`Kicked ${target.tag}. Reason: ${reason}`);
    } catch (e) {
      console.error('kick error', e);
      await message.reply('Failed to kick user.');
    }
  }
};
