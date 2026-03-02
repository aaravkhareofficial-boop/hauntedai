const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),
  async execute(interaction) {
    try {
      const q = interaction.options.getString('question');
      const responses = [
        'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes – definitely.', 'You may rely on it.',
        'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
        "Don't count on it.", 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
      ];
      const res = responses[Math.floor(Math.random()*responses.length)];
      await interaction.reply({ content: `🎱 ${res}` });
    } catch (e) {
      console.error('8ball error', e);
      try { await interaction.reply({ content: 'Could not answer right now.', flags: 64 }); } catch(_){}
    }
  }
};

