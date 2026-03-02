const { SlashCommandBuilder } = require('@discordjs/builders');
const econ = require('../lib/economy');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription("Show a user's balance")
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const u = econ.getUser(user.id);
    const embed = createEmbed({ title: `${user.tag}'s Balance`, description: `${u.balance} ${econ.CURRENCY}` });
    await interaction.reply({ embeds: [embed] });
  }
};

