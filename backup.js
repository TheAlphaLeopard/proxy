const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
}
);

app.get('/fetch', async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    const response = await fetch(target);
    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);

    if (contentType.includes('text/html')) {
      let html = await response.text();

      const baseUrl = new URL(target);

      // Rewrite links to go through the proxy
      html = html.replace(/(href|src)=["'](.*?)["']/g, (match, attr, url) => {
        if (url.startsWith('http') || url.startsWith('//')) {
          // Absolute URL
          return `${attr}="/fetch?url=${encodeURIComponent(url)}"`;
        } else if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:')) {
          return match; // don't rewrite these
        } else {
          // Relative URL
          const full = new URL(url, baseUrl).toString();
          return `${attr}="/fetch?url=${encodeURIComponent(full)}"`;
        }
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      // Pass through all other types (images, etc.)
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      response.body.pipe(res);
    }
  } catch (err) {
    console.error('Proxy fetch error:', err.message);
    res.status(500).send('Proxy error');
  }
});


// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
