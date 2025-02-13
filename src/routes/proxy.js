const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer'
        });
        res.set(response.headers);
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

module.exports = router;