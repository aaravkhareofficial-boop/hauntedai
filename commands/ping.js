const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = createEmbed({ title: 'Pong!', description: `WS: ${Math.round(interaction.client.ws.ping)}ms | RTT: ${latency}ms` });
    await interaction.editReply({ content: null, embeds: [embed] });
  }
};

