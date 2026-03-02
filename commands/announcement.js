const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Send an announcement to the server (Admin only)')
    .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Announcement message').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Embed color (hex, e.g., FF5733)').setRequired(false))
    .addUserOption(o => o.setName('mention').setDescription('User to mention').setRequired(false))
    .addRoleOption(o => o.setName('role').setDescription('Role to mention').setRequired(false)),
  
  async execute(interaction) {
    if (!interaction.memberPermissions.has('ManageGuild')) {
      return interaction.reply({ content: 'You need Manage Server permission to use this.', flags: 64 });
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const color = interaction.options.getString('color') || '0099FF';
    const mention = interaction.options.getUser('mention');
    const role = interaction.options.getRole('role');

    let mentionText = '';
    if (mention) mentionText += `<@${mention.id}> `;
    if (role) mentionText += `<@&${role.id}> `;

    const embed = createEmbed({
      title,
      description: message,
      color: parseInt('0x' + color, 16),
      footer: `Announced by ${interaction.user.username}`
    });

    const content = mentionText ? mentionText : '';
    await interaction.reply({ content: content || null, embeds: [embed] });
  }
};

