const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../lib/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a DM to a user')
    .addUserOption(o => o.setName('user').setDescription('User to DM').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const messageText = interaction.options.getString('message');

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot DM yourself!', flags: 64 });
    }

    if (user.bot) {
      return interaction.reply({ content: 'You cannot DM bots!', flags: 64 });
    }

    try {
      const embed = createEmbed({
        title: '📨 You got a message!',
        description: messageText,
        footer: `From: ${interaction.user.username}`,
        fields: [
          { name: 'Server', value: interaction.guild?.name || 'Unknown', inline: true }
        ]
      });

      await user.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ DM sent to ${user.username}!`, flags: 64 });
    } catch (error) {
      console.error('DM error:', error);
      await interaction.reply({ content: `❌ Could not send DM to ${user.username}. They may have DMs disabled.`, flags: 64 });
    }
  }
};

