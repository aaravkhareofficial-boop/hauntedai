module.exports = {
  name: 'roll',
  description: 'Roll dice using NdM format (e.g., 2d6)',
  async execute(message, args) {
    const expr = args[0] || '1d6';
    const m = expr.match(/^(\d+)?d(\d+)$/i);
    if (!m) return message.reply('Invalid format. Use NdM, e.g., 2d6').catch(()=>{});
    const n = parseInt(m[1] || '1', 10);
    const s = parseInt(m[2], 10);
    if (n <= 0 || s <= 0 || n > 100) return message.reply('Invalid dice numbers (max 100 rolls)').catch(()=>{});
    const rolls = [];
    for (let i=0;i<n;i++) rolls.push(1 + Math.floor(Math.random()*s));
    const total = rolls.reduce((a,b)=>a+b,0);
    await message.channel.send(`${message.author.tag} rolled ${expr}: [${rolls.join(', ')}] (total: ${total})`).catch(()=>{});
  }
};
