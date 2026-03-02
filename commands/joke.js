const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = globalThis.fetch || require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tell a random joke'),
  async execute(interaction) {
    try {
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      if (!res.ok) throw new Error('fetch failed');
      const j = await res.json();
      await interaction.reply({ content: `${j.setup}\n${j.punchline}` });
    } catch (e) {
      console.error('joke fetch error', e);
      try { await interaction.reply({ content: 'Could not fetch a joke right now. Try again later.', flags: 64 }); } catch(_){}
    }
  }
};

