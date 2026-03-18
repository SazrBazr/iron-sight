const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); 

const app = express();
app.use(cors());

// 1. UPDATE THIS PROXY REGULARLY
// If it fails, go to spys.one and get a NEW "Green" IP
const proxyUrl = 'http://129.159.159.78:3128'; // I updated this to a newer one from your list
const agent = new HttpsProxyAgent(proxyUrl);

let cityCoordinates = {};

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

app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            httpsAgent: agent,
            proxy: false,
            // 🚨 FIX 1: Oref uses a specific encoding that can break Axios
            responseType: 'arraybuffer', 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
                'Referer': 'https://www.oref.org.il/',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            timeout: 8000 
        });

        // 🚨 FIX 2: Convert the "buffer" back to a readable string (Hebrew support)
        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data).trim();

        // 🚨 FIX 3: If Oref returns nothing, it means there are NO active sirens
        if (!decodedText || decodedText.length < 5) {
            return res.json({ active: false, alerts: [], message: "No active alerts" });
        }

        const rawData = JSON.parse(decodedText);

        const enrichedAlerts = rawData.data.map(location => ({
            location: location.trim(),
            coords: cityCoordinates[location.trim()] || null,
            origin: "Verifying...", 
            type: rawData.title 
        }));

        res.json({ active: true, alerts: enrichedAlerts });

    } catch (e) {
        console.error("Fetch Error:", e.message);
        // If it's a proxy error, let the frontend know
        res.status(200).json({ active: false, alerts: [], error: "Waiting for proxy..." });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        console.log("📜 Fetching 24h History via Proxy...");
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            httpsAgent: agent, // 🚨 CRITICAL: Use the Israeli proxy here too!
            proxy: false,
            responseType: 'arraybuffer',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.oref.org.il/he/alerts-history',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            timeout: 10000
        });

        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data);
        const historyData = JSON.parse(decodedText);

        // Map and clean the data
        const enrichedHistory = historyData.map(item => ({
            location: item.data.trim(),
            time: item.alertDate,
            type: item.title,
            coords: cityCoordinates[item.data.trim()] || null
        }));

        res.json(enrichedHistory);
    } catch (e) {
        console.error("❌ History Fetch Failed:", e.message);
        res.status(500).json({ error: 'History currently unavailable' });
    }
});

const PORT = process.env.PORT || 3001;
loadCityData().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Smart Backend live on port ${PORT}`);
    });
});