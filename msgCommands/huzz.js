const { searchGif } = require('../lib/gif');

module.exports = {
  name: 'huzz',
  description: 'Praise another user for looking great',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    // use a query that encourages a complimentary/good-looking gif
    const url = await searchGif('compliment');
    await message.channel.send({ content: `${message.author.tag} huzzes ${target.tag} for looking amazing!`, files: [url] }).catch(()=>{});
  }
};
