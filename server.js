const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { URL } = require('url');

const app = express();
const publicPath = path.join(__dirname, 'public');

app.use(cors());
app.use(express.static(publicPath));

// Dynamically proxy all resource types
app.get('/fetch', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('Missing URL parameter');

  try {
    const response = await fetch(target);
    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);

    const baseUrl = new URL(target);

    // Handle text-based content with rewriting
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Rewrites <link>, <script>, <img>, etc.
      html = html.replace(/(href|src)=["'](.*?)["']/g, (match, attr, url) => {
        if (url.startsWith('http') || url.startsWith('//')) {
          return `${attr}="/fetch?url=${encodeURIComponent(url)}"`;
        } else if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:')) {
          return match;
        } else {
          const full = new URL(url, baseUrl).toString();
          return `${attr}="/fetch?url=${encodeURIComponent(full)}"`;
        }
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else if (contentType.includes('text/css')) {
      let css = await response.text();

      // Rewrite url(...) inside CSS
      css = css.replace(/url\(["']?(.*?)["']?\)/g, (match, url) => {
        if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('//')) {
          return `url("/fetch?url=${encodeURIComponent(url)}")`;
        } else {
          const full = new URL(url, baseUrl).toString();
          return `url("/fetch?url=${encodeURIComponent(full)}")`;
        }
      });

      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    } else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      const js = await response.text();

      // JS rewriting is tricky, so for now we just serve it
      res.setHeader('Content-Type', contentType);
      res.send(js);
    } else {
      // Stream binary resources (images, fonts, etc.)
      response.headers.forEach((value, key) => res.setHeader(key, value));
      response.body.pipe(res);
    }

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🟢 Proxy running at http://localhost:${PORT}`);
});
