const express = require('express');
const path = require('path');
const localistScrape = require('./localist_scrape');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, 'public')});
});

app.get('/localist-scrape', async (req, res) => {
    try {
        const query = req.query.q.trim();
    
        if (!query) {
            res.status(400).json({success: false});
        }

        const result = await localistScrape.scrape(query);
        res.status(200).json(result);
    
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false});
    }
});

 
app.listen(3000);