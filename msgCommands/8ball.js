module.exports = {
  name: '8ball',
  description: 'Ask the magic 8-ball a question',
  async execute(message, args) {
    const q = args.join(' ');
    if (!q) return message.reply('Ask a question: !8ball <your question>');
    const responses = [
      'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes – definitely.', 'You may rely on it.',
      'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
      'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
      "Don't count on it.", 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
    ];
    const res = responses[Math.floor(Math.random()*responses.length)];
    await message.channel.send(`🎱 ${res}`);
  }
};
