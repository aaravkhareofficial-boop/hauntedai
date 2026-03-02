const econ = require('../lib/economy');

module.exports = {
  name: 'pay',
  description: 'Pay crystals to another user',
  async execute(message, args) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(()=>null) : null);
    const amount = parseInt((message.mentions.users.first() ? args[1] : args[1]) || args[1], 10);
    if (!target || !amount) return message.reply('Usage: !pay @user <amount>');
    if (amount <= 0) return message.reply('Amount must be positive.');

    const success = econ.transfer(message.author.id, target.id, amount);
    if (!success) return message.reply('Insufficient funds.');

    return message.channel.send(`${message.author.tag} paid ${amount} ${econ.CURRENCY} to ${target.tag}.`);
  }
};
