const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Show bot uptime'),
  async execute(interaction) {
    try {
      const ms = interaction.client.uptime || 0;
      const s = Math.floor(ms/1000)%60;
      const m = Math.floor(ms/60000)%60;
      const h = Math.floor(ms/3600000)%24;
      const d = Math.floor(ms/86400000);
      const parts = [];
      if (d) parts.push(`${d}d`);
      if (h) parts.push(`${h}h`);
      if (m) parts.push(`${m}m`);
      parts.push(`${s}s`);
      await interaction.reply({ content: `Uptime: ${parts.join(' ')}`, ephemeral: false });
    } catch (e) {
      console.error('uptime command error', e);
      try { await interaction.reply({ content: 'Could not retrieve uptime right now.', flags: 64 }); } catch(_){}
    }
  }
};

