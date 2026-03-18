const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// NO PROXY NEEDED! The server is already in Israel.

const stealthHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.oref.org.il/he/alerts-history',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache'
};

let cityCoordinates = {};

// Load City Data
async function loadCityData() {
    try {
        console.log("🛰️ Loading global city database...");
        const res = await axios.get('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78ad88-283a-4c5c-91ce-15cf1a4d1f08&limit=1500');
        res.data.result.records.forEach(city => {
            cityCoordinates[city.name_he.trim()] = {
                lat: parseFloat(city.lat),
                lng: parseFloat(city.lng)
            };
        });
        console.log(`✅ Loaded ${Object.keys(cityCoordinates).length} cities.`);
    } catch (e) {
        console.error("❌ Failed to load gov city data.");
    }
}

// Live Alerts
app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get(`https://www.oref.org.il/WarningMessages/alert/alerts.json?v=${Date.now()}`, {
            responseType: 'arraybuffer',
            headers: stealthHeaders,
            timeout: 5000 
        });

        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data).trim();

        if (!decodedText || decodedText.length < 5 || decodedText === "null") {
            return res.json({ active: false, alerts: [] });
        }

        const rawData = JSON.parse(decodedText);
        const enrichedAlerts = rawData.data.map(location => ({
            location: location.trim(),
            coords: cityCoordinates[location.trim()] || null,
            origin: "Live Radar", 
            type: rawData.title 
        }));

        res.json({ active: true, alerts: enrichedAlerts });
    } catch (e) {
        res.json({ active: false, alerts: [] });
    }
});

// 24h History
app.get('/api/history', async (req, res) => {
    try {
        const response = await axios.get(`https://www.oref.org.il/WarningMessages/History/AlertsHistory.json?v=${Date.now()}`, {
            responseType: 'arraybuffer',
            headers: stealthHeaders,
            timeout: 8000
        });

        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data).trim();
        const historyData = JSON.parse(decodedText);

        const enrichedHistory = historyData.map(item => ({
            location: item.data.trim(),
            time: item.alertDate,
            type: item.title,
            coords: cityCoordinates[item.data.trim()] || null
        }));

        res.json(enrichedHistory);
    } catch (e) {
        res.status(500).json({ error: 'History offline' });
    }
});

const PORT = process.env.PORT || 3001;
loadCityData().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Israeli Backend live on port ${PORT}`);
    });
});