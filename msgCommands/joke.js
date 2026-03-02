const fetch = globalThis.fetch || require('node-fetch');

module.exports = {
  name: 'joke',
  description: 'Tell a random joke',
  async execute(message) {
    try {
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      if (!res.ok) throw new Error('fetch failed');
      const j = await res.json();
      await message.channel.send(`${j.setup}\n${j.punchline}`);
    } catch (e) {
      console.error('joke fetch error', e);
      await message.channel.send('Could not fetch a joke right now. Try again later.');
    }
  }
};
