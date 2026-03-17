const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());

let cityCoordinates = {};

// 1. Fetch ALL Israeli cities and coordinates from the gov database on startup
async function loadCityData() {
    try {
        console.log("🛰️ Loading global city database...");
        // Using the Gov Data API for all Israeli settlements
        const res = await axios.get('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78ad88-283a-4c5c-91ce-15cf1a4d1f08&limit=1500');
        res.data.result.records.forEach(city => {
            // Mapping Hebrew names to their lat/lng
            cityCoordinates[city.name_he] = {
                lat: parseFloat(city.lat),
                lng: parseFloat(city.lng)
            };
        });
        console.log(`✅ Loaded ${Object.keys(cityCoordinates).length} cities.`);
    } catch (e) {
        console.error("Failed to load gov city data. Using fallback.");
    }
}

app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.oref.org.il/' }
        });

        const rawData = response.data;
        if (!rawData || !rawData.data) return res.json({ active: false, alerts: [] });

        // Enrich the data with coordinates and (placeholder for now) OSINT origin
        const enrichedAlerts = rawData.data.map(location => ({
            location,
            coords: cityCoordinates[location.trim()] || null,
            // We set this to "Verifying..." instead of guessing
            origin: "Verifying via OSINT...", 
            type: rawData.title // e.g., "חדירת כלי טיס עוין"
        }));

        res.json({ active: true, alerts: enrichedAlerts });
    } catch (e) {
        res.status(500).json({ error: 'Offline' });
    }
});

loadCityData().then(() => {
    app.listen(3001, () => console.log('🚀 Smart Backend running on http://localhost:3001'));
});