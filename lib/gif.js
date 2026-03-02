const fetch = globalThis.fetch || require('node-fetch');

const FALLBACK = {
  hug: [
    'https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif',
    'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'https://media.giphy.com/media/BdghqgSQn7pBC/giphy.gif',
    'https://media.giphy.com/media/3M9orsipGR58z0TDqM/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/xUPGcguWQa5z9g8SaQ/giphy.gif'
  ],
  huzz: [
    'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
    'https://media.giphy.com/media/3o7TKyPKWJFr2auq76/giphy.gif',
    'https://media.giphy.com/media/l0HlQaQ1R91A3NwLK/giphy.gif',
    'https://media.giphy.com/media/l3q2XhfQ7PoUf0LDi/giphy.gif',
    'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif'
  ],
  slap: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif'
  ],
  pat: [
    'https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif',
    'https://media.giphy.com/media/109ltuoSQT212w/giphy.gif'
  ],
  kiss: [
    'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif'
  ]
};

async function searchGif(query) {
  const key = process.env.TENOR_KEY;
  if (key) {
    try {
      const url = `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${key}&limit=8`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.results && data.results.length) {
        // pick a random result
        const r = data.results[Math.floor(Math.random() * data.results.length)];
        // try media or url
        if (r && r.media && r.media[0] && r.media[0].gif && r.media[0].gif.url) return r.media[0].gif.url;
        if (r && r.url) return r.url;
      }
    } catch (e) {
      // ignore and fall back
    }
  }

  // fallback: use curated lists
  const keyLower = query.toLowerCase();
  if (keyLower.includes('hug')) return FALLBACK.hug[Math.floor(Math.random()*FALLBACK.hug.length)];
  if (keyLower.includes('huzz') || keyLower.includes('compliment')) return FALLBACK.huzz[Math.floor(Math.random()*FALLBACK.huzz.length)];
  if (keyLower.includes('slap')) return FALLBACK.slap[Math.floor(Math.random()*FALLBACK.slap.length)];
  if (keyLower.includes('pat')) return FALLBACK.pat[Math.floor(Math.random()*FALLBACK.pat.length)];
  if (keyLower.includes('kiss')) return FALLBACK.kiss[Math.floor(Math.random()*FALLBACK.kiss.length)];

  // generic fallback: return a random hug
  return FALLBACK.hug[Math.floor(Math.random()*FALLBACK.hug.length)];
}

module.exports = { searchGif };

