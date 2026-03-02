const { EmbedBuilder } = require('discord.js');

function createEmbed({ title, description, fields, footer }) {
  const e = new EmbedBuilder();
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  if (fields) e.addFields(fields);
  // Enforce black-and-white theme: black embed accent
  e.setColor(0x000000);
  if (footer) e.setFooter({ text: footer });
  return e;
}

module.exports = { createEmbed };

