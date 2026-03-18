const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); 

const app = express();
app.use(cors());

// 1. PROXY SETUP
// Using a fresh HIA (High Anonymity) Israeli IP from your list.
// 🚨 If the logs say "Fetch Failed", replace this IP immediately.
const proxyUrl = 'http://81.218.96.226:8080'; 
const agent = new HttpsProxyAgent(proxyUrl);

// Stealth Headers to mimic a real Israeli user browsing Chrome on Windows
const stealthHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.oref.org.il/he/alerts-history',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

let cityCoordinates = {};

// 2. LOAD GLOBAL CITY DATABASE (Runs once on startup)
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
        console.error("❌ Failed to load gov city data. Map pins might fail.");
    }
}

// 3. LIVE ALERTS ENDPOINT
app.get('/api/alerts', async (req, res) => {
    try {
        // Cache-buster: adds a timestamp so the proxy doesn't serve old data
        const url = `https://www.oref.org.il/WarningMessages/alert/alerts.json?v=${Date.now()}`;

        const response = await axios.get(url, {
            httpsAgent: agent,
            proxy: false,
            responseType: 'arraybuffer', // Fix for Hebrew encoding
            headers: stealthHeaders,
            timeout: 10000 
        });

        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data).trim();

        // If response is empty, there are no sirens
        if (!decodedText || decodedText.length < 5 || decodedText === "null") {
            return res.json({ active: false, alerts: [] });
        }

        const rawData = JSON.parse(decodedText);
        console.log(`🚨 ALERT DETECTED: ${rawData.data.length} locations`);

        const enrichedAlerts = rawData.data.map(location => ({
            location: location.trim(),
            coords: cityCoordinates[location.trim()] || null,
            origin: "Verifying...", 
            type: rawData.title 
        }));

        res.json({ active: true, alerts: enrichedAlerts });
    } catch (e) {
        console.error("❌ Live Fetch Failed:", e.message);
        res.status(200).json({ active: false, alerts: [], error: "Proxy connection issue" });
    }
});

// 4. 24H HISTORY ENDPOINT
app.get('/api/history', async (req, res) => {
    try {
        console.log("📜 Fetching 24h History via Proxy...");
        const response = await axios.get(`https://www.oref.org.il/WarningMessages/History/AlertsHistory.json?v=${Date.now()}`, {
            httpsAgent: agent,
            proxy: false,
            responseType: 'arraybuffer',
            headers: stealthHeaders,
            timeout: 12000
        });

        const decoder = new TextDecoder('utf-16');
        const decodedText = decoder.decode(response.data).trim();

        if (!decodedText || decodedText === "null") {
            return res.json([]);
        }

        const historyData = JSON.parse(decodedText);
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

// 5. SERVER STARTUP
const PORT = process.env.PORT || 3001;
loadCityData().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Iron Sight Backend live on port ${PORT}`);
    });
});