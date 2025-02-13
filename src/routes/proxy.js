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
            $('a, link, img, script').each((_, element) => {
                const attr = $(element).attr('href') || $(element).attr('src');
                if (attr && !attr.startsWith('http') && !attr.startsWith('//')) {
                    const newAttr = new URL(attr, targetUrl).href;
                    if ($(element).attr('href')) {
                        $(element).attr('href', newAttr);
                        console.log(`Updated href: ${attr} -> ${newAttr}`);
                    } else {
                        $(element).attr('src', newAttr);
                        console.log(`Updated src: ${attr} -> ${newAttr}`);
                    }
                }
            });
            res.send($.html());
        } else if (contentType && contentType.startsWith('image/')) {
            res.set(response.headers);
            res.send(response.data);
        } else {
            res.set(response.headers);
            res.send(response.data);
        }
    } catch (error) {
        console.error(`Error fetching data from ${targetUrl}:`, error.message);
        res.status(500).send('Error fetching data');
    }
});

module.exports = router;