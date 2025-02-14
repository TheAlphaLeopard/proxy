const express = require('express');
const axios = require('axios');
const router = express.Router();
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        console.error('URL is required');
        return res.status(400).send('URL is required');
    }

    console.log(`Proxying request to: ${targetUrl}`);

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
            const $ = cheerio.load(response.data.toString('utf8'));

            // Regular expression to match specific file extensions
            const fileExtensionRegex = /\.(js|css|png|ico|jpg|svg|gif|json|wasm|data|unityweb)$/;

            // Function to update URLs
            const updateUrls = () => {
                // Update URLs in src attributes
                $('[src]').each((_, element) => {
                    const src = $(element).attr('src');
                    if (src && !src.startsWith('http') && !src.startsWith('//') && fileExtensionRegex.test(src)) {
                        const newSrc = new URL(src, targetUrl).href;
                        $(element).attr('src', newSrc);
                        console.log(`Updated src: ${src} -> ${newSrc}`);
                    }
                });

                // Update URLs in href attributes
                $('[href]').each((_, element) => {
                    let href = $(element).attr('href');
                    if (href && !href.startsWith('http') && !href.startsWith('//')) {
                        if (!fileExtensionRegex.test(href) && href.endsWith('/')) {
                            href += 'index.html';
                        }
                        const newHref = new URL(href, targetUrl).href;
                        $(element).attr('href', newHref);
                        console.log(`Updated href: ${href} -> ${newHref}`);
                    }
                });

                res.send($.html());
            };

            // Directly call the updateUrls function
            updateUrls();
        } else if (contentType && contentType.startsWith('image/')) {
            res.set(response.headers);
            res.send(response.data);
        } else {
            res.set(response.headers);
            res.send(response.data);
        }
    } catch (error) {
        console.error(`Error fetching data from ${targetUrl}:`, error.message);
        res.status(500).send(`Error fetching data from ${targetUrl}: ${error.message}`);
    }
});

module.exports = router;