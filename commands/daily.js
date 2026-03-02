const { SlashCommandBuilder } = require('@discordjs/builders');
const econ = require('../lib/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Collect daily coins'),
  async execute(interaction) {
    const id = interaction.user.id;
    const user = econ.getUser(id);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (user.lastDaily && (now - user.lastDaily) < ONE_DAY) {
      const remaining = Math.ceil((ONE_DAY - (now - user.lastDaily)) / 1000);
      return interaction.reply({ content: `You need to wait ${remaining} seconds to collect daily again.`, flags: 64 });
    }
      user.balance = (user.balance || 0) + 200;
      user.lastDaily = now;
      econ.setUser(id, user);
      const { createEmbed } = require('../lib/embed');
      const embed = createEmbed({ title: 'Daily collected', description: `You collected 200 ${econ.CURRENCY}.`, fields: [{ name: 'New balance', value: String(user.balance), inline: true }] });
      await interaction.reply({ embeds: [embed] });
  }
};

