const { searchGif } = require('../lib/gif');

module.exports = {
  name: 'hug',
  description: 'Hug another user',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const url = await searchGif('hug');
    await message.channel.send({ content: `${message.author.tag} hugs ${target.tag}!`, files: [url] }).catch(()=>{});
  }
};
