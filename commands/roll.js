const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice, like 1d6 or 2d8')
    .addStringOption(o => o.setName('dice').setDescription('Dice notation (e.g., 1d6)').setRequired(false)),
  async execute(interaction) {
    const dice = interaction.options.getString('dice') || '1d6';
    const match = /^([0-9]+)d([0-9]+)$/.exec(dice);
    if (!match) return interaction.reply({ content: 'Invalid dice format. Use NdM (e.g., 2d6).', flags: 64 });
    const n = Math.min(20, parseInt(match[1], 10));
    const m = Math.min(1000, parseInt(match[2], 10));
    const rolls = [];
    for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * m));
    const total = rolls.reduce((a,b) => a+b, 0);
    await interaction.reply({ content: `Rolled ${dice}: [${rolls.join(', ')}] (total ${total})` });
  }
};

