const { SlashCommandBuilder } = require('@discordjs/builders');
const econ = require('../lib/economy');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Pay another user crystals')
    .addUserOption(o => o.setName('user').setDescription('User to pay').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to pay').setRequired(true)),
  async execute(interaction) {
    const to = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: 'Amount must be positive', flags: 64 });
    const success = econ.transfer(interaction.user.id, to.id, amount);
    if (!success) return interaction.reply({ content: 'Insufficient funds.', flags: 64 });
    const embed = createEmbed({ title: 'Payment successful', description: `Paid ${amount} ${econ.CURRENCY} to ${to.tag}.` });
    await interaction.reply({ embeds: [embed] });
  }
};

