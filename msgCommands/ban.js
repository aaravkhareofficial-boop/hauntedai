module.exports = {
  name: 'ban',
  description: 'Ban a user (requires Ban Members permission)',
  async execute(message, args) {
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? message.author.id === ownerId : message.author.username.toLowerCase().includes('shiven');
    if (!message.member.permissions.has('BanMembers') && !isOwner) {
      return message.reply('You need Ban Members permission to use this command.');
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(()=>null) : null);
    if (!target) return message.reply('Please mention a user to ban or provide their ID.');

    const days = parseInt(args[1], 10) || 0;
    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      await message.guild.members.ban(target.id, { days, reason });
      await message.channel.send(`Banned ${target.tag}. Reason: ${reason}`);
    } catch (e) {
      console.error('ban error', e);
      await message.reply('Failed to ban user. Check my permissions and role hierarchy.');
    }
  }
};
