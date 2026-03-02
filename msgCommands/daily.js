const econ = require('../lib/economy');

module.exports = {
  name: 'daily',
  description: 'Collect daily crystals',
  async execute(message, args) {
    const id = message.author.id;
    const user = econ.getUser(id);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (user.lastDaily && (now - user.lastDaily) < ONE_DAY) {
      const remaining = Math.ceil((ONE_DAY - (now - user.lastDaily)) / 1000);
      return message.reply(`You need to wait ${remaining} seconds to collect daily again.`);
    }
    user.balance = (user.balance || 0) + 200;
    user.lastDaily = now;
    econ.setUser(id, user);
    return message.channel.send(`${message.author.tag} collected 200 ${econ.CURRENCY}. New balance: ${user.balance}`);
  }
};
