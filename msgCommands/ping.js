module.exports = {
  name: 'ping',
  description: 'Pong! Shows latency',
  async execute(message, args) {
    const sent = await message.channel.send('Pinging...');
    const latency = Math.round(message.client.ws.ping);
    const rtt = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(`Pong! WS: ${latency}ms | RTT: ${rtt}ms`).catch(()=>{});
  }
};
