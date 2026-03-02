const ai = require('../lib/ai');

module.exports = {
  name: 'ai',
  description: 'Chat with the AI bot: !ai <message>',
  async execute(message, args) {
    const q = args.join(' ').trim();
    if (!q) return message.reply('Usage: !ai <your message>');
    await message.channel.send(`${message.author.tag} — thinking...`).catch(()=>{});
    const reply = await ai.generateReply(message.author.id, q);
    // send the reply as a message (avoid flooding)
    await message.channel.send(reply).catch(()=>{});
  }
};
