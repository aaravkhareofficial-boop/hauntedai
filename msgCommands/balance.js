const { getUser, CURRENCY } = require('../lib/economy');

module.exports = {
  name: 'balance',
  description: 'Show economy balance',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const user = getUser(target.id);
    await message.channel.send(`${target.tag} has **${user.balance}** ${CURRENCY}`).catch(()=>{});
  }
};
