const express = require('express');
const cors = require('cors');
const axios = require('axios');

const { HttpsProxyAgent } = require('https-proxy-agent'); 

const app = express();

app.use(cors());

// 1. PROXY SETUP (Using the IP from your screenshot)
// Note: If this IP dies, grab a new green one from spys.one/free-proxy-list/IL/
const proxyUrl = 'http://51.4.59.110:1080'; 
const agent = new HttpsProxyAgent(proxyUrl);

let cityCoordinates = {};

// 2. LOAD CITY DATABASE
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

// 3. ALERT ENDPOINT
app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            httpsAgent: agent, // Tells Oref we are in Israel
            proxy: false,
            headers: { 
                'User-Agent': 'Mozilla/5.0', 
                'Referer': 'https://www.oref.org.il/',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 5000 
        });

        const rawData = response.data;
        if (!rawData || !rawData.data) return res.json({ active: false, alerts: [] });

        const enrichedAlerts = rawData.data.map(location => ({
            location: location.trim(),
            coords: cityCoordinates[location.trim()] || null,
            origin: "Verifying via OSINT...", 
            type: rawData.title 
        }));

        res.json({ active: true, alerts: enrichedAlerts });
    } catch (e) {
        console.error("API Error:", e.message);
        res.status(500).json({ error: 'API/Proxy connection failed' });
    }
});

// 4. RENDER PORT BINDING
const PORT = process.env.PORT || 3001;
loadCityData().then(() => {
    // We bind to 0.0.0.0 so Render can route external traffic to your app
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Smart Backend live on port ${PORT}`);
    });
});