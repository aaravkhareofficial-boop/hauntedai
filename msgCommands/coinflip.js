module.exports = {
  name: 'coinflip',
  description: 'Flip a coin',
  async execute(message) {
    const res = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await message.channel.send(`${message.author.tag} flipped a coin: **${res}**`).catch(()=>{});
  }
};
