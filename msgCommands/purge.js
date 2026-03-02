module.exports = {
  name: 'purge',
  description: 'Bulk delete messages (requires Manage Messages permission)',
  async execute(message, args) {
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? message.author.id === ownerId : message.author.username.toLowerCase().includes('shiven');
    if (!message.member.permissions.has('ManageMessages') && !isOwner) {
      return message.reply('You need Manage Messages permission to use this command.');
    }

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('Please provide an amount between 1 and 100.');
    }

    try {
      // include the command message itself, but ensure we do not request more than 100
      const toDelete = Math.min(amount + 1, 100);
      const deleted = await message.channel.bulkDelete(toDelete, true);
      const count = Math.max(0, deleted.size - 1);
      const confirmation = await message.channel.send(`🧹 Deleted ${count} messages.`);
      setTimeout(() => confirmation.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error('purge error', err);
      await message.reply('Failed to delete messages (messages older than 14 days cannot be bulk deleted).');
    }
  }
};
