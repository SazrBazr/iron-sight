const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// The official Home Front Command URL
const OREF_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';

// Oref blocks requests that don't look like they come from a real browser.
// These headers spoof a standard web browser request.
const OREF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.oref.org.il/',
    'X-Requested-With': 'XMLHttpRequest'
};

// This endpoint will be called by your beautiful frontend
app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get(OREF_URL, { headers: OREF_HEADERS });
        
        // If no alerts, Oref returns an empty string or nothing
        if (!response.data || !response.data.data) {
            return res.json({ active: false, alerts: [] });
        }

        // Oref sends "data" as an array of cities. 
        // We map each city to its own alert object so the frontend can loop easily.
        const formattedAlerts = response.data.data.map(cityName => ({
            location: cityName,
            type: response.data.title, // e.g., "חדירת כלי טיס עוין"
            id: response.data.id
        }));

        res.json({
            active: true,
            alerts: formattedAlerts
        });

    } catch (error) {
        res.json({ active: false, alerts: [] });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚨 Alert Server running on http://localhost:${PORT}`);
    console.log(`Test the endpoint by visiting: http://localhost:${PORT}/api/alerts`);
});