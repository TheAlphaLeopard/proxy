const express = require('express');
const axios = require('axios');
const router = express.Router();
const cheerio = require('cheerio');
const path = require('path');

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        console.error('URL is required');
        return res.status(400).send('URL is required');
    }

    console.log(`Proxying request to: ${targetUrl}`);

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml,text/css,application/javascript,image/*'
            }
        });

        const contentType = response.headers['content-type'];
        
        // Handle non-HTML files (images, CSS, JS, etc.)
        if (contentType && !contentType.includes('text/html')) {
            const ext = path.extname(targetUrl).toLowerCase();
            let finalContentType = contentType;

            // Ensure correct content type for common files
            if (ext === '.css' && !contentType.includes('text/css')) {
                finalContentType = 'text/css';
            } else if (ext === '.js' && !contentType.includes('javascript')) {
                finalContentType = 'application/javascript';
            }

            res.set('Content-Type', finalContentType);
            res.set('Access-Control-Allow-Origin', '*');
            return res.send(response.data);
        }

        // Handle HTML content
        const $ = cheerio.load(response.data.toString('utf8'));

        // Regular expression to match specific file extensions
        const fileExtensionRegex = /\.(js|css|png|ico|jpg|jpeg|svg|gif|json|wasm|data|unityweb)$/i;

        // Function to update URLs and load files
        const updateUrls = async () => {
            // Update URLs in src attributes and load files
            $('[src]').each((_, element) => {
                const src = $(element).attr('src');
                if (src && !src.startsWith('http') && !src.startsWith('//')) {
                    try {
                        // Maintain the directory structure by using the full URL as base
                        const absoluteUrl = new URL(src, targetUrl).href;
                        $(element).attr('src', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
                        console.log(`Updated src: ${src} -> ${absoluteUrl}`);
                    } catch (error) {
                        console.error(`Error updating src: ${src}`, error);
                    }
                }
            });

            // Update URLs in href attributes
            $('[href]').each((_, element) => {
                let href = $(element).attr('href');
                if (href && !src.startsWith('http') && !src.startsWith('//') && fileExtensionRegex.test(href)) {
                    try {
                        // Maintain the directory structure by using the full URL as base
                        const absoluteUrl = new URL(href, targetUrl).href;
                        $(element).attr('href', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
                        console.log(`Updated href: ${href} -> ${absoluteUrl}`);
                    } catch (error) {
                        console.error(`Error updating href: ${href}`, error);
                    }
                }
            });

            // Update URLs in style tags and inline styles
            $('style').each((_, element) => {
                let css = $(element).html();
                css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match, url) => {
                    if (!url.startsWith('http') && !url.startsWith('//')) {
                        const absoluteUrl = new URL(url, targetUrl).href;
                        return `url("/proxy?url=${encodeURIComponent(absoluteUrl)}")`;
                    }
                    return match;
                });
                $(element).html(css);
            });

            res.send($.html());
        };

        // Call the updateUrls function
        await updateUrls();

    } catch (error) {
        console.error(`Error fetching data from ${targetUrl}:`, error.message);
        res.status(500).send(`Error fetching data from ${targetUrl}: ${error.message}`);
    }
});

module.exports = router;