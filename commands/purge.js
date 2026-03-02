const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages (requires Manage Messages)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageMessages')) return interaction.reply({ content: 'You need Manage Messages permission.', flags: 64 });
    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) return interaction.reply({ content: 'Amount must be between 1 and 100.', flags: 64 });
    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Deleted ${deleted.size} messages.`, flags: 64 });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to delete messages (messages older than 14 days cannot be bulk deleted).', flags: 64 });
    }
  }
};

