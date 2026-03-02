const { searchGif } = require('../lib/gif');

module.exports = {
  name: 'kiss',
  description: 'Kiss another user',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const url = await searchGif('kiss');
    await message.channel.send({ content: `${message.author.tag} kisses ${target.tag}!`, files: [url] }).catch(()=>{});
  }
};
