const { SlashCommandBuilder } = require('@discordjs/builders');

const MEMES = [
  'https://i.imgur.com/AfFp7pu.png',
  'https://i.imgur.com/3GvwNBf.png',
  'https://i.imgur.com/8Km9tLL.jpg'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Show a random meme'),
  async execute(interaction) {
    const url = MEMES[Math.floor(Math.random() * MEMES.length)];
    await interaction.reply({ content: url });
  }
};

