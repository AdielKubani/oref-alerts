const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// הגדרות CORS - פתיחת גישה לכל המקורות
app.use(cors({
    origin: '*'
}));

// פונקציה לייצור User-Agent רנדומלי קלות למניעת זיהוי קבוע
const getUserAgent = () => {
    const versions = ['120.0.0.0', '121.0.0.0', '122.0.0.0', '123.0.0.0'];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion} Safari/537.36`;
};

app.get('/', (req, res) => {
    res.send('Oref Alert Proxy is Running! Check /api/alerts');
});

app.get('/api/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            timeout: 3000, // הגדלת זמן ההמתנה ל-8 שניות
            headers: {
                'Host': 'www.oref.org.il',
                'Connection': 'keep-alive',
                'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'X-Requested-With': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?0',
                'User-Agent': getUserAgent(),
                'sec-ch-ua-platform': '"Windows"',
                'Accept': '*/*',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://www.oref.org.il/he/alerts-history/current-alerts',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        // טיפול במצב שבו אין התראות (סטטוס 204)
        if (response.status === 204 || !response.data || response.data === "") {
            return res.json({ data: [], id: 0 });
        }

        res.json(response.data);
    } catch (error) {
        console.error('--- Oref Fetch Error ---');
        
        if (error.response) {
            // טיפול בשגיאת 403 (חסימה)
            const status = error.response.status;
            console.error(`Status: ${status}`);
            
            if (status === 403) {
                return res.status(403).json({ 
                    error: 'Forbidden',
                    status: 403,
                    message: 'שרתי פיקוד העורף חוסמים את השרת הנוכחי. ייתכן וטווח ה-IP של Render נחסם.',
                    suggestion: 'נסה לבצע פריסה מחדש (Manual Deploy) לקבלת IP חדש.'
                });
            }
            
            return res.status(status).json({ error: 'Oref server error', status });
        } else {
            console.error('Error Message:', error.message);
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is active on port ${PORT}`);
});