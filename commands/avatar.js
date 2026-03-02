const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Get a user's avatar")
    .addUserOption(opt => opt.setName('user').setDescription('User to get avatar of').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    await interaction.reply({ content: `${user.tag}'s avatar: ${user.displayAvatarURL({ dynamic: true, size: 1024 })}` });
  }
};

