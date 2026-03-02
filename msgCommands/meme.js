const fetch = globalThis.fetch || require('node-fetch');

module.exports = {
  name: 'meme',
  description: 'Fetch a random meme from the internet',
  async execute(message) {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const title = data.title || 'Meme';
      const url = data.url;
      const post = data.postLink;
      await message.channel.send(`${title}\n${post}`, { files: [url] }).catch(()=>{});
    } catch (e) {
      console.error('meme fetch error', e);
      await message.channel.send('Could not fetch a meme right now. Try again later.');
    }
  }
};
