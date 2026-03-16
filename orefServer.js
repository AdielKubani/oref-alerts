const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// הגדרות Socket.io עם תמיכה ב-CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

// פונקציה לייצור User-Agent רנדומלי
const getUserAgent = () => {
    const versions = ['120.0.0.0', '121.0.0.0', '122.0.0.0', '123.0.0.0'];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion} Safari/537.36`;
};

let lastAlertId = null;

// פונקציה למשיכת נתונים מפיקוד העורף והפצה למנויים
const checkOrefAlerts = async () => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            timeout: 5000,
            headers: {
                'Host': 'www.oref.org.il',
                'Connection': 'keep-alive',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': getUserAgent(),
                'Accept': '*/*',
                'Referer': 'https://www.oref.org.il/he/alerts-history/current-alerts',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        const data = response.data;

        // בדיקה אם יש התראה חדשה (ID שונה מהפעם האחרונה)
        if (response.status === 200 && data && data.id !== lastAlertId) {
            lastAlertId = data.id;
            console.log('New Alert Detected:', data.data);
            // שליחת ההתראה לכל מי שגולש באתר ברגע זה
            io.emit('alert-update', {
                alerts: data.data,
                id: data.id,
                time: new Date().toLocaleTimeString('he-IL')
            });
        } else if (response.status === 204 || !data) {
            // מצב שגרה - אין התראות
            if (lastAlertId !== null) {
                lastAlertId = null;
                io.emit('alert-update', { alerts: [], id: 0 });
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            io.emit('server-error', { message: 'IP Blocked by Oref (403)' });
        }
        console.error('Oref Fetch Error:', error.message);
    }
};

// לולאת בדיקה בשרת - כל 2 שניות
setInterval(checkOrefAlerts, 2000);

app.get('/', (req, res) => {
    res.send('Oref WebSocket Proxy is Running!');
});

// ניהול חיבורי לקוחות
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // שליחת מצב נוכחי למתחבר חדש
    socket.emit('status', { connected: true, monitoring: true });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket Server active on port ${PORT}`);
});