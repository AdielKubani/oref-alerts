const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // מאפשר לאתר שלך לגשת לשרת הזה

app.get('/api/alerts', async (req, res) => {
  try {
    const response = await axios.get('[https://www.oref.org.il/WarningMessages/alert/alerts.json](https://www.oref.org.il/WarningMessages/alert/alerts.json)', {
      headers: {
        'Referer': '[https://www.oref.org.il/](https://www.oref.org.il/)',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // אם אין התראות, פיקוד העורף מחזיר דף ריק או 204
    if (response.status === 204 || !response.data) {
      return res.json({ data: [], id: 0 });
    }
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Oref' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
