const { SlashCommandBuilder } = require('@discordjs/builders');
const econ = require('../lib/economy');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('Add crystals to a user (admin only)')
    .addUserOption(o => o.setName('user').setDescription('User to add to').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to add').setRequired(true)),
  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    const modRoleId = process.env.MOD_ROLE_ID;
    const isOwner = ownerId && interaction.user.id === ownerId;
    const hasModRole = modRoleId && interaction.member.roles.cache.has(modRoleId);
    const isAdmin = interaction.memberPermissions.has('Administrator') || interaction.memberPermissions.has('ManageGuild');
    if (!(isOwner || hasModRole || isAdmin)) {
      const embed = createEmbed({ title: 'Permission denied', description: 'You do not have permission to use this command.', color: 0xFF0000 });
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (amount === 0) return interaction.reply({ content: 'Amount must be non-zero.', flags: 64 });
    econ.addBalance(user.id, amount);
    const u = econ.getUser(user.id);
    const embed = createEmbed({ title: 'Crystals added', description: `Added ${amount} ${econ.CURRENCY} to ${user.tag}.`, fields: [{ name: 'New balance', value: String(u.balance), inline: true }] });
    await interaction.reply({ embeds: [embed] });
  }
};

