const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// הגדרות CORS - מאפשרות לאתר שלך לגשת לשרת
app.use(cors({
    origin: '*' // בייצור כדאי להגביל לכתובת האתר שלך
}));

// דף נחיתה בסיסי לבדיקה שהשרת עובד
app.get('/', (req, res) => {
    res.send('Oref Alert Proxy is Running! Endpoint: /api/alerts');
});

// הנתיב המרכזי שמושך את הנתונים
app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            timeout: 5000, // מחכה מקסימום 5 שניות
            headers: {
                'Referer': 'https://www.oref.org.il/',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        // בדיקה אם הוחזרו נתונים (סטטוס 204 אומר שאין התראות כרגע)
        if (response.status === 204 || !response.data || response.data === "") {
            return res.json({ data: [], id: 0 });
        }

        res.json(response.data);
    } catch (error) {
        // הדפסת שגיאה מפורטת ללוגים של Render
        console.error('--- Oref Fetch Error ---');
        console.error('Message:', error.message);
        
        if (error.response) {
            // השרת של פיקוד העורף ענה עם שגיאה (למשל 403 - חסום)
            console.error('Status:', error.response.status);
            return res.status(error.response.status).json({ 
                error: 'Oref server responded with error',
                status: error.response.status,
                message: 'פיקוד העורף חוסם את הבקשה (ייתכן בגלל IP של השרת)'
            });
        } else if (error.request) {
            // הבקשה נשלחה אך לא התקבלה תשובה (Time out)
            console.error('No response received');
            return res.status(504).json({ error: 'Timeout connecting to Oref' });
        } else {
            return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
