module.exports = {
  name: 'mute',
  description: 'Mute (timeout) a user. Default 10 minutes if not given.',
  async execute(message, args) {
    const isMod = message.member.permissions.has('ModerateMembers');
    if (!isMod) return message.reply('You need Moderate Members permission to use this command.');

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(()=>null) : null);
    if (!target) return message.reply('Please mention a user to mute or provide their ID.');

    const minutes = parseInt(args[1], 10) || 10;
    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      const member = await message.guild.members.fetch(target.id);
      if (!member) return message.reply('User not found in this server.');
      if (!member.moderatable) return message.reply('I cannot mute this user (permissions/hierarchy).');
      await member.timeout(minutes * 60 * 1000, reason);
      await message.channel.send(`Muted ${target.tag} for ${minutes} minute(s). Reason: ${reason}`);
    } catch (e) {
      console.error('mute error', e);
      await message.reply('Failed to mute user. Check my permissions and role hierarchy.');
    }
  }
};
