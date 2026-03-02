const ai = require('../lib/ai');

module.exports = {
  name: 'resetai',
  description: 'Reset your AI conversation history and persona: !resetai',
  async execute(message) {
    ai.clearSession(message.author.id);
    await message.channel.send('Your AI session has been reset.');
  }
};
