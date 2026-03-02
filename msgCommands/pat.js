const { searchGif } = require('../lib/gif');

module.exports = {
  name: 'pat',
  description: 'Pat another user',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const url = await searchGif('pat');
    await message.channel.send({ content: `${message.author.tag} pats ${target.tag}.`, files: [url] }).catch(()=>{});
  }
};
