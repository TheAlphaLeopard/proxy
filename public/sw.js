self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
  
    // Let local files (like index.html, sw.js) through
    if (requestUrl.origin === location.origin) return;
  
    // Proxy everything else through our backend
    const target = encodeURIComponent(event.request.url);
    event.respondWith(fetch(`/fetch?url=${target}`));
  });
  