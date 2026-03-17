const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());

let lastAlertId = null;
let cookies = ''; // שמירת עוגיות מהאתר

// פונקציה לקבלת עוגיות טריות מפיקוד העורף
const refreshCookies = async () => {
    try {
        const response = await axios.get('https://www.oref.org.il/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        if (response.headers['set-cookie']) {
            cookies = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            console.log('[System] Cookies refreshed successfully');
        }
    } catch (error) {
        console.error('[Error] Failed to refresh cookies:', error.message);
    }
};

// רענון עוגיות פעם ב-10 דקות
setInterval(refreshCookies, 10 * 60 * 1000);
refreshCookies();

const checkOrefAlerts = async () => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            timeout: 5000,
            headers: {
                'Host': 'www.oref.org.il',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://www.oref.org.il/he/alerts-history/current-alerts',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cookie': cookies // שימוש בעוגיות שקיבלנו
            }
        });

        const data = response.data;

        if (response.status === 200 && data && data.id !== lastAlertId) {
            lastAlertId = data.id;
            io.emit('alert-update', {
                alerts: data.data,
                id: data.id,
                time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
        } else if (response.status === 204 || !data || data === "") {
            if (lastAlertId !== null) {
                lastAlertId = null;
                io.emit('alert-update', { alerts: [], id: 0 });
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('[Status] 403 Forbidden - Oref is blocking this IP');
            io.emit('server-error', { 
                message: 'חסימת IP (403). פיקוד העורף מזהה את Render כשרת ענן. מנסה לרענן עוגיות...' 
            });
            refreshCookies(); // נסיון רענון מיידי בעת חסימה
        }
    }
};

setInterval(checkOrefAlerts, 2000);

app.get('/', (req, res) => res.send('Oref Stealth Proxy is Running'));

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('status', { connected: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));